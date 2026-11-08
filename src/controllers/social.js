/**
 * Fitur sosial antar anggota (dasar untuk Ruang Cerita):
 * ikuti / berhenti ikuti, teman dekat, bisukan, blokir, laporkan.
 *
 * Aturan privasi:
 * - Teman dekat, bisukan, dan blokir tidak pernah terlihat oleh akun target.
 * - Blokir dua arah: saling tidak bisa mengikuti; profil yang memblokir tampil "tidak tersedia" bagi yang diblokir.
 * - Hanya akun anggota (bukan pendaftar) yang punya profil sosial.
 */
import prisma from '../config/db.js';

const RELATIONS = { 'close-friend': 'CLOSE_FRIEND', mute: 'MUTE', block: 'BLOCK' };
const REPORT_REASONS = ['SPAM', 'PELECEHAN', 'KONTEN_TIDAK_PANTAS', 'AKUN_PALSU', 'LAINNYA'];

/** Anggota yang sedang login (token anggota). Pendaftar ditolak. */
async function me(req, res) {
  if (!req.candidate?.isMember) {
    res.status(403).json({ message: 'Fitur ini khusus akun anggota PIK-R.' });
    return null;
  }
  const m = await prisma.member.findUnique({ where: { id: req.candidate.id }, select: { id: true, slug: true } });
  if (!m) res.status(401).json({ message: 'Akun tidak ditemukan. Silakan masuk lagi.' });
  return m;
}

async function targetBySlug(slug, res) {
  const t = await prisma.member.findUnique({ where: { slug: String(slug || '').replace(/^@/, '') }, select: { id: true, slug: true } });
  if (!t) res.status(404).json({ message: 'Profil tidak ditemukan' });
  return t;
}

async function isBlockedBetween(a, b) {
  return !!(await prisma.memberRelation.findFirst({
    where: { type: 'BLOCK', OR: [{ ownerId: a, targetId: b }, { ownerId: b, targetId: a }] },
    select: { id: true }
  }));
}

/** Data sosial untuk halaman profil /@slug (dipanggil oleh getPublicProfile). */
export async function socialSummary(targetId, viewerId) {
  const [followers, following, posts] = await Promise.all([
    prisma.follow.count({ where: { followingId: targetId } }),
    prisma.follow.count({ where: { followerId: targetId } }),
    prisma.blogPost.count({ where: { memberId: targetId, status: 'PUBLISHED' } })
  ]);
  const base = { followers, following, posts };
  if (!viewerId || viewerId === targetId) return { ...base, isSelf: viewerId === targetId, viewer: null };
  const [follow, followsYou, rels, blockedBy] = await Promise.all([
    prisma.follow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: targetId } }, select: { id: true } }),
    prisma.follow.findUnique({ where: { followerId_followingId: { followerId: targetId, followingId: viewerId } }, select: { id: true } }),
    prisma.memberRelation.findMany({ where: { ownerId: viewerId, targetId }, select: { type: true } }),
    prisma.memberRelation.findFirst({ where: { ownerId: targetId, targetId: viewerId, type: 'BLOCK' }, select: { id: true } })
  ]);
  const types = new Set(rels.map((r) => r.type));
  return {
    ...base,
    isSelf: false,
    blockedByTarget: !!blockedBy,
    viewer: {
      following: !!follow,
      followsYou: !!followsYou,
      closeFriend: types.has('CLOSE_FRIEND'),
      muted: types.has('MUTE'),
      blocked: types.has('BLOCK')
    }
  };
}

// POST /api/social/follow/:slug
export async function follow(req, res) {
  try {
    const m = await me(req, res); if (!m) return;
    const t = await targetBySlug(req.params.slug, res); if (!t) return;
    if (t.id === m.id) return res.status(400).json({ message: 'Tidak bisa mengikuti diri sendiri.' });
    if (await isBlockedBetween(m.id, t.id)) return res.status(403).json({ message: 'Tidak bisa mengikuti akun ini.' });
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: m.id, followingId: t.id } },
      update: {},
      create: { followerId: m.id, followingId: t.id }
    });
    return res.json(await socialSummary(t.id, m.id));
  } catch (error) {
    console.error('Error follow:', error);
    return res.status(500).json({ message: 'Gagal mengikuti' });
  }
}

// DELETE /api/social/follow/:slug
export async function unfollow(req, res) {
  try {
    const m = await me(req, res); if (!m) return;
    const t = await targetBySlug(req.params.slug, res); if (!t) return;
    await prisma.follow.deleteMany({ where: { followerId: m.id, followingId: t.id } });
    // Berhenti mengikuti juga melepas status teman dekat
    await prisma.memberRelation.deleteMany({ where: { ownerId: m.id, targetId: t.id, type: 'CLOSE_FRIEND' } });
    return res.json(await socialSummary(t.id, m.id));
  } catch (error) {
    console.error('Error unfollow:', error);
    return res.status(500).json({ message: 'Gagal berhenti mengikuti' });
  }
}

// PUT /api/social/relation/:slug { type: close-friend|mute|block, on: boolean }
export async function setRelation(req, res) {
  const type = RELATIONS[req.body?.type];
  const on = req.body?.on !== false;
  if (!type) return res.status(400).json({ message: 'Jenis tidak dikenal.' });
  try {
    const m = await me(req, res); if (!m) return;
    const t = await targetBySlug(req.params.slug, res); if (!t) return;
    if (t.id === m.id) return res.status(400).json({ message: 'Tidak bisa untuk akun sendiri.' });
    if (!on) {
      await prisma.memberRelation.deleteMany({ where: { ownerId: m.id, targetId: t.id, type } });
    } else {
      if (type === 'CLOSE_FRIEND' && !(await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: m.id, followingId: t.id } } }))) {
        return res.status(400).json({ message: 'Ikuti akun ini dulu sebelum menambahkannya ke teman dekat.' });
      }
      await prisma.memberRelation.upsert({
        where: { ownerId_targetId_type: { ownerId: m.id, targetId: t.id, type } },
        update: {},
        create: { ownerId: m.id, targetId: t.id, type }
      });
      if (type === 'BLOCK') {
        // Blokir memutus semua hubungan ke dua arah
        await prisma.$transaction([
          prisma.follow.deleteMany({ where: { OR: [{ followerId: m.id, followingId: t.id }, { followerId: t.id, followingId: m.id }] } }),
          prisma.memberRelation.deleteMany({ where: { OR: [{ ownerId: m.id, targetId: t.id, type: { in: ['CLOSE_FRIEND', 'MUTE'] } }, { ownerId: t.id, targetId: m.id, type: 'CLOSE_FRIEND' }] } })
        ]);
      }
    }
    return res.json(await socialSummary(t.id, m.id));
  } catch (error) {
    console.error('Error setRelation:', error);
    return res.status(500).json({ message: 'Gagal menyimpan' });
  }
}

// POST /api/social/report { targetType: MEMBER|POST|COMMENT, target (slug untuk MEMBER, id untuk lainnya), reason, note? }
export async function report(req, res) {
  const targetType = String(req.body?.targetType || '').toUpperCase();
  const reason = String(req.body?.reason || '').toUpperCase();
  const note = String(req.body?.note || '').trim().slice(0, 500) || null;
  if (!['MEMBER', 'POST', 'COMMENT'].includes(targetType)) return res.status(400).json({ message: 'Jenis laporan tidak dikenal.' });
  if (!REPORT_REASONS.includes(reason)) return res.status(400).json({ message: 'Pilih alasan laporan.' });
  try {
    const m = await me(req, res); if (!m) return;
    let targetId = String(req.body?.target || '');
    if (targetType === 'MEMBER') {
      const t = await targetBySlug(targetId, res); if (!t) return;
      if (t.id === m.id) return res.status(400).json({ message: 'Tidak bisa melaporkan akun sendiri.' });
      targetId = t.id;
    } else {
      const exists = targetType === 'POST'
        ? await prisma.blogPost.findUnique({ where: { id: targetId }, select: { id: true } })
        : await prisma.blogComment.findUnique({ where: { id: targetId }, select: { id: true } });
      if (!exists) return res.status(404).json({ message: 'Konten tidak ditemukan.' });
    }
    await prisma.report.upsert({
      where: { reporterId_targetType_targetId: { reporterId: m.id, targetType, targetId } },
      update: { reason, note, status: 'OPEN' },
      create: { reporterId: m.id, targetType, targetId, reason, note }
    });
    return res.json({ message: 'Laporan terkirim. Terima kasih, pengurus akan meninjaunya.' });
  } catch (error) {
    console.error('Error report:', error);
    return res.status(500).json({ message: 'Gagal mengirim laporan' });
  }
}

// GET /api/social/list/:slug/:kind (kind: followers|following) — daftar singkat untuk popup
export async function list(req, res) {
  const kind = req.params.kind;
  if (!['followers', 'following'].includes(kind)) return res.status(400).json({ message: 'Daftar tidak dikenal.' });
  try {
    const t = await targetBySlug(req.params.slug, res); if (!t) return;
    const rows = await prisma.follow.findMany({
      where: kind === 'followers' ? { followingId: t.id } : { followerId: t.id },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: kind === 'followers'
        ? { follower: { select: { name: true, slug: true, photoPath: true, className: true, status: true } } }
        : { following: { select: { name: true, slug: true, photoPath: true, className: true, status: true } } }
    });
    return res.json(rows.map((r) => { const p = r.follower || r.following; return { ...p, name: p.name.trim() }; }));
  } catch (error) {
    console.error('Error social list:', error);
    return res.status(500).json({ message: 'Gagal memuat daftar' });
  }
}

// ── STORIES (Ruang Cerita 24 Jam) ──────────────────────────────────────────

// GET /api/social/stories - Semua story aktif (24 jam terakhir)
export async function getStories(req, res) {
  try {
    const now = new Date();
    const activeStories = await prisma.story.findMany({
      where: {
        expiresAt: { gt: now }
      },
      orderBy: { createdAt: 'asc' },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            slug: true,
            photoPath: true,
            className: true,
            status: true,
            orgMember: { select: { role: true, isCurrent: true } }
          }
        }
      }
    });

    const memberMap = new Map();
    for (const story of activeStories) {
      const mid = story.memberId;
      if (!memberMap.has(mid)) {
        memberMap.set(mid, {
          member: {
            ...story.member,
            name: story.member.name.trim()
          },
          stories: []
        });
      }
      memberMap.get(mid).stories.push({
        id: story.id,
        mediaUrl: story.mediaUrl,
        caption: story.caption,
        bgColor: story.bgColor,
        views: story.views,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt
      });
    }

    const items = Array.from(memberMap.values());
    return res.json({ items });
  } catch (error) {
    console.error('Error getStories:', error);
    return res.status(500).json({ message: 'Gagal memuat cerita' });
  }
}

// POST /api/social/stories - Buat story baru (foto / teks warna)
export async function createStory(req, res) {
  try {
    const m = await me(req, res);
    if (!m) return;

    let mediaUrl = null;
    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
    } else if (req.body?.mediaUrl) {
      mediaUrl = String(req.body.mediaUrl).trim();
    }

    const caption = req.body?.caption ? String(req.body.caption).trim().slice(0, 300) : null;
    const bgColor = req.body?.bgColor ? String(req.body.bgColor).trim().slice(0, 25) : '#EA580C';

    if (!mediaUrl && !caption) {
      return res.status(400).json({ message: 'Story harus memiliki foto atau teks.' });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const story = await prisma.story.create({
      data: {
        memberId: m.id,
        mediaUrl,
        caption,
        bgColor,
        expiresAt
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            slug: true,
            photoPath: true
          }
        }
      }
    });

    return res.status(201).json({
      message: 'Cerita berhasil diunggah! Aktif selama 24 jam.',
      story
    });
  } catch (error) {
    console.error('Error createStory:', error);
    return res.status(500).json({ message: 'Gagal mengunggah cerita' });
  }
}

// DELETE /api/social/stories/:id
export async function deleteStory(req, res) {
  try {
    const m = await me(req, res);
    if (!m) return;

    const story = await prisma.story.findUnique({
      where: { id: req.params.id }
    });

    if (!story) {
      return res.status(404).json({ message: 'Cerita tidak ditemukan.' });
    }

    if (story.memberId !== m.id && !req.admin) {
      return res.status(403).json({ message: 'Tidak berhak menghapus cerita ini.' });
    }

    await prisma.story.delete({
      where: { id: req.params.id }
    });

    return res.json({ message: 'Cerita berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleteStory:', error);
    return res.status(500).json({ message: 'Gagal menghapus cerita' });
  }
}

// POST /api/social/stories/:id/view
export async function viewStory(req, res) {
  try {
    await prisma.story.update({
      where: { id: req.params.id },
      data: { views: { increment: 1 } }
    });
    return res.json({ ok: true });
  } catch {
    return res.json({ ok: true });
  }
}

export const REPORT_REASON_LIST = REPORT_REASONS;
