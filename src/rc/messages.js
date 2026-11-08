/**
 * Ruang Cerita — Pesan (DM): percakapan 1-on-1 & grup, permintaan pesan, balas, reaksi,
 * edit (15 menit), tarik pesan, foto sekali lihat, tanda dibaca, sedang mengetik, Notes.
 *
 * Aturan pengiriman (akun remaja):
 * - dmPolicy penerima: FOLLOWING (bawaan) = hanya dari akun yang ia ikuti langsung masuk;
 *   selainnya masuk "Permintaan" dan pengirim tidak tahu pesannya dibaca sampai diterima.
 * - Akun yang dibatasi (Restrict) selalu masuk Permintaan. Blokir = tidak bisa mengirim sama sekali.
 *
 * Penyimpanan: teks pesan dienkripsi AES-256-GCM (rc/crypto.js); foto pesan disimpan terenkripsi di
 * folder privat (bukan /uploads publik) dan hanya bisa diambil anggota percakapan lewat API.
 */
import prisma from '../config/db.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import {
  handle, fail, requireViewer, findUserByUsername, shapeUser, PUBLIC_MEMBER, blockedIds,
  cleanText, pushTo, hasHiddenWord, ensureProfile
} from './core.js';
import { seal, open, sealBuffer, openBuffer } from './crypto.js';

// Foto pesan: di luar public/ supaya tidak bisa dibuka lewat tautan langsung
const PRIVATE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../private/rc-dm');
fs.mkdirSync(PRIVATE_DIR, { recursive: true });

async function savePrivateImage(buffer) {
  const out = await sharp(buffer, { failOn: 'error', limitInputPixels: 60_000_000 }).rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  const name = `${Date.now().toString(36)}${crypto.randomBytes(8).toString('hex')}.bin`;
  fs.writeFileSync(path.join(PRIVATE_DIR, name), sealBuffer(out));
  return `dm:${name}`;
}
const mediaUrl = (msgId) => `/api/rc/messages/${msgId}/media`;

const EDIT_WINDOW = 15 * 60 * 1000;
const REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍', '🔥'];

const memberSel = { member: { select: PUBLIC_MEMBER } };

/** Penerima bisa menerima pesan langsung dari pengirim? (selain itu masuk Permintaan) */
async function deliveryStatus(senderId, recipientId) {
  const [p, follows, restricted, blocked] = await Promise.all([
    ensureProfile(recipientId),
    prisma.follow.findUnique({ where: { followerId_followingId: { followerId: recipientId, followingId: senderId } } }),
    prisma.rcRestrict.findUnique({ where: { ownerId_targetId: { ownerId: recipientId, targetId: senderId } } }),
    prisma.memberRelation.findFirst({ where: { type: 'BLOCK', OR: [{ ownerId: recipientId, targetId: senderId }, { ownerId: senderId, targetId: recipientId }] } })
  ]);
  if (blocked) return 'BLOCKED';
  if (restricted) return 'REQUEST';
  if (p.dmPolicy === 'NONE' && !follows) return 'CLOSED';
  if (p.dmPolicy === 'EVERYONE' || follows) return 'ACCEPTED';
  return 'REQUEST';
}

/** Cari percakapan 1-on-1 yang sudah ada atau buat baru. */
async function directThread(aId, bId, { create = true } = {}) {
  const existing = await prisma.rcThread.findFirst({
    where: { isGroup: false, AND: [{ members: { some: { memberId: aId } } }, { members: { some: { memberId: bId } } }] },
    include: { members: true }
  });
  if (existing || !create) return existing;
  const status = await deliveryStatus(aId, bId);
  if (status === 'BLOCKED' || status === 'CLOSED') fail(403, 'Akun ini tidak menerima pesan darimu.');
  return prisma.rcThread.create({
    data: {
      createdById: aId,
      members: { create: [{ memberId: aId, status: 'ACCEPTED', lastReadAt: new Date() }, { memberId: bId, status }] }
    },
    include: { members: true }
  });
}

function shapeMessage(m, viewerId) {
  const unsent = !!m.unsentAt;
  const hiddenOnce = m.viewOnce && (m.openedAt || m.senderId === viewerId);
  return {
    id: m.id,
    sender: m.sender ? shapeUser(m.sender) : null,
    senderId: m.senderId,
    kind: unsent ? 'UNSENT' : m.kind,
    text: unsent ? null : open(m.text),
    url: unsent || hiddenOnce || !m.url ? null : (m.url.startsWith('dm:') ? mediaUrl(m.id) : m.url),
    refId: unsent ? null : m.refId,
    ref: m.ref || null,
    replyTo: m.replyTo || null,
    viewOnce: m.viewOnce,
    opened: !!m.openedAt,
    edited: !!m.editedAt,
    reactions: (m.reactions || []).map((r) => ({ emoji: r.emoji, memberId: r.memberId })),
    mine: m.senderId === viewerId,
    createdAt: m.createdAt
  };
}

/** Lampirkan pratinjau postingan/cerita yang dibagikan dan pesan yang dibalas. */
async function enrich(messages) {
  const postIds = messages.filter((m) => m.kind === 'POST' && m.refId).map((m) => m.refId);
  const storyIds = messages.filter((m) => m.kind === 'STORY_REPLY' && m.refId).map((m) => m.refId);
  const replyIds = messages.filter((m) => m.replyToId).map((m) => m.replyToId);
  const [posts, stories, replies] = await Promise.all([
    postIds.length ? prisma.rcPost.findMany({ where: { id: { in: postIds } }, include: { media: { take: 1, orderBy: { order: 'asc' } }, author: { select: PUBLIC_MEMBER } } }) : [],
    storyIds.length ? prisma.rcStory.findMany({ where: { id: { in: storyIds } }, include: { author: { select: PUBLIC_MEMBER } } }) : [],
    replyIds.length ? prisma.rcMessage.findMany({ where: { id: { in: replyIds } }, include: { sender: { select: PUBLIC_MEMBER } } }) : []
  ]);
  const P = new Map(posts.map((p) => [p.id, p]));
  const S = new Map(stories.map((s) => [s.id, s]));
  const R = new Map(replies.map((r) => [r.id, r]));
  for (const m of messages) {
    if (m.kind === 'POST') {
      const p = P.get(m.refId);
      m.ref = p && !p.removedAt ? { type: 'post', id: p.id, author: shapeUser(p.author), thumb: p.media[0]?.thumbUrl || p.media[0]?.url || null, caption: p.caption.slice(0, 90) } : { type: 'post', gone: true };
    }
    if (m.kind === 'STORY_REPLY') {
      const s = S.get(m.refId);
      m.ref = s && s.expiresAt > new Date() && !s.removedAt ? { type: 'story', id: s.id, author: shapeUser(s.author), url: s.kind === 'IMAGE' ? s.url : null, text: s.text, bg: s.bg } : { type: 'story', gone: true };
    }
    if (m.replyToId) {
      const r = R.get(m.replyToId);
      m.replyTo = r ? { id: r.id, sender: shapeUser(r.sender), text: r.unsentAt ? 'Pesan ditarik' : (r.kind === 'IMAGE' ? '📷 Foto' : (open(r.text) || '').slice(0, 80)) } : null;
    }
  }
  return messages;
}

async function threadForViewer(threadId, viewerId) {
  const t = await prisma.rcThread.findUnique({ where: { id: threadId }, include: { members: { include: memberSel } } });
  const me = t?.members.find((m) => m.memberId === viewerId && m.status !== 'LEFT');
  if (!t || !me) fail(404, 'Percakapan tidak ditemukan.');
  return { t, me };
}

function threadTitle(t, viewerId) {
  if (t.isGroup) return t.title || t.members.filter((m) => m.status !== 'LEFT').map((m) => m.member.name.split(' ')[0]).slice(0, 4).join(', ');
  const other = t.members.find((m) => m.memberId !== viewerId);
  return other ? other.member.name.trim() : 'Percakapan';
}

/** Kotak masuk: Utama atau Permintaan. */
export const inbox = handle(async (req) => {
  const v = await requireViewer(req);
  const box = req.query.box === 'requests' ? 'REQUEST' : 'ACCEPTED';
  const blocked = await blockedIds(v.id);
  const rows = await prisma.rcThreadMember.findMany({
    where: { memberId: v.id, status: box },
    include: {
      thread: {
        include: {
          members: { include: memberSel },
          messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: { select: PUBLIC_MEMBER } } }
        }
      }
    },
    orderBy: { thread: { lastMessageAt: 'desc' } },
    take: 100
  });
  const items = [];
  for (const r of rows) {
    const t = r.thread;
    const others = t.members.filter((m) => m.memberId !== v.id && m.status !== 'LEFT');
    if (!t.isGroup && others.some((o) => blocked.has(o.memberId))) continue;
    const last = t.messages[0];
    if (!last) continue;
    const unread = await prisma.rcMessage.count({ where: { threadId: t.id, senderId: { not: v.id }, createdAt: { gt: r.lastReadAt || new Date(0) } } });
    items.push({
      id: t.id,
      isGroup: t.isGroup,
      title: threadTitle(t, v.id),
      users: others.map((o) => shapeUser(o.member)),
      muted: r.muted,
      unread,
      last: {
        text: last.unsentAt ? 'Pesan ditarik' : last.kind === 'IMAGE' ? (last.viewOnce ? '📷 Foto sekali lihat' : '📷 Foto') : last.kind === 'POST' ? '↗ Membagikan postingan' : last.kind === 'STORY_REPLY' ? `Membalas cerita: ${open(last.text) || ''}` : open(last.text),
        mine: last.senderId === v.id,
        at: last.createdAt
      }
    });
  }
  const requests = box === 'ACCEPTED' ? await prisma.rcThreadMember.count({ where: { memberId: v.id, status: 'REQUEST' } }) : undefined;
  return { items, requests };
});

/** Buka/buat percakapan dengan @username atau grup baru. */
export const openThread = handle(async (req) => {
  const v = await requireViewer(req);
  const names = (Array.isArray(req.body?.usernames) ? req.body.usernames : [req.body?.username]).filter(Boolean).slice(0, 31);
  if (!names.length) fail(400, 'Pilih penerima pesan.');
  const users = (await Promise.all(names.map(findUserByUsername))).filter(Boolean).filter((u) => u.id !== v.id);
  if (!users.length) fail(404, 'Akun tidak ditemukan.');
  if (users.length === 1) {
    const t = await directThread(v.id, users[0].id);
    return { threadId: t.id };
  }
  const blocked = await blockedIds(v.id);
  const allowed = [];
  for (const u of users) {
    if (blocked.has(u.id)) continue;
    const st = await deliveryStatus(v.id, u.id);
    if (st === 'ACCEPTED' || st === 'REQUEST') allowed.push({ u, st });
  }
  if (allowed.length < 2) fail(400, 'Grup butuh minimal 2 anggota lain yang menerima pesan darimu.');
  const t = await prisma.rcThread.create({
    data: {
      isGroup: true,
      title: cleanText(req.body?.title, 50) || null,
      createdById: v.id,
      members: { create: [{ memberId: v.id, status: 'ACCEPTED', isAdmin: true, lastReadAt: new Date() }, ...allowed.map(({ u, st }) => ({ memberId: u.id, status: st }))] },
      messages: { create: { senderId: v.id, kind: 'SYSTEM', text: seal('membuat grup') } }
    }
  });
  return { threadId: t.id };
});

/** Isi percakapan (terbaru di bawah). Cursor = id pesan tertua yang sudah dimuat. */
export const thread = handle(async (req) => {
  const v = await requireViewer(req);
  const { t, me } = await threadForViewer(req.params.id, v.id);
  const before = req.query.before ? await prisma.rcMessage.findUnique({ where: { id: req.query.before }, select: { createdAt: true } }) : null;
  const rows = await prisma.rcMessage.findMany({
    where: { threadId: t.id, ...(before ? { createdAt: { lt: before.createdAt } } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 40,
    include: { sender: { select: PUBLIC_MEMBER }, reactions: true }
  });
  await enrich(rows);
  const others = t.members.filter((m) => m.memberId !== v.id && m.status !== 'LEFT');
  // Tanda dibaca: hanya bila kedua pihak mengizinkan status aktivitas & percakapan sudah diterima
  const profiles = await prisma.rcProfile.findMany({ where: { memberId: { in: [v.id, ...others.map((o) => o.memberId)] } } });
  const showMine = profiles.find((p) => p.memberId === v.id)?.showActivity !== false;
  const seenBy = showMine ? others.filter((o) => o.status === 'ACCEPTED' && profiles.find((p) => p.memberId === o.memberId)?.showActivity !== false).map((o) => ({ memberId: o.memberId, lastReadAt: o.lastReadAt })) : [];
  return {
    thread: {
      id: t.id, isGroup: t.isGroup, title: threadTitle(t, v.id),
      users: others.map((o) => ({ ...shapeUser(o.member), lastSeenAt: showMine && profiles.find((p) => p.memberId === o.memberId)?.showActivity ? profiles.find((p) => p.memberId === o.memberId)?.lastSeenAt : null })),
      status: me.status, muted: me.muted, isAdmin: me.isAdmin
    },
    items: rows.reverse().map((m) => shapeMessage(m, v.id)),
    seenBy,
    hasMore: rows.length === 40
  };
});

async function broadcast(t, senderId, event, data) {
  for (const m of t.members) if (m.memberId !== senderId && m.status !== 'LEFT') pushTo(m.memberId, event, data);
}

/** Kirim pesan teks / foto (opsional sekali lihat) / balasan. */
export const send = handle(async (req) => {
  const v = await requireViewer(req);
  const { t, me } = await threadForViewer(req.params.id, v.id);
  if (me.status === 'REQUEST') fail(403, 'Terima permintaan pesan ini dulu untuk membalas.');
  if (!t.isGroup) {
    const other = t.members.find((m) => m.memberId !== v.id);
    const st = await deliveryStatus(v.id, other.memberId);
    if (st === 'BLOCKED') fail(403, 'Tidak bisa mengirim pesan ke akun ini.');
  }
  const text = cleanText(req.body?.text, 2000) || null;
  let url = null;
  if (req.file) url = await savePrivateImage(req.file.buffer);
  if (!text && !url) fail(400, 'Pesan kosong.');
  const replyToId = req.body?.replyToId || null;
  if (replyToId) {
    const r = await prisma.rcMessage.findUnique({ where: { id: replyToId }, select: { threadId: true } });
    if (!r || r.threadId !== t.id) fail(400, 'Pesan yang dibalas tidak ditemukan.');
  }
  const msg = await prisma.rcMessage.create({
    data: { threadId: t.id, senderId: v.id, kind: url ? 'IMAGE' : 'TEXT', text: seal(text), url, replyToId, viewOnce: !!url && req.body?.viewOnce === 'true' },
    include: { sender: { select: PUBLIC_MEMBER }, reactions: true }
  });
  await prisma.rcThread.update({ where: { id: t.id }, data: { lastMessageAt: msg.createdAt } });
  await prisma.rcThreadMember.update({ where: { threadId_memberId: { threadId: t.id, memberId: v.id } }, data: { lastReadAt: msg.createdAt } });
  // Kata tersembunyi penerima: pesan 1-on-1 dari bukan-pengikut dipindah ke Permintaan
  if (!t.isGroup && text) {
    const other = t.members.find((m) => m.memberId !== v.id);
    const op = await ensureProfile(other.memberId);
    if (other.status === 'ACCEPTED' && hasHiddenWord(text, op.hiddenWords)) {
      const follows = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: other.memberId, followingId: v.id } } });
      if (!follows) await prisma.rcThreadMember.update({ where: { threadId_memberId: { threadId: t.id, memberId: other.memberId } }, data: { status: 'REQUEST' } });
    }
  }
  await enrich([msg]);
  const shaped = shapeMessage(msg, v.id);
  await broadcast(t, v.id, 'message', { threadId: t.id, message: { ...shaped, mine: false } });
  return { message: shaped };
});

/** Dipakai modul lain: kirim balasan cerita / reaksi / bagikan postingan ke 1 orang. */
export async function sendSystemShare(fromId, toId, { kind, text, refId }) {
  const t = await directThread(fromId, toId).catch(() => null);
  if (!t) return null;
  const msg = await prisma.rcMessage.create({ data: { threadId: t.id, senderId: fromId, kind, text: seal(text || null), refId: refId || null }, include: { sender: { select: PUBLIC_MEMBER }, reactions: true } });
  await prisma.rcThread.update({ where: { id: t.id }, data: { lastMessageAt: msg.createdAt } });
  await enrich([msg]);
  pushTo(toId, 'message', { threadId: t.id, message: { ...shapeMessage(msg, toId), mine: false } });
  return t;
}

/** Bagikan postingan ke beberapa orang sekaligus. */
export const sharePost = handle(async (req) => {
  const v = await requireViewer(req);
  const post = await prisma.rcPost.findUnique({ where: { id: req.body?.postId }, select: { id: true, removedAt: true } });
  if (!post || post.removedAt) fail(404, 'Postingan tidak ditemukan.');
  const names = (req.body?.usernames || []).slice(0, 20);
  let sent = 0;
  for (const n of names) {
    const u = await findUserByUsername(n);
    if (!u || u.id === v.id) continue;
    const t = await sendSystemShare(v.id, u.id, { kind: 'POST', text: cleanText(req.body?.text, 500) || null, refId: post.id });
    if (t) sent++;
  }
  if (!sent) fail(400, 'Tidak ada penerima yang bisa dikirimi.');
  return { sent };
});

/** Tandai dibaca sampai sekarang. */
export const markRead = handle(async (req) => {
  const v = await requireViewer(req);
  const { t } = await threadForViewer(req.params.id, v.id);
  const at = new Date();
  await prisma.rcThreadMember.update({ where: { threadId_memberId: { threadId: t.id, memberId: v.id } }, data: { lastReadAt: at } });
  await broadcast(t, v.id, 'read', { threadId: t.id, memberId: v.id, at });
  return { ok: true };
});

export const typing = handle(async (req) => {
  const v = await requireViewer(req);
  const { t } = await threadForViewer(req.params.id, v.id);
  await broadcast(t, v.id, 'typing', { threadId: t.id, user: shapeUser(v) });
  return { ok: true };
});

/** Terima / hapus permintaan pesan. */
export const answerThreadRequest = handle(async (req) => {
  const v = await requireViewer(req);
  const { t, me } = await threadForViewer(req.params.id, v.id);
  if (me.status !== 'REQUEST') return { ok: true };
  if (req.body?.accept) await prisma.rcThreadMember.update({ where: { threadId_memberId: { threadId: t.id, memberId: v.id } }, data: { status: 'ACCEPTED', lastReadAt: new Date() } });
  else await prisma.rcThreadMember.update({ where: { threadId_memberId: { threadId: t.id, memberId: v.id } }, data: { status: 'LEFT' } });
  return { ok: true };
});

export const muteThread = handle(async (req) => {
  const v = await requireViewer(req);
  const { t } = await threadForViewer(req.params.id, v.id);
  await prisma.rcThreadMember.update({ where: { threadId_memberId: { threadId: t.id, memberId: v.id } }, data: { muted: req.body?.muted !== false } });
  return { muted: req.body?.muted !== false };
});

export const leaveThread = handle(async (req) => {
  const v = await requireViewer(req);
  const { t } = await threadForViewer(req.params.id, v.id);
  await prisma.rcThreadMember.update({ where: { threadId_memberId: { threadId: t.id, memberId: v.id } }, data: { status: 'LEFT' } });
  if (t.isGroup) {
    await prisma.rcMessage.create({ data: { threadId: t.id, senderId: v.id, kind: 'SYSTEM', text: seal('keluar dari grup') } });
  }
  return { ok: true };
});

async function ownMessage(viewerId, id) {
  const m = await prisma.rcMessage.findUnique({ where: { id }, include: { thread: { include: { members: true } } } });
  if (!m || !m.thread.members.some((x) => x.memberId === viewerId && x.status !== 'LEFT')) fail(404, 'Pesan tidak ditemukan.');
  return m;
}

/** Edit pesan teks sendiri dalam 15 menit. */
export const editMessage = handle(async (req) => {
  const v = await requireViewer(req);
  const m = await ownMessage(v.id, req.params.id);
  if (m.senderId !== v.id || m.kind !== 'TEXT' || m.unsentAt) fail(403, 'Pesan ini tidak bisa diedit.');
  if (Date.now() - m.createdAt.getTime() > EDIT_WINDOW) fail(403, 'Pesan hanya bisa diedit dalam 15 menit.');
  const text = cleanText(req.body?.text, 2000);
  if (!text) fail(400, 'Pesan kosong.');
  await prisma.rcMessage.update({ where: { id: m.id }, data: { text: seal(text), editedAt: new Date() } });
  for (const x of m.thread.members) if (x.memberId !== v.id) pushTo(x.memberId, 'message-update', { threadId: m.threadId, id: m.id, text, edited: true });
  return { ok: true };
});

/** Tarik pesan (hilang untuk semua orang). */
export const unsend = handle(async (req) => {
  const v = await requireViewer(req);
  const m = await ownMessage(v.id, req.params.id);
  if (m.senderId !== v.id) fail(403, 'Hanya pengirim yang bisa menarik pesan.');
  await prisma.rcMessage.update({ where: { id: m.id }, data: { unsentAt: new Date(), text: null, url: null } });
  removePrivate(m.url);
  for (const x of m.thread.members) if (x.memberId !== v.id) pushTo(x.memberId, 'message-update', { threadId: m.threadId, id: m.id, unsent: true });
  return { ok: true };
});

export const reactMessage = handle(async (req) => {
  const v = await requireViewer(req);
  const m = await ownMessage(v.id, req.params.id);
  const emoji = req.body?.emoji;
  if (emoji === null || emoji === '') await prisma.rcMessageReaction.deleteMany({ where: { messageId: m.id, memberId: v.id } });
  else {
    if (!REACTIONS.includes(emoji)) fail(400, 'Reaksi tidak dikenal.');
    await prisma.rcMessageReaction.upsert({ where: { messageId_memberId: { messageId: m.id, memberId: v.id } }, update: { emoji }, create: { messageId: m.id, memberId: v.id, emoji } });
  }
  const reactions = await prisma.rcMessageReaction.findMany({ where: { messageId: m.id } });
  for (const x of m.thread.members) if (x.memberId !== v.id) pushTo(x.memberId, 'message-update', { threadId: m.threadId, id: m.id, reactions });
  return { reactions: reactions.map((r) => ({ emoji: r.emoji, memberId: r.memberId })) };
});

/** Buka foto sekali lihat: URL diberikan sekali, lalu ditandai terbuka. */
export const openViewOnce = handle(async (req) => {
  const v = await requireViewer(req);
  const m = await ownMessage(v.id, req.params.id);
  if (!m.viewOnce || m.senderId === v.id) fail(400, 'Bukan foto sekali lihat.');
  if (m.openedAt) fail(410, 'Foto ini sudah dibuka.');
  await prisma.rcMessage.update({ where: { id: m.id }, data: { openedAt: new Date() } });
  pushTo(m.senderId, 'message-update', { threadId: m.threadId, id: m.id, opened: true });
  // Token satu kali: foto bisa diambil sekali, lalu file dihapus
  const token = crypto.randomBytes(16).toString('hex');
  onceTokens.set(token, { id: m.id, viewerId: v.id, exp: Date.now() + 60_000 });
  return { url: `${mediaUrl(m.id)}?once=${token}` };
});

// ─── Notes (catatan singkat 24 jam di atas kotak masuk) ─────────────────────
export const notes = handle(async (req) => {
  const v = await requireViewer(req);
  const following = await prisma.follow.findMany({ where: { followerId: v.id }, select: { followingId: true } });
  const ids = [v.id, ...following.map((f) => f.followingId)];
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const rows = await prisma.rcProfile.findMany({ where: { memberId: { in: ids }, note: { not: null }, noteAt: { gt: since } }, include: { member: { select: PUBLIC_MEMBER } } });
  // Note dari akun yang mengikuti balik (saling mengikuti) saja, seperti Instagram
  const mutual = new Set((await prisma.follow.findMany({ where: { followingId: v.id, followerId: { in: ids } }, select: { followerId: true } })).map((x) => x.followerId));
  return {
    items: rows.filter((r) => r.memberId === v.id || mutual.has(r.memberId))
      .sort((a, b) => (b.memberId === v.id) - (a.memberId === v.id) || b.noteAt - a.noteAt)
      .map((r) => ({ user: shapeUser(r.member), note: r.note, at: r.noteAt, mine: r.memberId === v.id }))
  };
});

export const setNote = handle(async (req) => {
  const v = await requireViewer(req);
  const note = cleanText(req.body?.note, 60) || null;
  await prisma.rcProfile.update({ where: { memberId: v.id }, data: { note, noteAt: note ? new Date() : null } });
  return { note };
});

export const unreadCount = async (memberId) => {
  const rows = await prisma.rcThreadMember.findMany({ where: { memberId, status: 'ACCEPTED', muted: false }, select: { threadId: true, lastReadAt: true } });
  let n = 0;
  for (const r of rows) {
    const c = await prisma.rcMessage.count({ where: { threadId: r.threadId, senderId: { not: memberId }, createdAt: { gt: r.lastReadAt || new Date(0) } } });
    if (c) n++;
  }
  return n;
};

export const DM_REACTIONS = REACTIONS;

// ─── Foto pesan (privat) ────────────────────────────────────────────────────
const onceTokens = new Map();
function removePrivate(url) {
  if (!url || !url.startsWith('dm:')) return;
  fs.rm(path.join(PRIVATE_DIR, path.basename(url.slice(3))), { force: true }, () => {});
}

/** GET /api/rc/messages/:id/media — hanya anggota percakapan; sekali lihat butuh token. */
export const media = handle(async (req, res) => {
  const v = await requireViewer(req);
  const m = await ownMessage(v.id, req.params.id);
  if (!m.url || !m.url.startsWith('dm:') || m.unsentAt) fail(404, 'Foto tidak ditemukan.');
  if (m.viewOnce && m.senderId !== v.id) {
    const t = onceTokens.get(String(req.query.once || ''));
    if (!t || t.id !== m.id || t.viewerId !== v.id || t.exp < Date.now()) fail(410, 'Foto sekali lihat sudah dibuka.');
    onceTokens.delete(String(req.query.once));
  } else if (m.viewOnce) {
    fail(403, 'Foto sekali lihat tidak bisa dibuka lagi oleh pengirim.');
  }
  const file = path.join(PRIVATE_DIR, path.basename(m.url.slice(3)));
  if (!fs.existsSync(file)) fail(404, 'Foto tidak ditemukan.');
  const buf = openBuffer(fs.readFileSync(file));
  if (m.viewOnce) {
    // Setelah dibuka penerima: file dihapus permanen (1-on-1) atau setelah semua anggota membuka (grup: sederhana, hapus saat ini)
    removePrivate(m.url);
    await prisma.rcMessage.update({ where: { id: m.id }, data: { url: null } });
  }
  res.set({ 'Content-Type': 'image/webp', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' });
  res.end(buf);
});
