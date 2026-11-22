/**
 * Ruang Cerita — notifikasi (aktivitas), aliran realtime (SSE), laporan konten.
 */
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { JWT_SECRET } from '../config/secret.js';
import { handle, fail, requireViewer, shapeUser, PUBLIC_MEMBER, bus, cleanText, findUserByUsername } from './core.js';
import { unreadCount } from './messages.js';

export const list = handle(async (req) => {
  const v = await requireViewer(req);
  const rows = await prisma.rcNotification.findMany({
    where: { userId: v.id },
    orderBy: { createdAt: 'desc' },
    take: 80,
    include: { actor: { select: PUBLIC_MEMBER } }
  });
  const postIds = [...new Set(rows.map((r) => r.postId).filter(Boolean))];
  const posts = postIds.length ? await prisma.rcPost.findMany({ where: { id: { in: postIds } }, select: { id: true, media: { take: 1, orderBy: { order: 'asc' }, select: { thumbUrl: true, url: true } } } }) : [];
  const thumb = new Map(posts.map((p) => [p.id, p.media[0]?.thumbUrl || p.media[0]?.url || null]));
  const following = new Set((await prisma.follow.findMany({ where: { followerId: v.id }, select: { followingId: true } })).map((f) => f.followingId));
  return {
    items: rows.map((r) => ({
      id: r.id, type: r.type, text: r.text, read: !!r.readAt, createdAt: r.createdAt,
      actor: r.actor ? { ...shapeUser(r.actor), following: following.has(r.actor.id) } : null,
      postId: r.postId, commentId: r.commentId, thumb: r.postId ? thumb.get(r.postId) || null : null
    }))
  };
});

export const markAllRead = handle(async (req) => {
  const v = await requireViewer(req);
  await prisma.rcNotification.updateMany({ where: { userId: v.id, readAt: null }, data: { readAt: new Date() } });
  return { ok: true };
});

/** Angka lencana untuk navigasi (dipanggil berkala & saat ada event). */
export const badges = handle(async (req) => {
  const v = await requireViewer(req, { allowFrozen: true });
  const [notifs, dms, requests, counselWaiting] = await Promise.all([
    prisma.rcNotification.count({ where: { userId: v.id, readAt: null } }),
    unreadCount(v.id),
    prisma.rcThreadMember.count({ where: { memberId: v.id, status: 'REQUEST' } }),
    prisma.rcCounselor.findFirst({ where: { memberId: v.id, active: true } }).then((c) => (c ? prisma.rcCounselSession.count({ where: { status: 'WAITING' } }) : 0))
  ]);
  return { notifs, dms, dmRequests: requests, counselWaiting };
});

/**
 * GET /api/rc/stream?token=… — Server-Sent Events per anggota (pesan, notifikasi, konseling).
 * EventSource tidak bisa mengirim header, jadi token dibaca dari query.
 */
export async function stream(req, res) {
  let memberId;
  try {
    const d = jwt.verify(String(req.query.token || ''), JWT_SECRET);
    if (d.role !== 'candidate' || !d.isMember) throw new Error('bukan anggota');
    memberId = d.id;
  } catch {
    return res.status(401).json({ message: 'Akses ditolak' });
  }
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    'X-Robots-Tag': 'noindex'
  });
  res.write(`event: hello\ndata: {}\n\n`);
  const on = ({ event, data }) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  bus.on(`u:${memberId}`, on);
  const beat = setInterval(() => res.write(': ping\n\n'), 20000);
  req.on('close', () => { clearInterval(beat); bus.off(`u:${memberId}`, on); });
}

// ─── Laporan ────────────────────────────────────────────────────────────────
const REASONS = ['SPAM', 'PELECEHAN', 'KONTEN_TIDAK_PANTAS', 'AKUN_PALSU', 'MENYAKITI_DIRI', 'LAINNYA'];
const TYPES = { RC_POST: 'rcPost', RC_COMMENT: 'rcComment', RC_STORY: 'rcStory', MEMBER: 'member', RC_MESSAGE: 'rcMessage' };

export const report = handle(async (req) => {
  const v = await requireViewer(req);
  const targetType = String(req.body?.targetType || '').toUpperCase();
  const reason = String(req.body?.reason || '').toUpperCase();
  if (!TYPES[targetType]) fail(400, 'Jenis laporan tidak dikenal.');
  if (!REASONS.includes(reason)) fail(400, 'Pilih alasan laporan.');
  let targetId = String(req.body?.targetId || '');
  if (targetType === 'MEMBER') {
    const u = await findUserByUsername(targetId);
    if (!u) fail(404, 'Akun tidak ditemukan.');
    targetId = u.id;
  } else {
    const exists = await prisma[TYPES[targetType]].findUnique({ where: { id: targetId }, select: { id: true } });
    if (!exists) fail(404, 'Konten tidak ditemukan.');
  }
  if (targetId === v.id) fail(400, 'Tidak bisa melaporkan diri sendiri.');
  await prisma.report.upsert({
    where: { reporterId_targetType_targetId: { reporterId: v.id, targetType, targetId } },
    update: { reason, note: cleanText(req.body?.note, 500) || null, status: 'OPEN' },
    create: { reporterId: v.id, targetType, targetId, reason, note: cleanText(req.body?.note, 500) || null }
  });
  return { message: 'Laporan terkirim. Identitasmu tidak diberitahukan. Terima kasih sudah menjaga Ruang Cerita.' };
});
