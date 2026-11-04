import bcrypt from 'bcryptjs';
import ExcelJS from 'exceljs';
import prisma from '../config/db.js';
import { wibDate, wibTime, wibWeekday, fromWib, isValidDate } from '../utils/wib.js';
import { ensureMemberIdentity } from '../utils/slug.js';
import { signAbsenToken, getAbsenAccount } from '../middlewares/authAbsen.js';
import { memberTitle, ORG_TITLE_SELECT, alumniLabel } from '../utils/memberUtils.js';
import { getDesign, sanitizeCardConfig } from '../utils/designConfig.js';
import { buildRosterWorkbook, parseRosterSheet, planRosterImport, applyRosterImport } from '../utils/idcardExcel.js';
import { OrgError } from '../utils/orgSync.js';
import { SITE_URL } from '../config/site.js';

const ACTIONS = ['IN', 'OUT', 'SAKIT', 'IZIN', 'ALFA'];
// PERTEMUAN = rutin mingguan, WAJIB = kegiatan wajib bertanggal, TAMBAHAN = dibuat manual.
// Alfa otomatis berlaku untuk PERTEMUAN dan WAJIB; TAMBAHAN diisi manual.
const SESSION_TYPES = ['PERTEMUAN', 'WAJIB', 'TAMBAHAN'];
export const isMandatory = (type) => type === 'PERTEMUAN' || type === 'WAJIB';
// Mode Cepat: scan kedua dalam rentang ini dianggap dobel (kartu masih di depan kamera), bukan absen keluar
const QUICK_GUARD_MS = 60 * 1000;
const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
const DEFAULTS = { wajibDay: 5, wajibTime: '15:00', wajibTitle: 'Pertemuan Rutin' }; // Jum'at 15.00

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Isi kode yang di-scan:
 * - barcode batang depan : "PIKR_0001-26"                       -> { memberCode }
 * - QR belakang          : "https://pikr-manseku.my.id/@slug"   -> { slug }
 */
export function parseScanCode(code) {
  const raw = String(code || '').trim();
  if (!raw) return null;
  const mc = raw.toUpperCase().match(/^PIKR_(\d{1,6})-(\d{2})$/);
  if (mc) return { memberCode: `PIKR_${mc[1].padStart(4, '0')}-${mc[2]}` };
  const at = raw.lastIndexOf('/@');
  const slug = (at >= 0 ? raw.slice(at + 2) : raw.replace(/^@/, ''))
    .split(/[?#/]/)[0]
    .toLowerCase();
  return /^[a-z0-9-]{1,80}$/.test(slug) ? { slug } : null;
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Daftar kegiatan wajib bertanggal, terurut tanggal. */
function parseWajibDates(raw) {
  try {
    const list = JSON.parse(raw || '[]');
    if (!Array.isArray(list)) return [];
    return list
      .filter((k) => isValidDate(k?.date) && String(k.title || '').trim())
      .map((k) => ({
        date: k.date,
        title: String(k.title).trim().slice(0, 100),
        time: TIME_RE.test(k.time || '') ? k.time : null,
        description: String(k.description || '').trim().slice(0, 1000) || null
      }))
      .sort((x, y) => x.date.localeCompare(y.date));
  } catch {
    return [];
  }
}

/**
 * Pengaturan absensi:
 *  - Pertemuan rutin (mingguan): wajibDay / wajibTime / wajibTitle
 *  - Kegiatan wajib bertanggal (boleh lebih dari satu): kegiatanWajib [{ date, title, time, description }]
 */
export async function getAbsenSettings() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ['absen_wajib_day', 'absen_wajib_time', 'absen_wajib_title', 'absen_wajib_dates'] } }
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const day = Number(map.absen_wajib_day);
  return {
    wajibDay: Number.isInteger(day) && day >= 0 && day <= 6 ? day : DEFAULTS.wajibDay,
    wajibTime: TIME_RE.test(map.absen_wajib_time || '') ? map.absen_wajib_time : DEFAULTS.wajibTime,
    wajibTitle: map.absen_wajib_title || DEFAULTS.wajibTitle,
    kegiatanWajib: parseWajibDates(map.absen_wajib_dates)
  };
}

const memberSelect = {
  id: true,
  name: true,
  memberCode: true,
  slug: true,
  className: true,
  photoPath: true,
  status: true,
  orgMember: { select: ORG_TITLE_SELECT }
};

function shapeMember(m) {
  return {
    id: m.id,
    name: m.name,
    memberCode: m.memberCode,
    slug: m.slug,
    className: m.className,
    photoPath: m.photoPath,
    jabatan: memberTitle(m)
  };
}

function shapeRecord(r) {
  if (!r) return null;
  return {
    id: r.id,
    status: r.status,
    checkIn: wibTime(r.checkIn),
    checkOut: wibTime(r.checkOut),
    note: r.note,
    createdBy: r.createdBy,
    updatedBy: r.updatedBy
  };
}

function shapeSession(s) {
  if (!s) return null;
  return {
    id: s.id,
    date: s.date,
    type: s.type,
    title: s.title,
    description: s.description,
    startTime: s.startTime,
    openedBy: s.openedBy
  };
}

/**
 * Sesi untuk tanggal tertentu.
 *  1. Tanggal terdaftar sebagai Kegiatan Wajib -> dibuat otomatis (WAJIB).
 *  2. Hari pertemuan rutin (default Jum'at)     -> dibuat otomatis (PERTEMUAN).
 *  3. Selain itu null -> aplikasi menampilkan popup "Kegiatan Baru" (TAMBAHAN).
 */
async function resolveSession(date, officerName, { create = true } = {}) {
  const existing = await prisma.attendanceSession.findUnique({ where: { date } });
  if (existing || !create) return existing;
  const settings = await getAbsenSettings();
  const wajib = settings.kegiatanWajib.find((k) => k.date === date);
  if (wajib) {
    return prisma.attendanceSession.upsert({
      where: { date },
      update: {},
      create: { date, type: 'WAJIB', title: wajib.title, description: wajib.description, startTime: wajib.time, openedBy: officerName }
    });
  }
  if (wibWeekday(date) !== settings.wajibDay) return null;
  return prisma.attendanceSession.upsert({
    where: { date },
    update: {},
    create: { date, type: 'PERTEMUAN', title: settings.wajibTitle, startTime: settings.wajibTime, openedBy: officerName }
  });
}

// Aksi yang disarankan saat kartu di-scan
function suggestAction(record) {
  if (!record || record.status !== 'HADIR' || !record.checkIn) return 'IN';
  return record.checkOut ? 'DONE' : 'OUT';
}

// ─── Auth ───────────────────────────────────────────────────────────────────

// POST /api/absen/login { username, password }
// Akun bersama absensi (pikrmanseku01), atau akun admin website.
export async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi' });
  }

  try {
    const account = await getAbsenAccount();
    if (username === account.username && (await bcrypt.compare(password, account.passwordHash))) {
      const token = signAbsenToken({ id: account.username, kind: 'shared' });
      return res.json({ token, officer: { name: account.username, kind: 'shared' } });
    }

    const admin = await prisma.admin.findUnique({ where: { username } });
    if (admin && (await bcrypt.compare(password, admin.password))) {
      const token = signAbsenToken({ id: admin.id, kind: 'admin' });
      return res.json({ token, officer: { name: admin.username, kind: 'admin' } });
    }

    return res.status(401).json({ message: 'Username atau password salah' });
  } catch (error) {
    console.error('Error absen login:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
}

// GET /api/absen/me
export async function getMe(req, res) {
  return res.json(req.officer);
}

// PUT /api/absen/account { currentPassword, newPassword }
export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (req.officer.kind !== 'shared') {
    return res.status(400).json({ message: 'Ganti password admin website dari dashboard admin' });
  }
  if (!newPassword || String(newPassword).length < 8) {
    return res.status(400).json({ message: 'Password baru minimal 8 karakter' });
  }
  try {
    const account = await getAbsenAccount();
    if (!(await bcrypt.compare(String(currentPassword || ''), account.passwordHash))) {
      return res.status(401).json({ message: 'Password lama salah' });
    }
    await prisma.setting.update({
      where: { key: 'absen_password_hash' },
      data: { value: await bcrypt.hash(String(newPassword), 10) }
    });
    return res.json({ message: 'Password berhasil diganti' });
  } catch (error) {
    console.error('Error absen changePassword:', error);
    return res.status(500).json({ message: 'Gagal mengganti password' });
  }
}

// ─── Sesi kegiatan ──────────────────────────────────────────────────────────

// GET /api/absen/session/today
// { date, weekday, session | null, isWajibDay, settings }
export async function getTodaySession(req, res) {
  try {
    const date = wibDate();
    const settings = await getAbsenSettings();
    const session = await resolveSession(date, req.officer.name);
    return res.json({
      date,
      weekday: DAY_NAMES[wibWeekday(date)],
      isWajibDay: wibWeekday(date) === settings.wajibDay || settings.kegiatanWajib.some((k) => k.date === date),
      session: shapeSession(session),
      settings: { ...settings, wajibDayName: DAY_NAMES[settings.wajibDay] }
    });
  } catch (error) {
    console.error('Error absen getTodaySession:', error);
    return res.status(500).json({ message: 'Gagal mengambil sesi hari ini' });
  }
}

// POST /api/absen/sessions { title, description?, date? }  — kegiatan TAMBAHAN di luar hari wajib
export async function createSession(req, res) {
  const title = String(req.body.title || '').trim().slice(0, 100);
  const description = String(req.body.description || '').trim().slice(0, 1000) || null;
  const date = req.body.date || wibDate();
  if (!title) return res.status(400).json({ message: 'Judul kegiatan wajib diisi' });
  if (!isValidDate(date) || date > wibDate()) {
    return res.status(400).json({ message: 'Tanggal tidak valid atau di masa depan' });
  }

  try {
    const existing = await prisma.attendanceSession.findUnique({ where: { date } });
    if (existing) {
      return res.status(409).json({ message: 'Sudah ada kegiatan di tanggal ini', session: shapeSession(existing) });
    }
    const settings = await getAbsenSettings();
    const declared = settings.kegiatanWajib.find((k) => k.date === date);
    const type = declared ? 'WAJIB' : (wibWeekday(date) === settings.wajibDay ? 'PERTEMUAN' : 'TAMBAHAN');
    const session = await prisma.attendanceSession.create({
      data: {
        date, type, title, description,
        startTime: type === 'PERTEMUAN' ? settings.wajibTime : (declared?.time ?? null),
        openedBy: req.officer.name
      }
    });
    return res.status(201).json(shapeSession(session));
  } catch (error) {
    console.error('Error absen createSession:', error);
    return res.status(500).json({ message: 'Gagal membuat kegiatan' });
  }
}

// PATCH /api/absen/sessions/:id { title?, description?, type? }
export async function updateSession(req, res) {
  const data = {};
  if (req.body.title !== undefined) {
    data.title = String(req.body.title).trim().slice(0, 100);
    if (!data.title) return res.status(400).json({ message: 'Judul kegiatan wajib diisi' });
  }
  if (req.body.description !== undefined) {
    data.description = String(req.body.description || '').trim().slice(0, 1000) || null;
  }
  if (req.body.type !== undefined) {
    if (!SESSION_TYPES.includes(req.body.type)) return res.status(400).json({ message: 'Jenis harus PERTEMUAN, WAJIB atau TAMBAHAN' });
    data.type = req.body.type;
  }
  try {
    const s = await prisma.attendanceSession.update({ where: { id: req.params.id }, data });
    return res.json(shapeSession(s));
  } catch (error) {
    return res.status(404).json({ message: 'Kegiatan tidak ditemukan' });
  }
}

// GET /api/absen/sessions?limit=30
export async function listSessions(req, res) {
  const limit = Math.min(Number(req.query.limit) || 30, 200);
  try {
    const sessions = await prisma.attendanceSession.findMany({
      orderBy: { date: 'desc' },
      take: limit,
      include: { records: { select: { status: true } } }
    });
    return res.json(sessions.map(s => {
      const counts = { HADIR: 0, SAKIT: 0, IZIN: 0, ALFA: 0 };
      s.records.forEach(r => counts[r.status]++);
      return { ...shapeSession(s), counts };
    }));
  } catch (error) {
    console.error('Error absen listSessions:', error);
    return res.status(500).json({ message: 'Gagal mengambil daftar kegiatan' });
  }
}

// ─── Anggota & Scan ─────────────────────────────────────────────────────────

// GET /api/absen/members?date=YYYY-MM-DD
// Anggota aktif + status absen di tanggal itu, dikelompokkan per huruf awal
export async function listMembers(req, res) {
  const date = isValidDate(req.query.date) ? req.query.date : wibDate();
  try {
    await ensureMemberIdentity();
    const [members, session] = await Promise.all([
      prisma.member.findMany({ where: { status: 'ACTIVE' }, orderBy: { name: 'asc' }, select: memberSelect }),
      prisma.attendanceSession.findUnique({ where: { date }, include: { records: true } })
    ]);
    const recordByMember = new Map((session?.records || []).map(r => [r.memberId, r]));

    const groups = {};
    for (const m of members) {
      const letter = (m.name.trim()[0] || '#').toUpperCase();
      const key = /[A-Z]/.test(letter) ? letter : '#';
      (groups[key] ||= []).push({ ...shapeMember(m), record: shapeRecord(recordByMember.get(m.id)) });
    }
    return res.json({ date, session: shapeSession(session), total: members.length, groups });
  } catch (error) {
    console.error('Error absen listMembers:', error);
    return res.status(500).json({ message: 'Gagal mengambil daftar anggota' });
  }
}

// POST /api/absen/scan { code }
// Scan 1 -> IN, scan 2 -> OUT, scan 3+ -> DONE (tampilkan data, koreksi lewat Edit Waktu)
export async function scanCard(req, res) {
  const where = parseScanCode(req.body.code);
  if (!where) return res.status(400).json({ message: 'Kode tidak dikenali' });

  try {
    const member = await prisma.member.findUnique({ where, select: memberSelect });
    if (!member) return res.status(404).json({ message: 'Anggota tidak ditemukan' });
    if (member.status !== 'ACTIVE') {
      return res.status(409).json({ message: `${member.name} bukan anggota aktif (${member.status})` });
    }

    const date = wibDate();
    const session = await resolveSession(date, req.officer.name);
    const record = session
      ? await prisma.attendance.findUnique({ where: { sessionId_memberId: { sessionId: session.id, memberId: member.id } } })
      : null;

    const base = {
      date,
      now: wibTime(new Date()),
      session: shapeSession(session),
      member: shapeMember(member),
      record: shapeRecord(record),
      suggested: suggestAction(record)
    };

    // Mode Cepat: scan langsung dicatat (masuk / keluar) tanpa popup konfirmasi
    if (req.body.quick) {
      if (!session) return res.status(409).json({ code: 'NO_SESSION', message: 'Belum ada kegiatan hari ini. Buat kegiatan baru dulu.' });
      const action = suggestAction(record);
      if (action === 'DONE') return res.json({ ...base, quick: { result: 'DONE', checkIn: base.record.checkIn, checkOut: base.record.checkOut } });
      const now = new Date();
      // Kartu yang masih di depan kamera / terscan dua kali tidak boleh langsung dianggap absen keluar
      if (action === 'OUT' && now - record.checkIn < QUICK_GUARD_MS) {
        return res.json({ ...base, quick: { result: 'DUPLICATE', time: wibTime(record.checkIn) } });
      }
      const by = req.officer.name;
      const previous = action === 'IN' && record ? record.status : null; // Sakit/Izin/Alfa yang tergantikan
      let saved;
      try {
        if (action === 'IN') {
          saved = record
            ? await prisma.attendance.update({ where: { id: record.id }, data: { status: 'HADIR', checkIn: now, checkOut: null, note: null, updatedBy: by } })
            : await prisma.attendance.create({ data: { status: 'HADIR', checkIn: now, sessionId: session.id, memberId: member.id, createdBy: by } });
        } else {
          saved = await prisma.attendance.update({ where: { id: record.id }, data: { checkOut: now, updatedBy: by } });
        }
      } catch (e) {
        // Dua scan nyaris bersamaan membuat baris yang sama: yang kedua dianggap dobel
        if (e.code === 'P2002') return res.json({ ...base, quick: { result: 'DUPLICATE', time: wibTime(now) } });
        throw e;
      }
      await prisma.attendanceLog.create({ data: { attendanceId: saved.id, action, detail: wibTime(now), by } });
      return res.json({ ...base, record: shapeRecord(saved), quick: { result: action, time: wibTime(now), previous } });
    }

    return res.json(base);
  } catch (error) {
    console.error('Error absen scanCard:', error);
    return res.status(500).json({ message: 'Gagal memproses scan' });
  }
}

// POST /api/absen/records { memberId, action, time?, note?, date?, clientId? }
// action: IN | OUT | SAKIT | IZIN | ALFA. time 'HH:mm' (WIB), default jam sekarang.
export async function recordAttendance(req, res) {
  const { memberId, action, note, clientId } = req.body;
  const date = req.body.date || wibDate();
  const by = req.officer.name;

  if (!memberId || !ACTIONS.includes(action)) {
    return res.status(400).json({ message: 'memberId dan action (IN/OUT/SAKIT/IZIN/ALFA) wajib diisi' });
  }
  if (!isValidDate(date) || date > wibDate()) {
    return res.status(400).json({ message: 'Tanggal tidak valid atau di masa depan' });
  }
  const at = req.body.time ? fromWib(date, req.body.time) : new Date();
  if (!at) return res.status(400).json({ message: 'Format jam harus HH:mm' });
  if (at > new Date(Date.now() + 60 * 1000)) {
    return res.status(400).json({ message: 'Jam tidak boleh di masa depan' });
  }
  const cleanNote = typeof note === 'string' && note.trim() ? note.trim().slice(0, 500) : null;

  try {
    // Kirim ulang dari antrean offline: kembalikan hasil yang sama, jangan dobel
    if (clientId) {
      const dup = await prisma.attendance.findUnique({ where: { clientId: String(clientId) } });
      if (dup) return res.json({ message: 'Sudah tercatat', record: shapeRecord(dup), duplicate: true });
    }

    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member || member.status !== 'ACTIVE') {
      return res.status(404).json({ message: 'Anggota aktif tidak ditemukan' });
    }

    const session = await resolveSession(date, by);
    if (!session) {
      return res.status(409).json({ code: 'NO_SESSION', message: 'Belum ada kegiatan di tanggal ini. Buat kegiatan baru dulu.' });
    }
    const existing = await prisma.attendance.findUnique({
      where: { sessionId_memberId: { sessionId: session.id, memberId } }
    });

    let data;
    if (action === 'IN') {
      if (existing?.status === 'HADIR' && existing.checkOut && at >= existing.checkOut) {
        return res.status(400).json({ message: 'Jam masuk harus sebelum jam keluar' });
      }
      data = { status: 'HADIR', checkIn: at, checkOut: existing?.status === 'HADIR' ? existing.checkOut : null };
    } else if (action === 'OUT') {
      if (!existing || existing.status !== 'HADIR' || !existing.checkIn) {
        return res.status(400).json({ message: `${member.name} belum absen masuk` });
      }
      if (at <= existing.checkIn) {
        return res.status(400).json({ message: 'Jam keluar harus setelah jam masuk' });
      }
      data = { checkOut: at };
    } else {
      // SAKIT / IZIN / ALFA menggantikan status hadir di hari yang sama
      data = { status: action, checkIn: null, checkOut: null };
    }
    if (action !== 'OUT') data.note = cleanNote;

    const detail = action === 'IN' || action === 'OUT' ? wibTime(at) : cleanNote;
    const record = existing
      ? await prisma.attendance.update({
          where: { id: existing.id },
          data: { ...data, updatedBy: by, ...(clientId && !existing.clientId ? { clientId: String(clientId) } : {}) }
        })
      : await prisma.attendance.create({
          data: { ...data, sessionId: session.id, memberId, createdBy: by, clientId: clientId ? String(clientId) : null }
        });
    await prisma.attendanceLog.create({ data: { attendanceId: record.id, action, detail, by } });

    return res.json({ message: 'Absensi tersimpan', record: shapeRecord(record) });
  } catch (error) {
    console.error('Error absen recordAttendance:', error);
    return res.status(500).json({ message: 'Gagal menyimpan absensi' });
  }
}

// PATCH /api/absen/records/:id { checkIn?, checkOut? }  — 'HH:mm', atau checkOut null untuk menghapus jam keluar
export async function editRecordTime(req, res) {
  try {
    const record = await prisma.attendance.findUnique({ where: { id: req.params.id }, include: { session: true } });
    if (!record) return res.status(404).json({ message: 'Data absensi tidak ditemukan' });
    if (record.status !== 'HADIR') {
      return res.status(400).json({ message: 'Jam hanya bisa diedit untuk status HADIR' });
    }

    const date = record.session.date;
    let checkIn = record.checkIn;
    let checkOut = record.checkOut;
    if (req.body.checkIn !== undefined) {
      checkIn = fromWib(date, req.body.checkIn);
      if (!checkIn) return res.status(400).json({ message: 'Format jam masuk harus HH:mm' });
    }
    if (req.body.checkOut !== undefined) {
      checkOut = req.body.checkOut === null ? null : fromWib(date, req.body.checkOut);
      if (req.body.checkOut !== null && !checkOut) {
        return res.status(400).json({ message: 'Format jam keluar harus HH:mm' });
      }
    }
    if (checkOut && checkIn && checkOut <= checkIn) {
      return res.status(400).json({ message: 'Jam keluar harus setelah jam masuk' });
    }

    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: { checkIn, checkOut, updatedBy: req.officer.name }
    });
    const fmt = d => wibTime(d) || '-';
    await prisma.attendanceLog.create({
      data: {
        attendanceId: record.id,
        action: 'EDIT',
        detail: `masuk ${fmt(record.checkIn)} -> ${fmt(checkIn)}, keluar ${fmt(record.checkOut)} -> ${fmt(checkOut)}`,
        by: req.officer.name
      }
    });
    return res.json({ message: 'Jam berhasil diubah', record: shapeRecord(updated) });
  } catch (error) {
    console.error('Error absen editRecordTime:', error);
    return res.status(500).json({ message: 'Gagal mengubah jam' });
  }
}

// GET /api/absen/records/:id/logs
export async function getRecordLogs(req, res) {
  const logs = await prisma.attendanceLog.findMany({
    where: { attendanceId: req.params.id },
    orderBy: { createdAt: 'asc' }
  });
  return res.json(logs.map(l => ({ ...l, at: `${wibDate(l.createdAt)} ${wibTime(l.createdAt)}` })));
}

// ─── History & Rekap ────────────────────────────────────────────────────────

/**
 * Rekap untuk rentang tanggal.
 * Kegiatan WAJIB  : anggota aktif yang tidak tercatat = ALFA otomatis
 *                   (kecuali akunnya dibuat setelah tanggal kegiatan).
 * Kegiatan TAMBAHAN: yang tidak tercatat dibiarkan kosong; Alfa diisi manual.
 */
async function buildRecap(from, to) {
  // Kegiatan wajib bertanggal yang sudah lewat selalu punya sesi (supaya yang tidak hadir terhitung Alfa
  // walau tidak ada petugas yang membuka aplikasi di hari itu).
  const { kegiatanWajib } = await getAbsenSettings();
  const today = wibDate();
  for (const k of kegiatanWajib) {
    if (k.date >= from && k.date <= to && k.date <= today) await resolveSession(k.date, 'sistem');
  }
  const sessions = await prisma.attendanceSession.findMany({
    where: { date: { gte: from, lte: to } },
    orderBy: { date: 'asc' },
    include: { records: true }
  });
  const recordedIds = new Set(sessions.flatMap(s => s.records.map(r => r.memberId)));
  const members = await prisma.member.findMany({
    where: { OR: [{ status: 'ACTIVE' }, { id: { in: [...recordedIds] } }] },
    orderBy: { name: 'asc' },
    select: { ...memberSelect, createdAt: true }
  });

  const rows = members.map(m => {
    const joined = wibDate(m.createdAt);
    const counts = { HADIR: 0, SAKIT: 0, IZIN: 0, ALFA: 0 };
    const days = sessions.map(s => {
      const r = s.records.find(x => x.memberId === m.id);
      if (r) {
        counts[r.status]++;
        return { date: s.date, ...shapeRecord(r) };
      }
      if (!isMandatory(s.type) || m.status !== 'ACTIVE' || joined > s.date) return { date: s.date, status: null };
      counts.ALFA++;
      return { date: s.date, status: 'ALFA', auto: true };
    });
    return { ...shapeMember(m), counts, days };
  });

  return { from, to, sessions: sessions.map(shapeSession), rows };
}

function parseRange(query) {
  const today = wibDate();
  const from = isValidDate(query.from) ? query.from : today;
  const to = isValidDate(query.to) ? query.to : from;
  return from <= to ? { from, to } : { from: to, to: from };
}

// GET /api/absen/recap?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function getRecap(req, res) {
  try {
    const { from, to } = parseRange(req.query);
    return res.json(await buildRecap(from, to));
  } catch (error) {
    console.error('Error absen getRecap:', error);
    return res.status(500).json({ message: 'Gagal mengambil rekap' });
  }
}

// GET /api/absen/recap/excel?from=&to=
export async function exportRecapExcel(req, res) {
  try {
    const { from, to } = parseRange(req.query);
    const recap = await buildRecap(from, to);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'PIK-R MANSEKU';
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } };
    const fontHeader = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    const thin = { style: 'thin', color: { argb: 'FFD9D9D9' } };
    const border = { top: thin, left: thin, bottom: thin, right: thin };
    const statusFill = { HADIR: 'FFDCFCE7', SAKIT: 'FFFEF3C7', IZIN: 'FFDBEAFE', ALFA: 'FFFEE2E2' };

    // Sheet 1: Ringkasan per anggota
    const ws = wb.addWorksheet('Rekap Kehadiran');
    ws.addRow(['REKAP KEHADIRAN PIK-R MANSEKU']).font = { size: 16, bold: true, color: { argb: 'FFC2410C' } };
    ws.addRow([`Periode: ${from} s/d ${to}  •  ${recap.sessions.length} kegiatan`]);
    ws.addRow([]);
    const hr = ws.addRow(['No', 'ID Anggota', 'Nama', 'Kelas', 'Jabatan', 'Hadir', 'Sakit', 'Izin', 'Alfa', '% Hadir']);
    hr.eachCell(c => { c.fill = headerFill; c.font = fontHeader; c.border = border; c.alignment = { horizontal: 'center' }; });
    recap.rows.forEach((r, i) => {
      const total = r.counts.HADIR + r.counts.SAKIT + r.counts.IZIN + r.counts.ALFA;
      const row = ws.addRow([
        i + 1, r.memberCode, r.name, r.className, r.jabatan,
        r.counts.HADIR, r.counts.SAKIT, r.counts.IZIN, r.counts.ALFA,
        total ? r.counts.HADIR / total : 0
      ]);
      row.eachCell(c => { c.border = border; });
      row.getCell(10).numFmt = '0%';
    });
    ws.columns = [6, 12, 34, 12, 22, 8, 8, 8, 8, 10].map(width => ({ width }));
    ws.views = [{ state: 'frozen', ySplit: 4 }];

    // Sheet 2: Detail per kegiatan (satu kolom per sesi)
    const wd = wb.addWorksheet('Detail Kegiatan');
    const dh = wd.addRow(['No', 'Nama', 'Kelas', ...recap.sessions.map(s => `${s.date} (${s.type})\n${s.title}`)]);
    dh.height = 34;
    dh.eachCell(c => {
      c.fill = headerFill; c.font = fontHeader; c.border = border;
      c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });
    recap.rows.forEach((r, i) => {
      const cells = r.days.map(d => {
        if (!d.status) return '-';
        if (d.status === 'HADIR') return `${d.checkIn || '?'} - ${d.checkOut || '?'}`;
        return d.note ? `${d.status} (${d.note})` : d.status;
      });
      const row = wd.addRow([i + 1, r.name, r.className, ...cells]);
      row.eachCell((c, col) => {
        c.border = border;
        const day = r.days[col - 4];
        if (day?.status) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusFill[day.status] } };
      });
    });
    wd.columns = [6, 34, 12, ...recap.sessions.map(() => 20)].map(width => ({ width }));
    wd.views = [{ state: 'frozen', xSplit: 3, ySplit: 1 }];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Rekap_Absensi_PIKR_${from}_${to}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error absen exportRecapExcel:', error);
    if (!res.headersSent) res.status(500).json({ message: 'Gagal membuat file Excel' });
  }
}

// ─── Dashboard admin ────────────────────────────────────────────────────────

// GET /api/absen/overview — ringkasan untuk halaman Absensi di dashboard
export async function getOverview(req, res) {
  try {
    const today = wibDate();
    const from = shiftDays(today, -90);
    const recap = await buildRecap(from, today);
    const totals = { HADIR: 0, SAKIT: 0, IZIN: 0, ALFA: 0 };
    recap.rows.forEach(r => Object.keys(totals).forEach(k => { totals[k] += r.counts[k]; }));
    const filled = totals.HADIR + totals.SAKIT + totals.IZIN + totals.ALFA;

    const last = recap.sessions.at(-1) || null;
    let lastSummary = null;
    if (last) {
      const idx = recap.sessions.length - 1;
      const c = { HADIR: 0, SAKIT: 0, IZIN: 0, ALFA: 0, KOSONG: 0 };
      recap.rows.forEach(r => { const s = r.days[idx]?.status; c[s || 'KOSONG']++; });
      lastSummary = { ...last, counts: c };
    }

    const topAlfa = recap.rows
      .filter(r => r.counts.ALFA > 0)
      .sort((a, b) => b.counts.ALFA - a.counts.ALFA)
      .slice(0, 8)
      .map(r => ({ id: r.id, name: r.name, className: r.className, photoPath: r.photoPath, alfa: r.counts.ALFA, hadir: r.counts.HADIR }));

    return res.json({
      range: { from, to: today },
      sessionCount: recap.sessions.length,
      wajibCount: recap.sessions.filter(s => isMandatory(s.type)).length,
      activeMembers: await prisma.member.count({ where: { status: 'ACTIVE' } }),
      attendanceRate: filled ? totals.HADIR / filled : null,
      totals,
      last: lastSummary,
      topAlfa
    });
  } catch (error) {
    console.error('Error absen getOverview:', error);
    return res.status(500).json({ message: 'Gagal mengambil ringkasan absensi' });
  }
}

function shiftDays(date, days) {
  const d = new Date(`${date}T12:00:00+07:00`);
  d.setUTCDate(d.getUTCDate() + days);
  return wibDate(d);
}

// DELETE /api/absen/sessions/:id — hapus kegiatan yang salah dibuat (beserta absennya)
export async function deleteSession(req, res) {
  try {
    const s = await prisma.attendanceSession.findUnique({ where: { id: req.params.id }, include: { _count: { select: { records: true } } } });
    if (!s) return res.status(404).json({ message: 'Kegiatan tidak ditemukan' });
    await prisma.attendanceSession.delete({ where: { id: s.id } });
    return res.json({ message: `Kegiatan ${s.date} "${s.title}" dihapus beserta ${s._count.records} data absen` });
  } catch (error) {
    console.error('Error absen deleteSession:', error);
    return res.status(500).json({ message: 'Gagal menghapus kegiatan' });
  }
}

// DELETE /api/absen/records/:id — hapus 1 data absen (kembali ke "belum diisi" / Alfa otomatis)
// DELETE /api/absen/records/:id — mengosongkan absen anggota di kegiatan itu (kembali ke "belum diisi")
export async function deleteRecord(req, res) {
  try {
    const gone = await prisma.attendance.delete({ where: { id: req.params.id }, include: { session: { select: { date: true } }, member: { select: { name: true } } } });
    console.log(`[Absen] absen dikosongkan: ${gone.member.name} ${gone.session.date} (${gone.status}) oleh ${req.officer.name}`);
    return res.json({ message: 'Absen dikosongkan' });
  } catch (error) {
    return res.status(404).json({ message: 'Data absen tidak ditemukan' });
  }
}

// GET /api/absen/members/:id/history?from=&to= — riwayat kehadiran 1 anggota
export async function getMemberHistory(req, res) {
  try {
    const member = await prisma.member.findUnique({ where: { id: req.params.id }, select: { ...memberSelect, createdAt: true } });
    if (!member) return res.status(404).json({ message: 'Anggota tidak ditemukan' });
    const today = wibDate();
    const from = isValidDate(req.query.from) ? req.query.from : shiftDays(today, -365);
    const to = isValidDate(req.query.to) ? req.query.to : today;
    const recap = await buildRecap(from, to);
    const row = recap.rows.find(r => r.id === member.id);
    const days = (row?.days || []).map((d, i) => ({ ...d, session: recap.sessions[i] })).reverse();
    return res.json({
      member: shapeMember(member),
      counts: row?.counts || { HADIR: 0, SAKIT: 0, IZIN: 0, ALFA: 0 },
      days: days.filter(d => d.status)
    });
  } catch (error) {
    console.error('Error absen getMemberHistory:', error);
    return res.status(500).json({ message: 'Gagal mengambil riwayat kehadiran' });
  }
}

// PUT /api/absen/account/reset { newPassword } — admin mereset password akun bersama (tanpa password lama)
export async function resetSharedPassword(req, res) {
  const { newPassword } = req.body;
  if (!newPassword || String(newPassword).length < 8) {
    return res.status(400).json({ message: 'Password baru minimal 8 karakter' });
  }
  try {
    const account = await getAbsenAccount();
    await prisma.setting.update({
      where: { key: 'absen_password_hash' },
      data: { value: await bcrypt.hash(String(newPassword), 10) }
    });
    return res.json({ message: `Password akun ${account.username} berhasil direset` });
  } catch (error) {
    console.error('Error absen resetSharedPassword:', error);
    return res.status(500).json({ message: 'Gagal mereset password' });
  }
}

// GET /api/absen/idcards — kode barcode & link QR semua anggota aktif (tab ID Card di dashboard)
export async function listIdCards(req, res) {
  try {
    await ensureMemberIdentity();
    const base = SITE_URL;
    const members = await prisma.member.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, className: true, photoPath: true, memberCode: true, slug: true }
    });
    // Yang sudah berkode di atas (urut kode), yang belum di bawah (A-Z)
    members.sort((x, y) => (!!y.memberCode - !!x.memberCode) || (x.memberCode || '').localeCompare(y.memberCode || '') || x.name.trim().localeCompare(y.name.trim(), 'id'));
    return res.json(members.map(m => ({ ...m, name: m.name.trim(), url: `${base}/@${m.slug}` })));
  } catch (error) {
    console.error('Error absen listIdCards:', error);
    return res.status(500).json({ message: 'Gagal mengambil data ID Card' });
  }
}

// ─── Pengaturan ─────────────────────────────────────────────────────────────

// GET /api/absen/settings
export async function getSettings(req, res) {
  const s = await getAbsenSettings();
  const account = await getAbsenAccount();
  return res.json({ ...s, wajibDayName: DAY_NAMES[s.wajibDay], username: account.username, defaults: DEFAULTS });
}

// PUT /api/absen/settings { wajibDay?, wajibTime?, wajibTitle? }
export async function updateSettings(req, res) {
  const { wajibDay, wajibTime, wajibTitle, kegiatanWajib } = req.body;
  const writes = [];
  const put = (key, value) => writes.push(prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } }));

  if (wajibDay !== undefined) {
    const n = Number(wajibDay);
    if (!Number.isInteger(n) || n < 0 || n > 6) return res.status(400).json({ message: 'Hari wajib tidak valid (0=Minggu..6=Sabtu)' });
    put('absen_wajib_day', String(n));
  }
  if (wajibTime !== undefined) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(wajibTime))) return res.status(400).json({ message: 'Format jam harus HH:mm' });
    put('absen_wajib_time', String(wajibTime));
  }
  if (wajibTitle !== undefined) {
    const t = String(wajibTitle).trim().slice(0, 100);
    if (!t) return res.status(400).json({ message: 'Judul kegiatan wajib tidak boleh kosong' });
    put('absen_wajib_title', t);
  }

  if (kegiatanWajib !== undefined) {
    if (!Array.isArray(kegiatanWajib) || kegiatanWajib.length > 100) return res.status(400).json({ message: 'Daftar kegiatan wajib tidak valid' });
    for (const k of kegiatanWajib) {
      if (!isValidDate(k?.date)) return res.status(400).json({ message: 'Tanggal kegiatan wajib tidak valid' });
      if (!String(k?.title || '').trim()) return res.status(400).json({ message: `Judul kegiatan wajib ${k.date} tidak boleh kosong` });
      if (k.time && !TIME_RE.test(k.time)) return res.status(400).json({ message: 'Format jam harus HH:mm' });
    }
    const dates = kegiatanWajib.map((k) => k.date);
    if (new Set(dates).size !== dates.length) return res.status(400).json({ message: 'Ada tanggal kegiatan wajib yang dobel' });
    put('absen_wajib_dates', JSON.stringify(kegiatanWajib));
  }

  try {
    await prisma.$transaction(writes);
    return getSettings(req, res);
  } catch (error) {
    console.error('Error absen updateSettings:', error);
    return res.status(500).json({ message: 'Gagal menyimpan pengaturan' });
  }
}

// ─── Daftar ID Card (Excel) ─────────────────────────────────────────────────

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// GET /api/absen/idcards/export — daftar Excel: yang sudah berkode di atas, yang belum di bawahnya
export async function exportIdCardRoster(req, res) {
  try {
    const wb = await buildRosterWorkbook();
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader('Content-Disposition', `attachment; filename="Daftar_ID_Card_PIKR_${wibDate()}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error absen exportIdCardRoster:', error);
    if (!res.headersSent) res.status(500).json({ message: 'Gagal membuat file Excel' });
  }
}

// POST /api/absen/idcards/import?dryRun=1 (multipart, field "file")
// Mengisi kode ID Card dari kolom "Kode ID Card". Kode kosong = tidak diubah.
export async function importIdCardRoster(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Pilih file Excel (.xlsx) dulu' });
    const { plan, errors, skipped } = await planRosterImport(await parseRosterSheet(req.file.buffer));
    const dryRun = req.query.dryRun === '1' || req.query.dryRun === 'true';
    const changed = plan.filter((p) => p.changed);
    if (dryRun) {
      return res.json({ dryRun: true, changed: changed.length, same: plan.length - changed.length, skipped, errors, detail: changed });
    }
    // Baris bermasalah tidak menggagalkan baris lain; hanya yang valid disimpan
    const saved = await applyRosterImport(plan);
    return res.json({ dryRun: false, saved, skipped, errors });
  } catch (error) {
    if (error instanceof OrgError) return res.status(400).json({ message: error.message });
    console.error('Error absen importIdCardRoster:', error);
    return res.status(500).json({ message: 'Gagal mengimpor daftar ID Card' });
  }
}

// DELETE /api/absen/idcards/codes { confirm: 'HAPUS' } — kosongkan semua kode ID Card (mulai dari awal)
export async function resetIdCardCodes(req, res) {
  if (req.body?.confirm !== 'HAPUS') return res.status(400).json({ message: 'Ketik HAPUS untuk mengonfirmasi' });
  try {
    const r = await prisma.member.updateMany({ where: { memberCode: { not: null } }, data: { memberCode: null } });
    return res.json({ message: `${r.count} kode ID Card dikosongkan`, count: r.count });
  } catch (error) {
    console.error('Error absen resetIdCardCodes:', error);
    return res.status(500).json({ message: 'Gagal mengosongkan kode ID Card' });
  }
}

// ─── Profil publik /@slug ───────────────────────────────────────────────────

// GET /api/public/profile/:slug — biodata publik (tujuan QR di belakang ID Card).
// Sengaja TIDAK mengirim NISN, nomor WA, email, atau password.
export async function getPublicProfile(req, res) {
  const where = parseScanCode(req.params.slug);
  if (!where?.slug) return res.status(404).json({ message: 'Profil tidak ditemukan' });
  try {
    const m = await prisma.member.findUnique({
      where: { slug: where.slug },
      select: {
        name: true, className: true, photoPath: true, status: true, gender: true,
        asalSekolah: true, joinYear: true, bio: true, memberCode: true, cardConfig: true,
        orgMember: { select: { ...ORG_TITLE_SELECT, quote: true } }
      }
    });
    if (!m) return res.status(404).json({ message: 'Profil tidak ditemukan' });
    const org = m.orgMember;
    const asal = (m.asalSekolah || '').trim();
    const design = await getDesign();
    let card = {};
    try { card = sanitizeCardConfig(m.cardConfig ? JSON.parse(m.cardConfig) : {}); } catch { /* kartu rusak: pakai bawaan */ }
    return res.json({
      name: m.name.trim(),
      className: m.className,
      photoPath: m.photoPath,
      gender: m.gender,
      status: m.status,
      joinYear: m.joinYear,
      memberCode: m.memberCode,
      asalSekolah: asal && asal !== '-' ? asal : null,
      jabatan: memberTitle(m),
      isAlumni: m.status === 'ALUMNI',
      alumniLabel: alumniLabel(org),
      // Bio pribadi diutamakan, kalau kosong pakai quote dari struktur organisasi
      bio: m.bio || org?.quote || null,
      // Alumni hanya menampilkan label di atas; anggota aktif tidak punya riwayat jabatan yang ditampilkan
      jabatanHistory: null,
      card,
      cardDesign: design.card
    });
  } catch (error) {
    console.error('Error getPublicProfile:', error);
    return res.status(500).json({ message: 'Gagal mengambil profil' });
  }
}
