/**
 * Ruang Cerita — Bilik Konseling Sebaya.
 *
 * Berbeda dari Pesan (DM):
 * - Siswa membuka SESI dengan topik; boleh anonim (konselor hanya melihat nama samaran).
 * - Sesi masuk antrean; konselor sebaya yang bertugas mengambilnya. Hanya siswa & konselor itu yang bisa membaca.
 * - Kata-kata darurat (menyakiti diri, kekerasan) menandai sesi MENDESAK: siswa langsung diberi nomor layanan
 *   resmi, konselor & admin melihat tanda merah, dan sesi bisa diteruskan ke pembina/guru BK.
 * - Identitas asli sesi anonim TIDAK pernah dikirim ke konselor; hanya admin (pembina) yang bisa membukanya
 *   saat sesi diteruskan karena keadaan darurat. Hal ini dijelaskan terbuka kepada siswa.
 * - Isi pesan dienkripsi saat disimpan (rc/crypto.js).
 */
import crypto from 'crypto';
import prisma from '../config/db.js';
import { handle, fail, requireViewer, shapeUser, PUBLIC_MEMBER, cleanText, pushTo, notify } from './core.js';
import { seal, open } from './crypto.js';

export const TOPICS = {
  PERTEMANAN: 'Pertemanan',
  KELUARGA: 'Keluarga',
  BELAJAR: 'Belajar & sekolah',
  PERASAAN: 'Perasaan & emosi',
  KESEHATAN_REPRODUKSI: 'Kesehatan reproduksi',
  PERUNDUNGAN: 'Perundungan',
  LAINNYA: 'Lainnya'
};

/** Layanan bantuan resmi (diperiksa dari situs resmi masing-masing). */
export const HELPLINES = [
  { name: 'SEJIWA (Kemenkes)', detail: 'Layanan psikologi gratis — telepon 119, lalu tekan 8', tel: '119' },
  { name: 'SAPA 129 (KemenPPPA)', detail: 'Kekerasan terhadap anak & perempuan — telepon 129 atau WhatsApp 08111-129-129', tel: '129', wa: '628111129129' },
  { name: 'Darurat', detail: 'Bila nyawa terancam: telepon 112 atau datang ke IGD terdekat', tel: '112' }
];

// Frasa yang menandakan bahaya. Sengaja luas: lebih baik konselor waspada daripada terlewat.
const URGENT = [
  'bunuh diri', 'ingin mati', 'pengen mati', 'mau mati', 'pengin mati', 'akhiri hidup', 'mengakhiri hidup', 'gak mau hidup', 'tidak mau hidup',
  'ga mau hidup', 'nggak mau hidup', 'lebih baik mati', 'menyakiti diri', 'nyakitin diri', 'self harm', 'selfharm', 'sayat', 'menyayat',
  'silet tangan', 'loncat dari', 'gantung diri', 'minum racun', 'overdosis', 'dipukul', 'dipukuli', 'disiksa', 'dilecehkan', 'pelecehan',
  'diperkosa', 'diancam', 'dipaksa berhubungan', 'kekerasan seksual'
];
export const isUrgent = (text) => { const t = String(text).toLowerCase(); return URGENT.some((w) => t.includes(w)); };

const ADJ = ['Bintang', 'Awan', 'Pelangi', 'Embun', 'Senja', 'Fajar', 'Ombak', 'Bulan', 'Daun', 'Angin'];
const NOUN = ['Biru', 'Jingga', 'Tenang', 'Hangat', 'Pagi', 'Teduh', 'Cerah', 'Lembut', 'Sejuk', 'Ceria'];
const makeAlias = () => `${ADJ[crypto.randomInt(ADJ.length)]} ${NOUN[crypto.randomInt(NOUN.length)]} #${crypto.randomInt(100, 999)}`;

async function isCounselor(memberId) {
  return !!(await prisma.rcCounselor.findFirst({ where: { memberId, active: true }, select: { memberId: true } }));
}

/** Konselor yang bertugas hari ini (WIB). */
async function onDuty() {
  const day = new Date(Date.now() + 7 * 3600 * 1000).getUTCDay();
  const rows = await prisma.rcCounselor.findMany({ where: { active: true }, include: { member: { select: PUBLIC_MEMBER } } });
  return rows.filter((r) => r.days.split(',').map(Number).includes(day));
}

function shapeSession(s, viewerId) {
  const asStudent = s.studentId === viewerId;
  return {
    id: s.id,
    topic: s.topic,
    topicLabel: TOPICS[s.topic] || 'Lainnya',
    status: s.status,
    urgent: s.urgent,
    anonymous: s.anonymous,
    rating: s.rating,
    // Konselor melihat nama samaran bila anonim; siswa selalu melihat dirinya sendiri
    student: asStudent ? { self: true } : (s.anonymous ? { alias: s.alias } : { ...shapeUser(s.student), alias: s.alias }),
    counselor: s.counselor ? shapeUser(s.counselor) : null,
    role: asStudent ? 'STUDENT' : 'COUNSELOR',
    lastAt: s.lastAt,
    createdAt: s.createdAt,
    closedAt: s.closedAt
  };
}

const sessionInclude = { student: { select: PUBLIC_MEMBER }, counselor: { select: PUBLIC_MEMBER } };

/** Halaman Bilik Konseling: info, konselor bertugas, sesi milik saya, dan (untuk konselor) antrean. */
export const overview = handle(async (req) => {
  const v = await requireViewer(req);
  const [duty, mine, counselor] = await Promise.all([
    onDuty(),
    prisma.rcCounselSession.findMany({ where: { studentId: v.id }, orderBy: { lastAt: 'desc' }, take: 20, include: sessionInclude }),
    isCounselor(v.id)
  ]);
  let queue = [];
  let handling = [];
  if (counselor) {
    [queue, handling] = await Promise.all([
      prisma.rcCounselSession.findMany({ where: { status: 'WAITING', studentId: { not: v.id } }, orderBy: [{ urgent: 'desc' }, { createdAt: 'asc' }], take: 50, include: sessionInclude }),
      prisma.rcCounselSession.findMany({ where: { counselorId: v.id, status: 'ACTIVE' }, orderBy: { lastAt: 'desc' }, take: 50, include: sessionInclude })
    ]);
  }
  return {
    topics: TOPICS,
    helplines: HELPLINES,
    onDuty: duty.map((d) => ({ ...shapeUser(d.member), bio: d.bio })),
    mine: mine.map((s) => shapeSession(s, v.id)),
    isCounselor: counselor,
    queue: queue.map((s) => shapeSession(s, v.id)),
    handling: handling.map((s) => shapeSession(s, v.id))
  };
});

/** Siswa membuka sesi baru (maks. 1 sesi terbuka sekaligus). */
export const open_ = handle(async (req) => {
  const v = await requireViewer(req);
  const text = cleanText(req.body?.text, 2000);
  if (text.length < 3) fail(400, 'Ceritakan sedikit apa yang ingin kamu bicarakan.');
  const topic = TOPICS[req.body?.topic] ? req.body.topic : 'LAINNYA';
  const existing = await prisma.rcCounselSession.findFirst({ where: { studentId: v.id, status: { in: ['WAITING', 'ACTIVE'] } } });
  if (existing) fail(409, 'Kamu masih punya sesi yang terbuka. Lanjutkan di sesi itu, ya.');
  const urgent = isUrgent(text);
  const s = await prisma.rcCounselSession.create({
    data: {
      studentId: v.id,
      alias: makeAlias(),
      anonymous: req.body?.anonymous !== false,
      topic,
      urgent,
      messages: {
        create: [
          { fromRole: 'STUDENT', senderId: v.id, text: seal(text) },
          { fromRole: 'SYSTEM', text: seal(urgent
            ? 'Terima kasih sudah berani bercerita. Kamu tidak sendirian. Konselor akan segera membalas. Bila kamu merasa tidak aman sekarang, hubungi layanan bantuan di atas atau temui guru BK.'
            : 'Terima kasih sudah bercerita. Pesanmu sudah masuk antrean dan akan dibalas konselor sebaya yang bertugas.') }
        ]
      }
    },
    include: sessionInclude
  });
  // Beri tahu konselor bertugas (tanpa isi pesan & tanpa identitas)
  for (const c of await onDuty()) {
    pushTo(c.memberId, 'counsel', { type: 'NEW', urgent });
    await notify(c.memberId, null, 'COUNSEL', { text: urgent ? 'Sesi MENDESAK menunggu di antrean' : 'Sesi baru menunggu di antrean' });
  }
  return { session: shapeSession(s, v.id), helplines: urgent ? HELPLINES : undefined };
});

async function sessionFor(viewerId, id) {
  const s = await prisma.rcCounselSession.findUnique({ where: { id }, include: sessionInclude });
  if (!s) fail(404, 'Sesi tidak ditemukan.');
  const asStudent = s.studentId === viewerId;
  const asCounselor = s.counselorId === viewerId;
  // Konselor lain boleh melihat ringkasan sesi MENUNGGU (untuk mengambil), tapi tidak isinya
  if (!asStudent && !asCounselor) fail(404, 'Sesi tidak ditemukan.');
  return s;
}

export const session = handle(async (req) => {
  const v = await requireViewer(req);
  const s = await sessionFor(v.id, req.params.id);
  const msgs = await prisma.rcCounselMessage.findMany({ where: { sessionId: s.id }, orderBy: { createdAt: 'asc' }, take: 500 });
  return {
    session: shapeSession(s, v.id),
    helplines: HELPLINES,
    items: msgs.map((m) => ({
      id: m.id,
      fromRole: m.fromRole,
      mine: m.senderId === v.id,
      text: open(m.text),
      createdAt: m.createdAt
    }))
  };
});

export const send = handle(async (req) => {
  const v = await requireViewer(req);
  const s = await sessionFor(v.id, req.params.id);
  if (s.status === 'CLOSED') fail(409, 'Sesi ini sudah selesai. Buka sesi baru bila ingin bercerita lagi.');
  const asStudent = s.studentId === v.id;
  const text = cleanText(req.body?.text, 2000);
  if (!text) fail(400, 'Pesan kosong.');
  const urgentNow = asStudent && !s.urgent && isUrgent(text);
  const m = await prisma.rcCounselMessage.create({ data: { sessionId: s.id, fromRole: asStudent ? 'STUDENT' : 'COUNSELOR', senderId: v.id, text: seal(text) } });
  await prisma.rcCounselSession.update({ where: { id: s.id }, data: { lastAt: m.createdAt, ...(urgentNow ? { urgent: true } : {}) } });
  const other = asStudent ? s.counselorId : s.studentId;
  if (other) pushTo(other, 'counsel', { type: 'MESSAGE', sessionId: s.id });
  if (urgentNow) for (const c of await onDuty()) pushTo(c.memberId, 'counsel', { type: 'URGENT', sessionId: s.id });
  return { message: { id: m.id, fromRole: m.fromRole, mine: true, text, createdAt: m.createdAt }, helplines: urgentNow ? HELPLINES : undefined };
});

/** Konselor mengambil sesi dari antrean. */
export const claim = handle(async (req) => {
  const v = await requireViewer(req);
  if (!(await isCounselor(v.id))) fail(403, 'Hanya konselor sebaya yang bertugas.');
  const s = await prisma.rcCounselSession.findUnique({ where: { id: req.params.id } });
  if (!s || s.status !== 'WAITING') fail(409, 'Sesi ini sudah diambil konselor lain.');
  if (s.studentId === v.id) fail(400, 'Tidak bisa menangani sesimu sendiri.');
  const r = await prisma.rcCounselSession.updateMany({ where: { id: s.id, status: 'WAITING' }, data: { status: 'ACTIVE', counselorId: v.id } });
  if (!r.count) fail(409, 'Sesi ini sudah diambil konselor lain.');
  await prisma.rcCounselMessage.create({ data: { sessionId: s.id, fromRole: 'SYSTEM', text: seal('Konselor sebaya sudah bergabung. Silakan lanjutkan ceritamu.') } });
  pushTo(s.studentId, 'counsel', { type: 'CLAIMED', sessionId: s.id });
  return { ok: true };
});

/** Selesaikan sesi (siswa atau konselor). Siswa bisa memberi penilaian 1–5. */
export const close = handle(async (req) => {
  const v = await requireViewer(req);
  const s = await sessionFor(v.id, req.params.id);
  const rating = s.studentId === v.id && Number.isInteger(req.body?.rating) && req.body.rating >= 1 && req.body.rating <= 5 ? req.body.rating : undefined;
  await prisma.rcCounselSession.update({ where: { id: s.id }, data: { status: 'CLOSED', closedAt: new Date(), ...(rating ? { rating } : {}) } });
  await prisma.rcCounselMessage.create({ data: { sessionId: s.id, fromRole: 'SYSTEM', text: seal('Sesi diselesaikan. Terima kasih sudah bercerita — kamu boleh membuka sesi baru kapan saja.') } });
  const other = s.studentId === v.id ? s.counselorId : s.studentId;
  if (other) pushTo(other, 'counsel', { type: 'CLOSED', sessionId: s.id });
  return { ok: true };
});

/** Konselor meneruskan sesi ke pembina/guru BK (admin dashboard). Identitas hanya terlihat oleh admin. */
export const escalate = handle(async (req) => {
  const v = await requireViewer(req);
  const s = await sessionFor(v.id, req.params.id);
  if (s.counselorId !== v.id) fail(403, 'Hanya konselor sesi ini.');
  await prisma.rcCounselSession.update({ where: { id: s.id }, data: { escalatedAt: new Date(), urgent: true } });
  await prisma.rcCounselMessage.create({ data: { sessionId: s.id, fromRole: 'SYSTEM', text: seal('Konselor meminta pendampingan pembina PIK-R / guru BK untuk membantumu lebih jauh.') } });
  return { ok: true };
});

// ─── Admin dashboard ────────────────────────────────────────────────────────
/** Ringkasan untuk dashboard (tanpa isi pesan kecuali sesi yang diteruskan). */
export async function adminOverview() {
  const [counselors, waiting, active, urgent, escalated, closed30] = await Promise.all([
    prisma.rcCounselor.findMany({ include: { member: { select: PUBLIC_MEMBER } }, orderBy: { createdAt: 'asc' } }),
    prisma.rcCounselSession.count({ where: { status: 'WAITING' } }),
    prisma.rcCounselSession.count({ where: { status: 'ACTIVE' } }),
    prisma.rcCounselSession.count({ where: { urgent: true, status: { not: 'CLOSED' } } }),
    prisma.rcCounselSession.findMany({ where: { escalatedAt: { not: null } }, orderBy: { escalatedAt: 'desc' }, take: 50, include: sessionInclude }),
    prisma.rcCounselSession.count({ where: { status: 'CLOSED', closedAt: { gte: new Date(Date.now() - 30 * 864e5) } } })
  ]);
  return {
    counselors: counselors.map((c) => ({ ...shapeUser(c.member), days: c.days, active: c.active, bio: c.bio })),
    stats: { waiting, active, urgent, closed30 },
    escalated: escalated.map((s) => ({
      id: s.id, topic: TOPICS[s.topic], status: s.status, urgent: s.urgent, escalatedAt: s.escalatedAt,
      alias: s.alias, anonymous: s.anonymous,
      student: { ...shapeUser(s.student), className: s.student.className },
      counselor: s.counselor ? shapeUser(s.counselor) : null
    }))
  };
}

export async function adminSessionMessages(id) {
  const s = await prisma.rcCounselSession.findUnique({ where: { id } });
  if (!s || !s.escalatedAt) fail(403, 'Isi sesi hanya bisa dibuka setelah diteruskan oleh konselor.');
  const msgs = await prisma.rcCounselMessage.findMany({ where: { sessionId: id }, orderBy: { createdAt: 'asc' } });
  return msgs.map((m) => ({ fromRole: m.fromRole, text: open(m.text), createdAt: m.createdAt }));
}
