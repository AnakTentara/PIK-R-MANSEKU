/**
 * Ruang Cerita — postingan: beranda, jelajah, carousel, suka, simpan, komentar, tandai.
 */
import prisma from '../config/db.js';
import { sendPushToMember } from '../services/webPush.js';
import {
  handle, fail, requireViewer, findUserByUsername, relationTo, shapeUser, PUBLIC_MEMBER,
  blockedIds, mutedIds, followingIds, closeFriendOf, notify, cleanText, mentionsIn, hasHiddenWord,
  saveUpload, removeFiles
} from './core.js';

const PAGE = 12;
const postInclude = {
  author: { select: PUBLIC_MEMBER },
  media: { orderBy: { order: 'asc' } },
  tags: { include: { member: { select: PUBLIC_MEMBER } } },
  _count: { select: { likes: true, comments: true } }
};

/** Bentuk postingan untuk klien, lengkap dengan status suka/simpan milik viewer. */
async function shapePosts(posts, viewerId) {
  if (!posts.length) return [];
  const ids = posts.map((p) => p.id);
  const [liked, saved, previews, likers] = await Promise.all([
    prisma.rcLike.findMany({ where: { memberId: viewerId, postId: { in: ids } }, select: { postId: true } }),
    prisma.rcSave.findMany({ where: { memberId: viewerId, postId: { in: ids } }, select: { postId: true } }),
    // 2 komentar terbaru per postingan untuk pratinjau di beranda
    Promise.all(ids.map((id) => prisma.rcComment.findMany({
      where: { postId: id, parentId: null, hidden: false }, orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }], take: 2,
      include: { author: { select: PUBLIC_MEMBER } }
    }))),
    // Satu nama penyuka yang diikuti viewer ("Disukai oleh x dan n lainnya")
    Promise.all(ids.map((id) => prisma.rcLike.findFirst({
      where: { postId: id, member: { followers: { some: { followerId: viewerId } } } },
      include: { member: { select: PUBLIC_MEMBER } }
    })))
  ]);
  const L = new Set(liked.map((x) => x.postId));
  const S = new Set(saved.map((x) => x.postId));
  return posts.map((p, i) => ({
    id: p.id,
    author: shapeUser(p.author),
    caption: p.caption,
    audience: p.audience,
    commentsOff: p.commentsOff,
    hideLikes: p.hideLikes && p.authorId !== viewerId,
    pinned: p.pinned,
    media: p.media.map((m) => ({ id: m.id, kind: m.kind, url: m.url, thumb: m.thumbUrl, width: m.width, height: m.height, alt: m.alt })),
    tags: p.tags.map((t) => shapeUser(t.member)),
    likeCount: p._count.likes,
    commentCount: p._count.comments,
    liked: L.has(p.id),
    saved: S.has(p.id),
    likedBy: likers[i] ? shapeUser(likers[i].member) : null,
    previewComments: previews[i].map((c) => ({ id: c.id, author: shapeUser(c.author), content: c.content })),
    mine: p.authorId === viewerId,
    editedAt: p.editedAt,
    createdAt: p.createdAt
  }));
}

/** Filter keterlihatan: akun privat, teman dekat, blokir, bisukan. */
async function visibilityFilter(viewerId, { includeMuted = false } = {}) {
  const [following, blocked, muted, cf, privateIds] = await Promise.all([
    followingIds(viewerId), blockedIds(viewerId), mutedIds(viewerId), closeFriendOf(viewerId),
    prisma.rcProfile.findMany({ where: { isPrivate: true }, select: { memberId: true } }).then((r) => new Set(r.map((x) => x.memberId)))
  ]);
  const canSeeAuthor = (id) => id === viewerId || (!blocked.has(id) && (!privateIds.has(id) || following.has(id)) && (includeMuted || !muted.has(id)));
  const canSeePost = (p) => canSeeAuthor(p.authorId) && (p.audience !== 'CLOSE_FRIENDS' || p.authorId === viewerId || cf.has(p.authorId));
  return { following, blocked, muted, canSeeAuthor, canSeePost };
}

/**
 * Beranda: postingan dari akun yang diikuti + milik sendiri, terbaru dulu.
 * Bila belum mengikuti siapa pun, isi dengan postingan publik terbaru (supaya tidak kosong).
 * Cursor = createdAt ISO postingan terakhir.
 */
export const feed = handle(async (req) => {
  const v = await requireViewer(req);
  const vis = await visibilityFilter(v.id);
  const cursor = req.query.cursor ? new Date(req.query.cursor) : null;
  const authorIds = [...vis.following, v.id].filter((id) => !vis.muted.has(id) && !vis.blocked.has(id));
  const discover = req.query.mode === 'discover' || vis.following.size === 0;
  const where = {
    removedAt: null,
    ...(discover ? {} : { authorId: { in: authorIds } }),
    ...(cursor && !isNaN(cursor) ? { createdAt: { lt: cursor } } : {})
  };
  const rows = await prisma.rcPost.findMany({ where, orderBy: { createdAt: 'desc' }, take: PAGE * 3, include: postInclude });
  const visible = rows.filter(vis.canSeePost).slice(0, PAGE);
  const items = await shapePosts(visible, v.id);
  return {
    items,
    discover,
    nextCursor: rows.length === PAGE * 3 || visible.length === PAGE ? visible.at(-1)?.createdAt?.toISOString() || null : null
  };
});

/** Jelajah: postingan publik populer 14 hari terakhir dari akun yang belum diikuti. */
export const explore = handle(async (req) => {
  const v = await requireViewer(req);
  const vis = await visibilityFilter(v.id);
  const since = new Date(Date.now() - 14 * 864e5);
  const rows = await prisma.rcPost.findMany({
    where: { removedAt: null, audience: 'FOLLOWERS', createdAt: { gte: since }, authorId: { not: v.id } },
    orderBy: { createdAt: 'desc' }, take: 120, include: postInclude
  });
  const pool = rows.filter(vis.canSeePost);
  // Skor sederhana: suka + 2x komentar, dikurangi usia (jam) / 12
  const scored = pool.map((p) => ({ p, s: p._count.likes + 2 * p._count.comments - (Date.now() - p.createdAt) / 3.6e6 / 12 }))
    .sort((a, b) => b.s - a.s).slice(0, 60).map((x) => x.p);
  return { items: await shapePosts(scored, v.id) };
});

/** Grid profil: postingan milik @username (terpin dulu). */
export const userPosts = handle(async (req) => {
  const v = await requireViewer(req);
  const u = await findUserByUsername(req.params.username);
  if (!u) fail(404, 'Akun tidak ditemukan.');
  const rel = await relationTo(v.id, u.id);
  if (!rel.canSee) return { items: [], locked: true };
  const cf = rel.self || (await prisma.memberRelation.findFirst({ where: { ownerId: u.id, targetId: v.id, type: 'CLOSE_FRIEND' } }));
  const tab = req.query.tab;
  const where = tab === 'tagged'
    ? { removedAt: null, tags: { some: { memberId: u.id } } }
    : { removedAt: null, authorId: u.id, ...(cf ? {} : { audience: 'FOLLOWERS' }) };
  const rows = await prisma.rcPost.findMany({ where, orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }], take: 60, include: postInclude });
  const vis = tab === 'tagged' ? await visibilityFilter(v.id, { includeMuted: true }) : null;
  return { items: await shapePosts(vis ? rows.filter(vis.canSeePost) : rows, v.id) };
});

export const getPost = handle(async (req) => {
  const v = await requireViewer(req);
  const p = await prisma.rcPost.findUnique({ where: { id: req.params.id }, include: postInclude });
  if (!p || p.removedAt) fail(404, 'Postingan tidak ditemukan.');
  const vis = await visibilityFilter(v.id, { includeMuted: true });
  if (!vis.canSeePost(p)) fail(404, 'Postingan tidak ditemukan.');
  return { post: (await shapePosts([p], v.id))[0] };
});

/** Buat postingan: 1–10 media (foto/video), keterangan, teman yang ditandai. */
export const createPost = handle(async (req) => {
  const v = await requireViewer(req);
  const files = req.files || [];
  if (!files.length) fail(400, 'Pilih minimal satu foto atau video.');
  if (files.length > 10) fail(400, 'Maksimal 10 foto/video per postingan.');
  const caption = cleanText(req.body.caption, 2200);
  const audience = req.body.audience === 'CLOSE_FRIENDS' ? 'CLOSE_FRIENDS' : 'FOLLOWERS';
  const alts = (() => { try { return JSON.parse(req.body.alts || '[]'); } catch { return []; } })();
  let tagNames = [];
  try { tagNames = JSON.parse(req.body.tags || '[]'); } catch { /* abaikan */ }

  const saved = [];
  try {
    for (const f of files) saved.push(await saveUpload(f));
  } catch (err) {
    removeFiles(saved.map((s) => [s.url, s.thumbUrl]));
    throw err;
  }
  const tagged = tagNames.length
    ? await prisma.member.findMany({ where: { slug: { in: tagNames.map((t) => String(t).toLowerCase()).slice(0, 20) } }, select: { id: true } })
    : [];
  const post = await prisma.rcPost.create({
    data: {
      authorId: v.id,
      caption,
      audience,
      commentsOff: req.body.commentsOff === 'true',
      hideLikes: req.body.hideLikes === 'true',
      media: { create: saved.map((s, i) => ({ kind: s.kind, url: s.url, thumbUrl: s.thumbUrl, width: s.width, height: s.height, order: i, alt: cleanText(alts[i] || '', 200) || null })) },
      tags: { create: tagged.filter((t) => t.id !== v.id).map((t) => ({ memberId: t.id })) }
    },
    include: postInclude
  });
  for (const t of tagged) await notify(t.id, v.id, 'TAG', { postId: post.id });
  const mentioned = await prisma.member.findMany({ where: { slug: { in: mentionsIn(caption) } }, select: { id: true } });
  for (const m of mentioned) await notify(m.id, v.id, 'MENTION', { postId: post.id });

  // Beritahu teman / pengikut (followers) tentang postingan baru
  prisma.follow.findMany({
    where: { followingId: v.id },
    select: { followerId: true }
  }).then((followers) => {
    for (const f of followers) {
      if (f.followerId !== v.id) {
        sendPushToMember(f.followerId, {
          title: `📸 Postingan Baru dari ${v.name || v.slug}`,
          body: caption ? `${caption.slice(0, 100)}` : 'Membagikan postingan baru di Ruang Cerita',
          icon: v.photoPath || '/media/logos/logo_pik-r.png',
          badge: '/media/logos/logo_pik-r.png',
          data: {
            url: `/p/${post.id}`,
            category: 'RUANG_CERITA',
            type: 'NEW_POST'
          }
        }).catch(() => {});
      }
    }
  }).catch(() => {});
  return { post: (await shapePosts([post], v.id))[0] };
});

export const updatePost = handle(async (req) => {
  const v = await requireViewer(req);
  const p = await prisma.rcPost.findUnique({ where: { id: req.params.id } });
  if (!p || p.removedAt || p.authorId !== v.id) fail(404, 'Postingan tidak ditemukan.');
  const b = req.body || {};
  const data = {};
  if (typeof b.caption === 'string') { data.caption = cleanText(b.caption, 2200); data.editedAt = new Date(); }
  if (typeof b.commentsOff === 'boolean') data.commentsOff = b.commentsOff;
  if (typeof b.hideLikes === 'boolean') data.hideLikes = b.hideLikes;
  if (typeof b.pinned === 'boolean') {
    if (b.pinned && (await prisma.rcPost.count({ where: { authorId: v.id, pinned: true, removedAt: null } })) >= 3) fail(400, 'Maksimal 3 postingan disematkan.');
    data.pinned = b.pinned;
  }
  const up = await prisma.rcPost.update({ where: { id: p.id }, data, include: postInclude });
  return { post: (await shapePosts([up], v.id))[0] };
});

export const deletePost = handle(async (req) => {
  const v = await requireViewer(req);
  const p = await prisma.rcPost.findUnique({ where: { id: req.params.id }, include: { media: true } });
  if (!p || p.authorId !== v.id) fail(404, 'Postingan tidak ditemukan.');
  await prisma.rcPost.delete({ where: { id: p.id } });
  removeFiles(p.media.map((m) => [m.url, m.thumbUrl]));
  return { ok: true };
});

async function visiblePostOr404(viewerId, postId) {
  const p = await prisma.rcPost.findUnique({ where: { id: postId }, select: { id: true, authorId: true, audience: true, removedAt: true, commentsOff: true } });
  if (!p || p.removedAt) fail(404, 'Postingan tidak ditemukan.');
  const vis = await visibilityFilter(viewerId, { includeMuted: true });
  if (!vis.canSeePost(p)) fail(404, 'Postingan tidak ditemukan.');
  return p;
}

/** Suka (eksplisit: like true/false supaya ketukan ganda tidak saling membatalkan). */
export const like = handle(async (req) => {
  const v = await requireViewer(req);
  const p = await visiblePostOr404(v.id, req.params.id);
  const want = req.body?.like !== false;
  if (want) {
    await prisma.rcLike.upsert({ where: { postId_memberId: { postId: p.id, memberId: v.id } }, update: {}, create: { postId: p.id, memberId: v.id } });
    await notify(p.authorId, v.id, 'LIKE', { postId: p.id });
  } else {
    await prisma.rcLike.deleteMany({ where: { postId: p.id, memberId: v.id } });
  }
  return { liked: want, likeCount: await prisma.rcLike.count({ where: { postId: p.id } }) };
});

export const likers = handle(async (req) => {
  const v = await requireViewer(req);
  const p = await visiblePostOr404(v.id, req.params.id);
  const post = await prisma.rcPost.findUnique({ where: { id: p.id }, select: { hideLikes: true, authorId: true } });
  if (post.hideLikes && post.authorId !== v.id) return { items: [], hidden: true };
  const [rows, mine] = await Promise.all([
    prisma.rcLike.findMany({ where: { postId: p.id }, orderBy: { createdAt: 'desc' }, take: 300, include: { member: { select: PUBLIC_MEMBER } } }),
    followingIds(v.id)
  ]);
  return { items: rows.map((r) => ({ ...shapeUser(r.member), following: mine.has(r.memberId), self: r.memberId === v.id })) };
});

export const save = handle(async (req) => {
  const v = await requireViewer(req);
  const p = await visiblePostOr404(v.id, req.params.id);
  if (req.body?.save === false) await prisma.rcSave.deleteMany({ where: { postId: p.id, memberId: v.id } });
  else await prisma.rcSave.upsert({ where: { postId_memberId: { postId: p.id, memberId: v.id } }, update: {}, create: { postId: p.id, memberId: v.id } });
  return { saved: req.body?.save !== false };
});

export const savedPosts = handle(async (req) => {
  const v = await requireViewer(req);
  const rows = await prisma.rcSave.findMany({ where: { memberId: v.id }, orderBy: { createdAt: 'desc' }, take: 90, include: { post: { include: postInclude } } });
  const vis = await visibilityFilter(v.id, { includeMuted: true });
  return { items: await shapePosts(rows.map((r) => r.post).filter((p) => !p.removedAt && vis.canSeePost(p)), v.id) };
});

// ─── Komentar ───────────────────────────────────────────────────────────────
function shapeComment(c, viewerId, likedSet) {
  return {
    id: c.id,
    author: shapeUser(c.author),
    content: c.content,
    pinned: c.pinned,
    hidden: c.hidden,
    likeCount: c._count?.likes || 0,
    liked: likedSet.has(c.id),
    replyCount: c._count?.replies || 0,
    mine: c.authorId === viewerId,
    parentId: c.parentId,
    createdAt: c.createdAt
  };
}

/**
 * Komentar teratas (atau balasan bila ?parent=id).
 * Komentar dari akun yang dibatasi pemilik postingan hanya terlihat oleh penulisnya sendiri;
 * komentar berisi kata tersembunyi disembunyikan kecuali untuk penulisnya.
 */
export const comments = handle(async (req) => {
  const v = await requireViewer(req);
  const p = await visiblePostOr404(v.id, req.params.id);
  const [blocked, restrictedByOwner] = await Promise.all([
    blockedIds(v.id),
    prisma.rcRestrict.findMany({ where: { ownerId: p.authorId }, select: { targetId: true } }).then((r) => new Set(r.map((x) => x.targetId)))
  ]);
  const rows = await prisma.rcComment.findMany({
    where: { postId: p.id, parentId: req.query.parent || null },
    orderBy: req.query.parent ? { createdAt: 'asc' } : [{ pinned: 'desc' }, { createdAt: 'desc' }],
    take: 200,
    include: { author: { select: PUBLIC_MEMBER }, _count: { select: { likes: true, replies: true } } }
  });
  const visible = rows.filter((c) => !blocked.has(c.authorId)
    && (c.authorId === v.id || ((!c.hidden || p.authorId === v.id) && (!restrictedByOwner.has(c.authorId) || p.authorId === v.id))));
  const liked = new Set((await prisma.rcCommentLike.findMany({ where: { memberId: v.id, commentId: { in: visible.map((c) => c.id) } }, select: { commentId: true } })).map((x) => x.commentId));
  return { items: visible.map((c) => shapeComment(c, v.id, liked)), commentsOff: p.commentsOff, postAuthorId: p.authorId };
});

export const addComment = handle(async (req) => {
  const v = await requireViewer(req);
  const p = await visiblePostOr404(v.id, req.params.id);
  if (p.commentsOff && p.authorId !== v.id) fail(403, 'Komentar dimatikan untuk postingan ini.');
  const content = cleanText(req.body?.content, 1000);
  if (!content) fail(400, 'Komentar tidak boleh kosong.');
  let parentId = req.body?.parentId || null;
  if (parentId) {
    const parent = await prisma.rcComment.findUnique({ where: { id: parentId }, select: { postId: true, parentId: true, authorId: true } });
    if (!parent || parent.postId !== p.id) fail(400, 'Komentar yang dibalas tidak ditemukan.');
    if (parent.parentId) parentId = parent.parentId; // utas hanya 1 tingkat seperti Instagram
  }
  const owner = await prisma.rcProfile.findUnique({ where: { memberId: p.authorId }, select: { hiddenWords: true } });
  const hidden = p.authorId !== v.id && hasHiddenWord(content, owner?.hiddenWords);
  const c = await prisma.rcComment.create({
    data: { postId: p.id, authorId: v.id, parentId, content, hidden },
    include: { author: { select: PUBLIC_MEMBER }, _count: { select: { likes: true, replies: true } } }
  });
  if (!hidden) {
    await notify(p.authorId, v.id, parentId ? 'REPLY' : 'COMMENT', { postId: p.id, commentId: c.id, text: content.slice(0, 120) });
    if (parentId) {
      const parent = await prisma.rcComment.findUnique({ where: { id: parentId }, select: { authorId: true } });
      if (parent && parent.authorId !== p.authorId) await notify(parent.authorId, v.id, 'REPLY', { postId: p.id, commentId: c.id, text: content.slice(0, 120) });
    }
    const mentioned = await prisma.member.findMany({ where: { slug: { in: mentionsIn(content) } }, select: { id: true } });
    for (const m of mentioned) await notify(m.id, v.id, 'MENTION', { postId: p.id, commentId: c.id, text: content.slice(0, 120) });
  }
  return { comment: shapeComment(c, v.id, new Set()) };
});

export const deleteComment = handle(async (req) => {
  const v = await requireViewer(req);
  const c = await prisma.rcComment.findUnique({ where: { id: req.params.id }, include: { post: { select: { authorId: true } } } });
  if (!c) fail(404, 'Komentar tidak ditemukan.');
  // Penulis komentar atau pemilik postingan boleh menghapus
  if (c.authorId !== v.id && c.post.authorId !== v.id) fail(403, 'Tidak bisa menghapus komentar ini.');
  await prisma.rcComment.delete({ where: { id: c.id } });
  return { ok: true };
});

export const likeComment = handle(async (req) => {
  const v = await requireViewer(req);
  const c = await prisma.rcComment.findUnique({ where: { id: req.params.id }, select: { id: true, postId: true } });
  if (!c) fail(404, 'Komentar tidak ditemukan.');
  await visiblePostOr404(v.id, c.postId);
  if (req.body?.like === false) await prisma.rcCommentLike.deleteMany({ where: { commentId: c.id, memberId: v.id } });
  else await prisma.rcCommentLike.upsert({ where: { commentId_memberId: { commentId: c.id, memberId: v.id } }, update: {}, create: { commentId: c.id, memberId: v.id } });
  return { liked: req.body?.like !== false, likeCount: await prisma.rcCommentLike.count({ where: { commentId: c.id } }) };
});

/** Sematkan komentar (pemilik postingan, maks. 3). */
export const pinComment = handle(async (req) => {
  const v = await requireViewer(req);
  const c = await prisma.rcComment.findUnique({ where: { id: req.params.id }, include: { post: { select: { authorId: true } } } });
  if (!c || c.post.authorId !== v.id) fail(404, 'Komentar tidak ditemukan.');
  const pin = req.body?.pin !== false;
  if (pin && (await prisma.rcComment.count({ where: { postId: c.postId, pinned: true } })) >= 3) fail(400, 'Maksimal 3 komentar disematkan.');
  await prisma.rcComment.update({ where: { id: c.id }, data: { pinned: pin, hidden: pin ? false : c.hidden } });
  return { pinned: pin };
});
