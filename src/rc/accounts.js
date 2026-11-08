/**
 * Ruang Cerita — akun: profil, ikuti, permintaan ikuti, privasi, cari, saran.
 */
import prisma from '../config/db.js';
import { memberTitle, ORG_TITLE_SELECT } from '../utils/memberUtils.js';
import {
  handle, fail, requireViewer, ensureProfile, findUserByUsername, relationTo, shapeUser, PUBLIC_MEMBER,
  blockedIds, followingIds, notify, cleanText
} from './core.js';

const DM_POLICIES = ['EVERYONE', 'FOLLOWING', 'NONE'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

async function counts(memberId) {
  const [posts, followers, following] = await Promise.all([
    prisma.rcPost.count({ where: { authorId: memberId, removedAt: null } }),
    prisma.follow.count({ where: { followingId: memberId } }),
    prisma.follow.count({ where: { followerId: memberId } })
  ]);
  return { posts, followers, following };
}

/** Akun saya + pengaturan (dipanggil saat aplikasi dibuka). */
export const me = handle(async (req) => {
  const v = await requireViewer(req, { allowFrozen: true });
  const [c, unreadNotifs, requests, frozen] = await Promise.all([
    counts(v.id),
    prisma.rcNotification.count({ where: { userId: v.id, readAt: null } }),
    prisma.rcFollowRequest.count({ where: { targetId: v.id } }),
    v.profile.frozenUntil && v.profile.frozenUntil > new Date()
  ]);
  const isCounselor = !!(await prisma.rcCounselor.findFirst({ where: { memberId: v.id, active: true }, select: { memberId: true } }));
  return {
    user: shapeUser(v),
    counts: c,
    unreadNotifs,
    followRequests: requests,
    isCounselor,
    frozen: frozen ? { until: v.profile.frozenUntil, reason: v.profile.frozenReason } : null,
    settings: {
      isPrivate: v.profile.isPrivate,
      dmPolicy: v.profile.dmPolicy,
      showActivity: v.profile.showActivity,
      hiddenWords: v.profile.hiddenWords,
      quietStart: v.profile.quietStart,
      quietEnd: v.profile.quietEnd
    }
  };
});

export const updateSettings = handle(async (req) => {
  const v = await requireViewer(req, { allowFrozen: true });
  const b = req.body || {};
  const data = {};
  if (typeof b.isPrivate === 'boolean') data.isPrivate = b.isPrivate;
  if (DM_POLICIES.includes(b.dmPolicy)) data.dmPolicy = b.dmPolicy;
  if (typeof b.showActivity === 'boolean') data.showActivity = b.showActivity;
  if (typeof b.hiddenWords === 'string') data.hiddenWords = cleanText(b.hiddenWords, 500);
  if (b.quietStart === null || TIME_RE.test(b.quietStart || '')) data.quietStart = b.quietStart || null;
  if (b.quietEnd === null || TIME_RE.test(b.quietEnd || '')) data.quietEnd = b.quietEnd || null;
  const p = await prisma.rcProfile.update({ where: { memberId: v.id }, data });
  // Akun dijadikan publik: semua permintaan ikuti otomatis diterima
  if (data.isPrivate === false) {
    const reqs = await prisma.rcFollowRequest.findMany({ where: { targetId: v.id } });
    for (const r of reqs) {
      await prisma.follow.upsert({ where: { followerId_followingId: { followerId: r.requesterId, followingId: v.id } }, update: {}, create: { followerId: r.requesterId, followingId: v.id } });
    }
    await prisma.rcFollowRequest.deleteMany({ where: { targetId: v.id } });
  }
  return { settings: { isPrivate: p.isPrivate, dmPolicy: p.dmPolicy, showActivity: p.showActivity, hiddenWords: p.hiddenWords, quietStart: p.quietStart, quietEnd: p.quietEnd } };
});

/** Profil @username (hanya anggota yang login; Ruang Cerita bukan halaman publik). */
export const profile = handle(async (req) => {
  const v = await requireViewer(req);
  const u = await findUserByUsername(req.params.username);
  if (!u) fail(404, 'Akun tidak ditemukan.');
  const rel = await relationTo(v.id, u.id);
  if (rel.blocked && !rel.blockedByMe) fail(404, 'Akun tidak ditemukan.');
  const [full, c, highlights, mutual] = await Promise.all([
    prisma.member.findUnique({ where: { id: u.id }, select: { bio: true, joinYear: true, orgMember: { select: ORG_TITLE_SELECT }, status: true, name: true, className: true } }),
    counts(u.id),
    rel.canSee ? prisma.rcHighlight.findMany({ where: { ownerId: u.id }, orderBy: { order: 'asc' }, select: { id: true, title: true, coverUrl: true, _count: { select: { items: true } } } }) : [],
    rel.self ? [] : prisma.follow.findMany({
      where: { followingId: u.id, follower: { followers: { some: { followerId: v.id } } } },
      take: 3, select: { follower: { select: PUBLIC_MEMBER } }
    })
  ]);
  const p = await ensureProfile(u.id);
  const activeStory = rel.canSee ? await prisma.rcStory.count({ where: { authorId: u.id, removedAt: null, expiresAt: { gt: new Date() } } }) : 0;
  return {
    user: shapeUser(u),
    bio: full.bio || '',
    title: memberTitle(full),
    joinYear: full.joinYear,
    counts: c,
    isPrivate: p.isPrivate,
    hasStory: activeStory > 0,
    lastSeenAt: p.showActivity && rel.following ? p.lastSeenAt : null,
    relation: rel,
    highlights: highlights.map((h) => ({ id: h.id, title: h.title, cover: h.coverUrl, count: h._count.items })),
    mutualFollowers: mutual.map((m) => shapeUser(m.follower))
  };
});

/** Ikuti: akun publik langsung diikuti, akun privat mengirim permintaan. */
export const follow = handle(async (req) => {
  const v = await requireViewer(req);
  const u = await findUserByUsername(req.params.username);
  if (!u || u.id === v.id) fail(404, 'Akun tidak ditemukan.');
  const rel = await relationTo(v.id, u.id);
  if (rel.blocked) fail(403, 'Tidak bisa mengikuti akun ini.');
  if (rel.following) return { relation: rel };
  if (rel.isPrivate) {
    await prisma.rcFollowRequest.upsert({ where: { requesterId_targetId: { requesterId: v.id, targetId: u.id } }, update: {}, create: { requesterId: v.id, targetId: u.id } });
    await notify(u.id, v.id, 'FOLLOW_REQUEST');
  } else {
    await prisma.follow.upsert({ where: { followerId_followingId: { followerId: v.id, followingId: u.id } }, update: {}, create: { followerId: v.id, followingId: u.id } });
    await notify(u.id, v.id, 'FOLLOW');
  }
  return { relation: await relationTo(v.id, u.id), counts: await counts(u.id) };
});

export const unfollow = handle(async (req) => {
  const v = await requireViewer(req);
  const u = await findUserByUsername(req.params.username);
  if (!u) fail(404, 'Akun tidak ditemukan.');
  await prisma.$transaction([
    prisma.follow.deleteMany({ where: { followerId: v.id, followingId: u.id } }),
    prisma.rcFollowRequest.deleteMany({ where: { requesterId: v.id, targetId: u.id } }),
    prisma.memberRelation.deleteMany({ where: { ownerId: v.id, targetId: u.id, type: 'CLOSE_FRIEND' } })
  ]);
  return { relation: await relationTo(v.id, u.id), counts: await counts(u.id) };
});

/** Hapus pengikut (pengikut tidak diberi tahu). */
export const removeFollower = handle(async (req) => {
  const v = await requireViewer(req);
  const u = await findUserByUsername(req.params.username);
  if (!u) fail(404, 'Akun tidak ditemukan.');
  await prisma.follow.deleteMany({ where: { followerId: u.id, followingId: v.id } });
  return { ok: true };
});

export const followRequests = handle(async (req) => {
  const v = await requireViewer(req);
  const rows = await prisma.rcFollowRequest.findMany({ where: { targetId: v.id }, orderBy: { createdAt: 'desc' }, take: 100, include: { requester: { select: PUBLIC_MEMBER } } });
  return { items: rows.map((r) => ({ id: r.id, user: shapeUser(r.requester), at: r.createdAt })) };
});

export const answerRequest = handle(async (req) => {
  const v = await requireViewer(req);
  const r = await prisma.rcFollowRequest.findUnique({ where: { id: req.params.id } });
  if (!r || r.targetId !== v.id) fail(404, 'Permintaan tidak ditemukan.');
  await prisma.rcFollowRequest.delete({ where: { id: r.id } });
  if (req.body?.accept) {
    await prisma.follow.upsert({ where: { followerId_followingId: { followerId: r.requesterId, followingId: v.id } }, update: {}, create: { followerId: r.requesterId, followingId: v.id } });
    await notify(r.requesterId, v.id, 'FOLLOW_ACCEPT');
  }
  return { ok: true };
});

/** Daftar pengikut / mengikuti (hanya bila boleh melihat isi akun). */
export const connections = handle(async (req) => {
  const v = await requireViewer(req);
  const u = await findUserByUsername(req.params.username);
  if (!u) fail(404, 'Akun tidak ditemukan.');
  const rel = await relationTo(v.id, u.id);
  if (!rel.canSee) fail(403, 'Akun ini privat.');
  const kind = req.params.kind === 'following' ? 'following' : 'followers';
  const q = String(req.query.q || '').trim().toLowerCase();
  const [rows, mine, blocked] = await Promise.all([
    prisma.follow.findMany({
      where: kind === 'followers' ? { followingId: u.id } : { followerId: u.id },
      orderBy: { createdAt: 'desc' },
      take: 300,
      select: kind === 'followers' ? { follower: { select: PUBLIC_MEMBER } } : { following: { select: PUBLIC_MEMBER } }
    }),
    followingIds(v.id),
    blockedIds(v.id)
  ]);
  const items = rows.map((r) => r.follower || r.following)
    .filter((m) => m && !blocked.has(m.id))
    .filter((m) => !q || m.name.toLowerCase().includes(q) || (m.slug || '').includes(q))
    .map((m) => ({ ...shapeUser(m), following: mine.has(m.id), self: m.id === v.id }));
  return { items };
});

/** Cari akun: nama atau username, abaikan huruf besar/kecil. */
export const search = handle(async (req) => {
  const v = await requireViewer(req);
  const q = String(req.query.q || '').trim().replace(/^@/, '');
  if (q.length < 1) return { items: [] };
  const [rows, blocked, mine] = await Promise.all([
    prisma.member.findMany({
      where: { slug: { not: null }, OR: [{ name: { contains: q } }, { slug: { contains: q.toLowerCase() } }] },
      take: 25,
      select: PUBLIC_MEMBER
    }),
    blockedIds(v.id),
    followingIds(v.id)
  ]);
  const lower = q.toLowerCase();
  return {
    items: rows.filter((m) => !blocked.has(m.id))
      .sort((a, b) => (a.slug.startsWith(lower) ? -1 : 0) - (b.slug.startsWith(lower) ? -1 : 0) || (mine.has(b.id) - mine.has(a.id)))
      .map((m) => ({ ...shapeUser(m), following: mine.has(m.id), self: m.id === v.id, className: m.className }))
  };
});

/**
 * Saran akun: teman dari teman, lalu teman sekelas, lalu angkatan yang sama.
 * (Pertemanan di sekolah paling kuat di lingkaran kelas & angkatan.)
 */
export const suggestions = handle(async (req) => {
  const v = await requireViewer(req);
  const [mine, blocked, meRow] = await Promise.all([
    followingIds(v.id),
    blockedIds(v.id),
    prisma.member.findUnique({ where: { id: v.id }, select: { className: true, joinYear: true } })
  ]);
  const exclude = new Set([...mine, ...blocked, v.id]);
  const score = new Map();
  const reason = new Map();
  if (mine.size) {
    const fof = await prisma.follow.findMany({ where: { followerId: { in: [...mine] } }, select: { followingId: true } });
    for (const r of fof) if (!exclude.has(r.followingId)) { score.set(r.followingId, (score.get(r.followingId) || 0) + 3); reason.set(r.followingId, 'Diikuti temanmu'); }
  }
  const peers = await prisma.member.findMany({
    where: { slug: { not: null }, status: 'ACTIVE', OR: [{ className: meRow.className }, { joinYear: meRow.joinYear }] },
    select: { id: true, className: true }, take: 200
  });
  for (const p of peers) {
    if (exclude.has(p.id)) continue;
    const same = p.className === meRow.className;
    score.set(p.id, (score.get(p.id) || 0) + (same ? 2 : 1));
    if (!reason.has(p.id)) reason.set(p.id, same ? `Teman sekelas ${meRow.className}` : `Angkatan ${meRow.joinYear}`);
  }
  // Pengurus inti selalu layak disarankan (akun pertama yang diikuti anggota baru)
  if (score.size < 12) {
    const inti = await prisma.orgMember.findMany({ where: { isCurrent: true, role: { in: ['KETUA', 'WAKIL', 'PEMBINA'] }, memberId: { not: null } }, select: { memberId: true, jabatan: true } });
    for (const o of inti) if (!exclude.has(o.memberId) && !score.has(o.memberId)) { score.set(o.memberId, 1); reason.set(o.memberId, o.jabatan); }
  }
  const ids = [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24).map(([id]) => id);
  const users = await prisma.member.findMany({ where: { id: { in: ids }, slug: { not: null } }, select: PUBLIC_MEMBER });
  const byId = new Map(users.map((u) => [u.id, u]));
  return { items: ids.map((id) => byId.get(id)).filter(Boolean).map((u) => ({ ...shapeUser(u), reason: reason.get(u.id) })) };
});

/** Teman dekat: daftar milik saya (hanya bisa dilihat sendiri). */
export const closeFriends = handle(async (req) => {
  const v = await requireViewer(req);
  const rows = await prisma.memberRelation.findMany({ where: { ownerId: v.id, type: 'CLOSE_FRIEND' }, include: { target: { select: PUBLIC_MEMBER } } });
  return { items: rows.map((r) => shapeUser(r.target)) };
});

/** Bisukan / batasi / teman dekat / blokir. */
export const setRelation = handle(async (req) => {
  const v = await requireViewer(req);
  const u = await findUserByUsername(req.params.username);
  if (!u || u.id === v.id) fail(404, 'Akun tidak ditemukan.');
  const type = String(req.body?.type || '');
  const on = req.body?.on !== false;
  if (type === 'restrict') {
    if (on) await prisma.rcRestrict.upsert({ where: { ownerId_targetId: { ownerId: v.id, targetId: u.id } }, update: {}, create: { ownerId: v.id, targetId: u.id } });
    else await prisma.rcRestrict.deleteMany({ where: { ownerId: v.id, targetId: u.id } });
    return { relation: await relationTo(v.id, u.id) };
  }
  const map = { mute: 'MUTE', block: 'BLOCK', 'close-friend': 'CLOSE_FRIEND' };
  const t = map[type];
  if (!t) fail(400, 'Jenis tidak dikenal.');
  if (!on) {
    await prisma.memberRelation.deleteMany({ where: { ownerId: v.id, targetId: u.id, type: t } });
  } else {
    if (t === 'CLOSE_FRIEND' && !(await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: u.id, followingId: v.id } } }))) {
      fail(400, 'Hanya pengikutmu yang bisa ditambahkan ke teman dekat.');
    }
    await prisma.memberRelation.upsert({ where: { ownerId_targetId_type: { ownerId: v.id, targetId: u.id, type: t } }, update: {}, create: { ownerId: v.id, targetId: u.id, type: t } });
    if (t === 'BLOCK') {
      await prisma.$transaction([
        prisma.follow.deleteMany({ where: { OR: [{ followerId: v.id, followingId: u.id }, { followerId: u.id, followingId: v.id }] } }),
        prisma.rcFollowRequest.deleteMany({ where: { OR: [{ requesterId: v.id, targetId: u.id }, { requesterId: u.id, targetId: v.id }] } }),
        prisma.memberRelation.deleteMany({ where: { OR: [{ ownerId: v.id, targetId: u.id, type: 'CLOSE_FRIEND' }, { ownerId: u.id, targetId: v.id, type: 'CLOSE_FRIEND' }] } })
      ]);
    }
  }
  return { relation: await relationTo(v.id, u.id) };
});

/** Akun yang saya blokir / bisukan / batasi (halaman Pengaturan). */
export const myRelations = handle(async (req) => {
  const v = await requireViewer(req, { allowFrozen: true });
  const [rels, restricts] = await Promise.all([
    prisma.memberRelation.findMany({ where: { ownerId: v.id, type: { in: ['BLOCK', 'MUTE'] } }, include: { target: { select: PUBLIC_MEMBER } } }),
    prisma.rcRestrict.findMany({ where: { ownerId: v.id }, include: { target: { select: PUBLIC_MEMBER } } })
  ]);
  return {
    blocked: rels.filter((r) => r.type === 'BLOCK').map((r) => shapeUser(r.target)),
    muted: rels.filter((r) => r.type === 'MUTE').map((r) => shapeUser(r.target)),
    restricted: restricts.map((r) => shapeUser(r.target))
  };
});
