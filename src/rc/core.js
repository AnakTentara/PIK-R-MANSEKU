/**
 * Ruang Cerita — fondasi bersama: akun, privasi, media, notifikasi, realtime.
 *
 * Prinsip (akun remaja, mengikuti pola Akun Remaja Instagram):
 * - Hanya anggota PIK-R (Member) yang punya akun. Alumni tetap bisa memakai.
 * - Akun privat secara bawaan: postingan & cerita hanya untuk pengikut yang disetujui.
 * - Pesan langsung hanya dari akun yang diikuti (bisa diubah pemilik akun).
 * - Blokir dua arah; bisukan & batasi tidak diberitahukan ke target.
 * - Konten tidak pernah diindeks mesin pencari (lihat header X-Robots-Tag di router).
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import prisma from '../config/db.js';
import { sendPushToMember } from '../services/webPush.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const RC_UPLOAD_DIR = path.join(__dirname, '../../public/uploads/rc');
fs.mkdirSync(RC_UPLOAD_DIR, { recursive: true });

export class RcError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const fail = (status, message) => { throw new RcError(status, message); };

/** Bungkus handler async: RcError -> status yang sesuai, lainnya -> 500 + log. */
export const handle = (fn) => async (req, res) => {
  try {
    const out = await fn(req, res);
    if (out !== undefined && !res.headersSent) res.json(out);
  } catch (err) {
    if (err instanceof RcError) return res.status(err.status).json({ message: err.message });
    if (err?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'File terlalu besar.' });
    console.error(`[RC] ${req.method} ${req.originalUrl}:`, err);
    if (!res.headersSent) res.status(500).json({ message: 'Terjadi kesalahan. Coba lagi sebentar.' });
  }
};

// ─── Akun ───────────────────────────────────────────────────────────────────
export const PUBLIC_MEMBER = { id: true, name: true, slug: true, photoPath: true, status: true, className: true };

export function shapeUser(m) {
  if (!m) return null;
  return { id: m.id, name: (m.name || '').trim(), username: m.slug, photo: m.photoPath || null, isAlumni: m.status === 'ALUMNI' };
}

/** Profil Ruang Cerita milik anggota; dibuat otomatis saat pertama dipakai. */
export async function ensureProfile(memberId) {
  // Bawaan akun baru: publik + pesan dari semua anggota (keputusan pengurus, 2026-11-09)
  return prisma.rcProfile.upsert({ where: { memberId }, update: {}, create: { memberId, isPrivate: false, dmPolicy: 'EVERYONE' } });
}

/** Anggota yang sedang login (wajib). Melempar 401/403. */
export async function requireViewer(req, { allowFrozen = false } = {}) {
  if (!req.candidate) fail(401, 'Masuk dulu untuk melanjutkan.');
  if (!req.candidate.isMember) fail(403, 'Ruang Cerita khusus akun anggota PIK-R.');
  const m = await prisma.member.findUnique({ where: { id: req.candidate.id }, select: { ...PUBLIC_MEMBER } });
  if (!m) fail(401, 'Akun tidak ditemukan. Silakan masuk lagi.');
  if (!m.slug) fail(409, 'Akunmu belum punya nama pengguna. Hubungi pengurus.');
  const profile = await ensureProfile(m.id);
  if (!allowFrozen && profile.frozenUntil && profile.frozenUntil > new Date()) {
    fail(403, `Akun Ruang Cerita kamu dibekukan sementara oleh pengurus${profile.frozenReason ? `: ${profile.frozenReason}` : ''}.`);
  }
  // "Terakhir aktif" diperbarui paling sering tiap 1 menit
  if (!profile.lastSeenAt || Date.now() - profile.lastSeenAt.getTime() > 60_000) {
    prisma.rcProfile.update({ where: { memberId: m.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  }
  return { ...m, profile };
}

export async function findUserByUsername(username) {
  const slug = String(username || '').replace(/^@/, '').toLowerCase();
  if (!/^[a-z0-9._-]{1,80}$/.test(slug)) return null;
  return prisma.member.findUnique({ where: { slug }, select: PUBLIC_MEMBER });
}

// ─── Relasi & privasi ───────────────────────────────────────────────────────
/** Semua akun yang tidak boleh terlihat oleh viewer (blokir dua arah). */
export async function blockedIds(viewerId) {
  const rows = await prisma.memberRelation.findMany({
    where: { type: 'BLOCK', OR: [{ ownerId: viewerId }, { targetId: viewerId }] },
    select: { ownerId: true, targetId: true }
  });
  return new Set(rows.map((r) => (r.ownerId === viewerId ? r.targetId : r.ownerId)));
}
export async function mutedIds(viewerId) {
  const rows = await prisma.memberRelation.findMany({ where: { ownerId: viewerId, type: 'MUTE' }, select: { targetId: true } });
  return new Set(rows.map((r) => r.targetId));
}
export async function followingIds(viewerId) {
  const rows = await prisma.follow.findMany({ where: { followerId: viewerId }, select: { followingId: true } });
  return new Set(rows.map((r) => r.followingId));
}
/** Akun yang menjadikan viewer teman dekat (viewer boleh melihat konten "Teman Dekat" mereka). */
export async function closeFriendOf(viewerId) {
  const rows = await prisma.memberRelation.findMany({ where: { targetId: viewerId, type: 'CLOSE_FRIEND' }, select: { ownerId: true } });
  return new Set(rows.map((r) => r.ownerId));
}

/**
 * Hubungan viewer → target untuk satu profil.
 * canSee: boleh melihat postingan/cerita (diri sendiri, akun publik, atau sudah mengikuti akun privat).
 */
export async function relationTo(viewerId, targetId) {
  if (viewerId === targetId) return { self: true, canSee: true, following: true };
  const [profile, follow, followsMe, req, rels, blockedByThem] = await Promise.all([
    ensureProfile(targetId),
    prisma.follow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: targetId } } }),
    prisma.follow.findUnique({ where: { followerId_followingId: { followerId: targetId, followingId: viewerId } } }),
    prisma.rcFollowRequest.findUnique({ where: { requesterId_targetId: { requesterId: viewerId, targetId } } }),
    prisma.memberRelation.findMany({ where: { ownerId: viewerId, targetId }, select: { type: true } }),
    prisma.memberRelation.findFirst({ where: { ownerId: targetId, targetId: viewerId, type: 'BLOCK' }, select: { id: true } })
  ]);
  const types = new Set(rels.map((r) => r.type));
  const restricted = !!(await prisma.rcRestrict.findUnique({ where: { ownerId_targetId: { ownerId: viewerId, targetId } } }));
  const blocked = types.has('BLOCK') || !!blockedByThem;
  return {
    self: false,
    isPrivate: profile.isPrivate,
    following: !!follow,
    followsMe: !!followsMe,
    requested: !!req,
    closeFriend: types.has('CLOSE_FRIEND'),
    muted: types.has('MUTE'),
    restricted,
    blockedByMe: types.has('BLOCK'),
    blocked,
    canSee: !blocked && (!profile.isPrivate || !!follow)
  };
}

// ─── Teks ───────────────────────────────────────────────────────────────────
/** Teks polos aman: tanpa tag, karakter kontrol dibuang, panjang dibatasi. */
export function cleanText(s, max = 2200) {
  return String(s ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()
    .slice(0, max);
}
export const mentionsIn = (text) => [...new Set((String(text).match(/@([a-z0-9._-]{2,40})/gi) || []).map((x) => x.slice(1).toLowerCase()))].slice(0, 20);

/** Kata tersembunyi milik penerima (dipisah koma) + daftar kasar bawaan. */
const DEFAULT_HIDDEN = ['anjing', 'bangsat', 'kontol', 'memek', 'ngentot', 'bajingan', 'goblok', 'tolol', 'babi lu', 'jancok', 'asu'];
export function hasHiddenWord(text, custom = '') {
  const t = ` ${String(text).toLowerCase()} `;
  const words = [...DEFAULT_HIDDEN, ...String(custom).split(',').map((w) => w.trim().toLowerCase()).filter(Boolean)];
  return words.some((w) => t.includes(w));
}

// ─── Media ──────────────────────────────────────────────────────────────────
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
export const isVideo = (mime) => VIDEO_TYPES.has(mime);
export const isImage = (mime) => IMAGE_TYPES.has(mime);

const rid = () => `${Date.now().toString(36)}${crypto.randomBytes(6).toString('hex')}`;

/**
 * Simpan gambar unggahan: diputar sesuai EXIF, diperkecil (sisi terpanjang 1440 px), WebP.
 * Metadata (termasuk lokasi GPS dari kamera HP) dibuang demi privasi siswa.
 * Hasil: { url, thumbUrl, width, height }.
 */
export async function saveImage(buffer, { maxSide = 1440, thumb = true } = {}) {
  const name = rid();
  const img = sharp(buffer, { failOn: 'error', limitInputPixels: 60_000_000 }).rotate();
  const main = await img.clone().resize({ width: maxSide, height: maxSide, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  fs.writeFileSync(path.join(RC_UPLOAD_DIR, `${name}.webp`), main.data);
  let thumbUrl = null;
  if (thumb) {
    const t = await img.clone().resize({ width: 480, height: 480, fit: 'cover', position: 'attention' }).webp({ quality: 72 }).toBuffer();
    fs.writeFileSync(path.join(RC_UPLOAD_DIR, `${name}_t.webp`), t);
    thumbUrl = `/uploads/rc/${name}_t.webp`;
  }
  return { url: `/uploads/rc/${name}.webp`, thumbUrl, width: main.info.width, height: main.info.height };
}

/** Simpan video apa adanya (tanpa transkode; ukuran dibatasi oleh multer). */
export function saveVideo(buffer, mime) {
  const ext = mime === 'video/webm' ? 'webm' : mime === 'video/quicktime' ? 'mov' : 'mp4';
  const name = `${rid()}.${ext}`;
  fs.writeFileSync(path.join(RC_UPLOAD_DIR, name), buffer);
  return { url: `/uploads/rc/${name}`, thumbUrl: null, width: 1080, height: 1920 };
}

export async function saveUpload(file, opts) {
  if (isImage(file.mimetype)) return { kind: 'IMAGE', ...(await saveImage(file.buffer, opts)) };
  if (isVideo(file.mimetype)) return { kind: 'VIDEO', ...saveVideo(file.buffer, file.mimetype) };
  fail(415, 'Format file tidak didukung. Pakai foto (JPG/PNG/WebP) atau video (MP4/WebM).');
  return null;
}

/** Hapus file milik Ruang Cerita (aman: hanya di folder uploads/rc). */
export function removeFiles(...urls) {
  for (const u of urls.flat()) {
    if (!u || !u.startsWith('/uploads/rc/')) continue;
    const p = path.join(RC_UPLOAD_DIR, path.basename(u));
    fs.rm(p, { force: true }, () => {});
  }
}

// ─── Realtime (SSE) ─────────────────────────────────────────────────────────
// Satu bus untuk semua klien yang tersambung; event dikirim per anggota.
export const bus = new EventEmitter();
bus.setMaxListeners(1000);
export const pushTo = (memberId, event, data) => bus.emit(`u:${memberId}`, { event, data });

// ─── Notifikasi ─────────────────────────────────────────────────────────────
/** Buat notifikasi (tidak untuk diri sendiri, tidak bila penerima memblokir/membisukan aktor). */
export async function notify(userId, actorId, type, extra = {}) {
  if (!userId || userId === actorId) return;
  if (actorId) {
    const hidden = await prisma.memberRelation.findFirst({ where: { ownerId: userId, targetId: actorId, type: { in: ['BLOCK', 'MUTE'] } }, select: { id: true } });
    if (hidden) return;
  }
  // Suka beruntun pada postingan yang sama tidak menumpuk notifikasi baru
  if (type === 'LIKE' && extra.postId) {
    const dup = await prisma.rcNotification.findFirst({ where: { userId, actorId, type, postId: extra.postId }, select: { id: true } });
    if (dup) return;
  }
  const n = await prisma.rcNotification.create({ data: { userId, actorId, type, ...extra } });

  let actor = null;
  if (actorId) {
    const a = await prisma.member.findUnique({ where: { id: actorId }, select: PUBLIC_MEMBER });
    if (a) actor = shapeUser(a);
  }

  pushTo(userId, 'notification', {
    id: n.id,
    type,
    text: extra.text || null,
    actor,
    postId: extra.postId || null,
    commentId: extra.commentId || null,
    createdAt: n.createdAt
  });

  // Kirim Web Push ke background / offline devices milik user
  try {
    let pushTitle = 'PIK-R MANSEKU';
    let pushBody = '';
    let targetUrl = '/aktivitas';
    const actorName = actor?.name || 'Seseorang';

    switch (type) {
      case 'LIKE':
        pushTitle = '❤️ Suka Baru di Ruang Cerita';
        pushBody = `${actorName} menyukai postinganmu.`;
        targetUrl = extra.postId ? `/p/${extra.postId}` : '/aktivitas';
        break;
      case 'COMMENT':
        pushTitle = '💬 Komentar Baru di Ruang Cerita';
        pushBody = extra.text ? `${actorName}: "${extra.text}"` : `${actorName} mengomentari postinganmu.`;
        targetUrl = extra.postId ? `/p/${extra.postId}` : '/aktivitas';
        break;
      case 'REPLY':
        pushTitle = '💬 Balasan Komentar Baru';
        pushBody = extra.text ? `${actorName}: "${extra.text}"` : `${actorName} membalas komentarmu.`;
        targetUrl = extra.postId ? `/p/${extra.postId}` : '/aktivitas';
        break;
      case 'STORY_LIKE':
        pushTitle = '❤️ Suka Cerita';
        pushBody = `${actorName} menyukai ceritamu.`;
        targetUrl = actor?.username ? `/${actor.username}` : '/';
        break;
      case 'STORY_REACT':
        pushTitle = '✨ Reaksi Cerita';
        pushBody = `${actorName} bereaksi ${extra.text || '🙌'} pada ceritamu.`;
        targetUrl = actor?.username ? `/${actor.username}` : '/';
        break;
      case 'FOLLOW':
        pushTitle = '👥 Pengikut Baru';
        pushBody = `${actorName} mulai mengikutimu di Ruang Cerita.`;
        targetUrl = actor?.username ? `/${actor.username}` : '/aktivitas';
        break;
      case 'FOLLOW_REQUEST':
        pushTitle = '🔒 Permintaan Mengikuti';
        pushBody = `${actorName} meminta untuk mengikutimu.`;
        targetUrl = '/aktivitas';
        break;
      case 'FOLLOW_ACCEPT':
        pushTitle = '🎉 Permintaan Diterima';
        pushBody = `${actorName} menerima permintaan pertemananmu.`;
        targetUrl = actor?.username ? `/${actor.username}` : '/aktivitas';
        break;
      case 'TAG':
        pushTitle = '🏷️ Ditandai dalam Postingan';
        pushBody = `${actorName} menandaimu dalam sebuah postingan.`;
        targetUrl = extra.postId ? `/p/${extra.postId}` : '/aktivitas';
        break;
      case 'MENTION':
        pushTitle = '📢 Disebutkan dalam Konten';
        pushBody = `${actorName} menyebutmu: "${extra.text || ''}"`;
        targetUrl = extra.postId ? `/p/${extra.postId}` : '/aktivitas';
        break;
      case 'MESSAGE':
        pushTitle = `✉️ Pesan Baru dari ${actorName}`;
        pushBody = extra.text || 'Mengirim pesan baru kepadamu.';
        targetUrl = extra.threadId ? `/pesan/${extra.threadId}` : '/pesan';
        break;
      case 'NEW_POST':
        pushTitle = `📸 Postingan Baru dari ${actorName}`;
        pushBody = extra.text ? `${actorName}: "${extra.text}"` : `${actorName} membagikan postingan baru.`;
        targetUrl = extra.postId ? `/p/${extra.postId}` : '/';
        break;
      case 'NEW_STORY':
        pushTitle = `⏱️ Cerita Baru dari ${actorName}`;
        pushBody = `${actorName} baru saja membagikan cerita baru.`;
        targetUrl = actor?.username ? `/${actor.username}` : '/';
        break;
      case 'COUNSEL':
        pushTitle = '🤝 Bilik Konseling PIK-R';
        pushBody = extra.text || 'Pemberitahuan konseling sebaya baru.';
        targetUrl = '/konseling';
        break;
      default:
        pushTitle = '🔔 Notifikasi Ruang Cerita';
        pushBody = extra.text || `${actorName} berinteraksi denganmu.`;
        targetUrl = '/aktivitas';
        break;
    }

    sendPushToMember(userId, {
      title: pushTitle,
      body: pushBody,
      icon: actor?.photo || '/media/logos/logo_pik-r.png',
      badge: '/media/logos/logo_pik-r.png',
      data: {
        url: targetUrl,
        category: 'RUANG_CERITA',
        type
      }
    }).catch((err) => console.error('[WebPush] Error pushToMember:', err.message));
  } catch (err) {
    console.error('[WebPush] notify push error:', err);
  }
}

export const now = () => new Date();
export const HOURS = (h) => h * 60 * 60 * 1000;
