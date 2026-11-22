/**
 * Ruang Cerita — cerita 24 jam, penonton, reaksi, stiker polling/pertanyaan, sorotan.
 */
import prisma from '../config/db.js';
import { sendPushToMember } from '../services/webPush.js';
import {
  handle, fail, requireViewer, findUserByUsername, relationTo, shapeUser, PUBLIC_MEMBER,
  blockedIds, mutedIds, followingIds, closeFriendOf, notify, cleanText, saveUpload, removeFiles, HOURS
} from './core.js';
import { sendSystemShare } from './messages.js';

const BGS = ['sunset', 'peach', 'mint', 'sky', 'grape', 'night', 'clay'];
const EMOJIS = ['😂', '😮', '😍', '😢', '👏', '🔥', '🎉', '💯', '❤️'];

function parseSticker(raw) {
  if (!raw) return null;
  try {
    const s = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (s.type === 'poll') {
      const options = (s.options || []).map((o) => cleanText(o, 30)).filter(Boolean).slice(0, 2);
      if (options.length !== 2) return null;
      return { type: 'poll', q: cleanText(s.q, 80), options };
    }
    if (s.type === 'question') return { type: 'question', q: cleanText(s.q, 80) || 'Tanya aku apa saja' };
  } catch { /* stiker rusak diabaikan */ }
  return null;
}

/** Cerita yang boleh dilihat viewer dari satu penulis. */
async function canSeeStoriesOf(viewerId, authorId) {
  if (viewerId === authorId) return { ok: true, cf: true };
  const rel = await relationTo(viewerId, authorId);
  if (!rel.canSee) return { ok: false };
  const cf = await prisma.memberRelation.findFirst({ where: { ownerId: authorId, targetId: viewerId, type: 'CLOSE_FRIEND' }, select: { id: true } });
  return { ok: true, cf: !!cf };
}

/**
 * Baki cerita di beranda: saya dulu, lalu yang belum ditonton, lalu yang sudah.
 * Satu entri per akun, dengan tanda "teman dekat" (cincin hijau).
 */
export const tray = handle(async (req) => {
  const v = await requireViewer(req);
  const [following, blocked, muted, cf] = await Promise.all([followingIds(v.id), blockedIds(v.id), mutedIds(v.id), closeFriendOf(v.id)]);
  const publicIds = new Set((await prisma.rcProfile.findMany({ where: { isPrivate: false }, select: { memberId: true } })).map((x) => x.memberId));
  const authors = [...new Set([v.id, ...following])].filter((id) => !blocked.has(id) && !muted.has(id));
  const stories = await prisma.rcStory.findMany({
    where: { authorId: { in: authors }, removedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, authorId: true, audience: true, createdAt: true, author: { select: PUBLIC_MEMBER } }
  });
  const visible = stories.filter((s) => s.authorId === v.id || ((following.has(s.authorId) || publicIds.has(s.authorId)) && (s.audience !== 'CLOSE_FRIENDS' || cf.has(s.authorId))));
  const seen = new Set((await prisma.rcStoryView.findMany({ where: { viewerId: v.id, storyId: { in: visible.map((s) => s.id) } }, select: { storyId: true } })).map((x) => x.storyId));
  const groups = new Map();
  for (const s of visible) {
    if (!groups.has(s.authorId)) groups.set(s.authorId, { user: shapeUser(s.author), count: 0, unseen: 0, closeFriends: false, latestAt: s.createdAt, self: s.authorId === v.id });
    const g = groups.get(s.authorId);
    g.count++;
    if (!seen.has(s.id) && s.authorId !== v.id) g.unseen++;
    if (s.audience === 'CLOSE_FRIENDS') g.closeFriends = true;
    if (s.createdAt > g.latestAt) g.latestAt = s.createdAt;
  }
  const list = [...groups.values()].sort((a, b) => (b.self - a.self) || ((b.unseen > 0) - (a.unseen > 0)) || (b.latestAt - a.latestAt));
  return { items: list };
});

/** Semua cerita aktif satu akun (untuk penampil). */
export const userStories = handle(async (req) => {
  const v = await requireViewer(req);
  const u = await findUserByUsername(req.params.username);
  if (!u) fail(404, 'Akun tidak ditemukan.');
  const access = await canSeeStoriesOf(v.id, u.id);
  if (!access.ok) fail(403, 'Cerita akun ini hanya untuk pengikut.');
  const rows = await prisma.rcStory.findMany({
    where: { authorId: u.id, removedAt: null, expiresAt: { gt: new Date() }, ...(access.cf ? {} : { audience: 'FOLLOWERS' }) },
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { views: true } } }
  });
  const mine = u.id === v.id;
  const likeCounts = mine && rows.length
    ? new Map((await prisma.rcStoryView.groupBy({ by: ['storyId'], where: { storyId: { in: rows.map((r) => r.id) }, liked: true }, _count: { _all: true } })).map((x) => [x.storyId, x._count._all]))
    : new Map();
  const views = await prisma.rcStoryView.findMany({ where: { viewerId: v.id, storyId: { in: rows.map((r) => r.id) } } });
  const vmap = new Map(views.map((x) => [x.storyId, x]));
  const reacts = await prisma.rcStoryReaction.findMany({ where: { memberId: v.id, storyId: { in: rows.map((r) => r.id) } } });
  const rmap = new Map(reacts.map((x) => [x.storyId, x.emoji]));
  const pollCounts = await Promise.all(rows.map(async (r) => {
    const st = r.sticker ? JSON.parse(r.sticker) : null;
    if (st?.type !== 'poll') return null;
    const answers = await prisma.rcStoryView.groupBy({ by: ['answer'], where: { storyId: r.id, answer: { not: null } }, _count: { _all: true } });
    return st.options.map((o) => answers.find((a) => a.answer === o)?._count._all || 0);
  }));
  return {
    user: shapeUser(u),
    items: rows.map((r, i) => ({
      id: r.id, kind: r.kind, url: r.url, text: r.text, bg: r.bg, audience: r.audience,
      sticker: r.sticker ? JSON.parse(r.sticker) : null,
      pollCounts: (mine || vmap.get(r.id)?.answer) ? pollCounts[i] : null,
      myAnswer: vmap.get(r.id)?.answer || null,
      myReaction: rmap.get(r.id) || null,
      seen: vmap.has(r.id),
      liked: !!vmap.get(r.id)?.liked,
      viewCount: mine ? r._count.views : undefined,
      likeCount: mine ? likeCounts.get(r.id) || 0 : undefined,
      createdAt: r.createdAt, expiresAt: r.expiresAt
    }))
  };
});

export const createStory = handle(async (req) => {
  const v = await requireViewer(req);
  const audience = req.body.audience === 'CLOSE_FRIENDS' ? 'CLOSE_FRIENDS' : 'FOLLOWERS';
  const sticker = parseSticker(req.body.sticker);
  const text = cleanText(req.body.text, 300) || null;
  let media = null;
  if (req.file) media = await saveUpload(req.file, { maxSide: 1920, thumb: false });
  if (!media && !text) fail(400, 'Cerita harus berisi foto, video, atau teks.');
  const story = await prisma.rcStory.create({
    data: {
      authorId: v.id,
      kind: media ? media.kind : 'TEXT',
      url: media?.url || null,
      text,
      bg: BGS.includes(req.body.bg) ? req.body.bg : 'sunset',
      audience,
      sticker: sticker ? JSON.stringify(sticker) : null,
      expiresAt: new Date(Date.now() + HOURS(24))
    }
  });

  // Beritahu teman / pengikut (followers) tentang cerita baru
  prisma.follow.findMany({
    where: { followingId: v.id },
    select: { followerId: true }
  }).then((followers) => {
    for (const f of followers) {
      if (f.followerId !== v.id) {
        sendPushToMember(f.followerId, {
          title: `⏱️ Cerita Baru dari ${v.name || v.slug}`,
          body: text ? `${text.slice(0, 80)}` : 'Baru saja membagikan cerita baru di Ruang Cerita',
          icon: v.photoPath || '/media/logos/logo_pik-r.png',
          badge: '/media/logos/logo_pik-r.png',
          data: {
            url: `/${v.slug}`,
            category: 'RUANG_CERITA',
            type: 'NEW_STORY'
          }
        }).catch(() => {});
      }
    }
  }).catch(() => {});

  return { story: { id: story.id } };
});

export const deleteStory = handle(async (req) => {
  const v = await requireViewer(req);
  const s = await prisma.rcStory.findUnique({ where: { id: req.params.id }, include: { highlights: true } });
  if (!s || s.authorId !== v.id) fail(404, 'Cerita tidak ditemukan.');
  await prisma.rcStory.delete({ where: { id: s.id } });
  removeFiles(s.url);
  return { ok: true };
});

async function visibleStoryOr404(viewerId, storyId) {
  const s = await prisma.rcStory.findUnique({ where: { id: storyId } });
  if (!s || s.removedAt) fail(404, 'Cerita tidak ditemukan.');
  const access = await canSeeStoriesOf(viewerId, s.authorId);
  if (!access.ok || (s.audience === 'CLOSE_FRIENDS' && !access.cf)) fail(404, 'Cerita tidak ditemukan.');
  return s;
}

/** Tandai ditonton (+ jawaban polling/pertanyaan). */
export const viewStory = handle(async (req) => {
  const v = await requireViewer(req);
  const s = await visibleStoryOr404(v.id, req.params.id);
  if (s.authorId === v.id) return { ok: true };
  let answer;
  if (req.body?.answer !== undefined) {
    const st = s.sticker ? JSON.parse(s.sticker) : null;
    if (st?.type === 'poll' && st.options.includes(req.body.answer)) answer = req.body.answer;
    if (st?.type === 'question') {
      answer = cleanText(req.body.answer, 200);
      if (answer) await sendSystemShare(v.id, s.authorId, { kind: 'STORY_REPLY', text: `Menjawab pertanyaanmu "${st.q}": ${answer}`, refId: s.id });
    }
  }
  await prisma.rcStoryView.upsert({
    where: { storyId_viewerId: { storyId: s.id, viewerId: v.id } },
    update: answer !== undefined ? { answer } : {},
    create: { storyId: s.id, viewerId: v.id, answer: answer ?? null }
  });
  return { ok: true };
});

/** Penonton cerita saya (pemilik saja), beserta reaksi & jawaban. */
export const viewers = handle(async (req) => {
  const v = await requireViewer(req);
  const s = await prisma.rcStory.findUnique({ where: { id: req.params.id } });
  if (!s || s.authorId !== v.id) fail(404, 'Cerita tidak ditemukan.');
  const [rows, reacts] = await Promise.all([
    prisma.rcStoryView.findMany({ where: { storyId: s.id }, orderBy: { createdAt: 'desc' }, include: { viewer: { select: PUBLIC_MEMBER } } }),
    prisma.rcStoryReaction.findMany({ where: { storyId: s.id } })
  ]);
  const rm = new Map(reacts.map((r) => [r.memberId, r.emoji]));
  const items = rows.map((r) => ({ user: shapeUser(r.viewer), liked: r.liked, answer: r.answer, reaction: rm.get(r.viewerId) || null, at: r.createdAt }));
  items.sort((a, b) => (b.liked - a.liked) || (b.at - a.at));
  return { items, viewCount: items.length, likeCount: items.filter((x) => x.liked).length };
});

/**
 * Suka cerita (seperti Instagram): hanya pemilik cerita yang melihat siapa yang menyukai.
 * Disimpan di baris penonton; menyukai sekaligus menandai ditonton.
 */
export const likeStory = handle(async (req) => {
  const v = await requireViewer(req);
  const s = await visibleStoryOr404(v.id, req.params.id);
  if (s.authorId === v.id) fail(400, 'Tidak bisa menyukai cerita sendiri.');
  const liked = req.body?.like !== false;
  const key = { storyId_viewerId: { storyId: s.id, viewerId: v.id } };
  const prev = await prisma.rcStoryView.findUnique({ where: key, select: { liked: true } });
  await prisma.rcStoryView.upsert({ where: key, update: { liked }, create: { storyId: s.id, viewerId: v.id, liked } });
  // Notifikasi sekali per cerita (suka-batal-suka tidak menumpuk)
  if (liked && !prev?.liked) {
    const dup = await prisma.rcNotification.findFirst({ where: { userId: s.authorId, actorId: v.id, type: 'STORY_LIKE', text: s.id }, select: { id: true } });
    if (!dup) await notify(s.authorId, v.id, 'STORY_LIKE', { text: s.id });
  }
  return { liked };
});

/** Reaksi cepat emoji: tersimpan + dikirim sebagai pesan ke pemilik cerita. */
export const reactStory = handle(async (req) => {
  const v = await requireViewer(req);
  const s = await visibleStoryOr404(v.id, req.params.id);
  if (s.authorId === v.id) fail(400, 'Tidak bisa bereaksi ke cerita sendiri.');
  const emoji = EMOJIS.includes(req.body?.emoji) ? req.body.emoji : '❤️';
  await prisma.rcStoryReaction.upsert({ where: { storyId_memberId: { storyId: s.id, memberId: v.id } }, update: { emoji }, create: { storyId: s.id, memberId: v.id, emoji } });
  await sendSystemShare(v.id, s.authorId, { kind: 'STORY_REPLY', text: emoji, refId: s.id });
  await notify(s.authorId, v.id, 'STORY_REACT', { text: emoji });
  return { reaction: emoji };
});

/** Balas cerita: masuk ke Pesan sebagai balasan cerita. */
export const replyStory = handle(async (req) => {
  const v = await requireViewer(req);
  const s = await visibleStoryOr404(v.id, req.params.id);
  if (s.authorId === v.id) fail(400, 'Tidak bisa membalas cerita sendiri.');
  const text = cleanText(req.body?.text, 1000);
  if (!text) fail(400, 'Balasan tidak boleh kosong.');
  const thread = await sendSystemShare(v.id, s.authorId, { kind: 'STORY_REPLY', text, refId: s.id });
  return { threadId: thread?.id || null };
});

/** Arsip cerita saya (termasuk yang sudah kedaluwarsa) untuk membuat sorotan. */
export const archive = handle(async (req) => {
  const v = await requireViewer(req);
  const rows = await prisma.rcStory.findMany({ where: { authorId: v.id, removedAt: null }, orderBy: { createdAt: 'desc' }, take: 200 });
  return { items: rows.map((r) => ({ id: r.id, kind: r.kind, url: r.url, text: r.text, bg: r.bg, createdAt: r.createdAt, expired: r.expiresAt < new Date() })) };
});

// ─── Sorotan ────────────────────────────────────────────────────────────────
export const highlight = handle(async (req) => {
  const v = await requireViewer(req);
  const h = await prisma.rcHighlight.findUnique({ where: { id: req.params.id }, include: { items: { orderBy: { order: 'asc' }, include: { story: true } }, owner: { select: PUBLIC_MEMBER } } });
  if (!h) fail(404, 'Sorotan tidak ditemukan.');
  const rel = await relationTo(v.id, h.ownerId);
  if (!rel.canSee) fail(403, 'Akun ini privat.');
  return {
    highlight: { id: h.id, title: h.title, cover: h.coverUrl, user: shapeUser(h.owner) },
    items: h.items.filter((i) => !i.story.removedAt).map((i) => ({ id: i.story.id, kind: i.story.kind, url: i.story.url, text: i.story.text, bg: i.story.bg, createdAt: i.story.createdAt }))
  };
});

export const saveHighlight = handle(async (req) => {
  const v = await requireViewer(req);
  const title = cleanText(req.body?.title, 24) || 'Sorotan';
  const ids = Array.isArray(req.body?.storyIds) ? req.body.storyIds.slice(0, 100) : [];
  const owned = await prisma.rcStory.findMany({ where: { id: { in: ids }, authorId: v.id, removedAt: null }, select: { id: true, url: true, kind: true } });
  if (!owned.length) fail(400, 'Pilih minimal satu cerita.');
  const cover = owned.find((s) => s.kind === 'IMAGE')?.url || null;
  let h;
  if (req.params.id) {
    h = await prisma.rcHighlight.findUnique({ where: { id: req.params.id } });
    if (!h || h.ownerId !== v.id) fail(404, 'Sorotan tidak ditemukan.');
    await prisma.rcHighlightItem.deleteMany({ where: { highlightId: h.id } });
    h = await prisma.rcHighlight.update({ where: { id: h.id }, data: { title, coverUrl: cover || h.coverUrl } });
  } else {
    h = await prisma.rcHighlight.create({ data: { ownerId: v.id, title, coverUrl: cover, order: await prisma.rcHighlight.count({ where: { ownerId: v.id } }) } });
  }
  await prisma.rcHighlightItem.createMany({ data: owned.map((s, i) => ({ highlightId: h.id, storyId: s.id, order: ids.indexOf(s.id) >= 0 ? ids.indexOf(s.id) : i })) });
  return { highlight: { id: h.id, title: h.title, cover: h.coverUrl } };
});

export const deleteHighlight = handle(async (req) => {
  const v = await requireViewer(req);
  const h = await prisma.rcHighlight.findUnique({ where: { id: req.params.id } });
  if (!h || h.ownerId !== v.id) fail(404, 'Sorotan tidak ditemukan.');
  await prisma.rcHighlight.delete({ where: { id: h.id } });
  return { ok: true };
});

export const STORY_EMOJIS = EMOJIS;
export const STORY_BGS = BGS;
