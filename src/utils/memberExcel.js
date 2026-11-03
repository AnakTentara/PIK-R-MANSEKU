/**
 * Ekspor / impor anggota lewat Excel.
 *
 * Ekspor : daftar anggota (sesuai filter) dengan kolom yang sama dengan templat impor,
 *          ditambah kolom bacaan-saja (ID Card, Jabatan, Status, Angkatan).
 * Impor  : tambah anggota baru ATAU perbarui yang sudah ada (dicocokkan lewat NISN).
 *          Selalu lewat pratinjau (dryRun) dulu; tidak ada data yang diubah sebelum dikonfirmasi.
 *
 * Aturan impor (semua jalur memakai formatPersonName + orgSync, jadi konsisten dengan form manual):
 *  - Nama dirapikan otomatis ("M.hAlo" -> "M. Halo").
 *  - NISN 10 digit wajib untuk anggota biasa. Pembina boleh tanpa NISN (diberi pengenal sementara).
 *  - Jabatan opsional; harus ada di katalog jabatan. Jabatan tunggal yang sudah dipegang orang lain
 *    dilaporkan sebagai "menggantikan" dan hanya dijalankan bila admin memilih mode penggantian.
 *  - Anggota ALUMNI tidak menerima jabatan aktif.
 */
import ExcelJS from 'exceljs';
import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { formatPersonName } from './nameUtils.js';
import { getCatalog, findPosition } from './orgCatalog.js';
import { assignPosition, clearPosition, OrgError } from './orgSync.js';
import { ensureMemberIdentity } from './slug.js';
import { compareKelas } from './sortUtils.js';

export const COLUMNS = [
  { key: 'nisn', header: 'NISN', width: 14, required: true },
  { key: 'name', header: 'Nama Lengkap', width: 32, required: true },
  { key: 'className', header: 'Kelas', width: 10, required: true },
  { key: 'gender', header: 'Jenis Kelamin', width: 14, required: true },
  { key: 'whatsappNumber', header: 'No. WhatsApp', width: 16, required: true },
  { key: 'email', header: 'Email', width: 28, required: true },
  { key: 'asalSekolah', header: 'Asal Sekolah', width: 24 },
  { key: 'joinYear', header: 'Angkatan', width: 10 },
  { key: 'jabatan', header: 'Jabatan', width: 28 },
  { key: 'status', header: 'Status', width: 10 },
  { key: 'bio', header: 'Bio', width: 40 }
];
const READ_ONLY = [
  { key: 'memberCode', header: 'Kode ID Card', width: 16 },
  { key: 'slug', header: 'Link Profil', width: 28 }
];

const ORANGE = 'FFF97316';
const thin = { style: 'thin', color: { argb: 'FFD9D9D9' } };
const border = { top: thin, left: thin, bottom: thin, right: thin };

const HEADER_ALIASES = {
  nisn: ['nisn'],
  name: ['nama lengkap', 'nama'],
  className: ['kelas'],
  gender: ['jenis kelamin', 'gender', 'jk'],
  whatsappNumber: ['no. whatsapp', 'no whatsapp', 'whatsapp', 'no. wa', 'no wa', 'hp', 'telepon'],
  email: ['email', 'e-mail'],
  asalSekolah: ['asal sekolah', 'sekolah asal'],
  joinYear: ['angkatan', 'tahun bergabung', 'tahun masuk'],
  jabatan: ['jabatan', 'jabatan kepengurusan'],
  status: ['status', 'status keanggotaan'],
  bio: ['bio', 'kata-kata', 'kata kata']
};

export const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

export function cellText(cell) {
  const v = cell?.value;
  if (v == null) return '';
  if (typeof v === 'object') {
    if (v.text) return String(v.text);
    if (v.result != null) return String(v.result);
    if (Array.isArray(v.richText)) return v.richText.map((r) => r.text).join('');
    if (v instanceof Date) return v.toISOString().slice(0, 10);
  }
  return String(v);
}

/** Kelas ditulis bebas ("x.1", "XI 3", "12-2") -> "X-1" / "XI-3" / "XII-2". */
export function normalizeKelas(raw) {
  const t = String(raw ?? '').trim().toUpperCase().replace(/\s+/g, '');
  const m = t.match(/^(XII|XI|X|12|11|10)[-._/]?(\d{1,2})$/);
  if (!m) return String(raw ?? '').trim();
  const level = { 10: 'X', 11: 'XI', 12: 'XII' }[m[1]] || m[1];
  return `${level}-${parseInt(m[2], 10)}`;
}

export function normalizeGender(raw) {
  const t = norm(raw);
  if (['l', 'lk', 'laki-laki', 'laki laki', 'pria', 'male', 'm'].includes(t)) return 'Laki-laki';
  if (['p', 'pr', 'perempuan', 'wanita', 'female', 'f'].includes(t)) return 'Perempuan';
  return '';
}

export function normalizePhone(raw) {
  const digits = String(raw ?? '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+62')) return '0' + digits.slice(3);
  if (digits.startsWith('62')) return '0' + digits.slice(2);
  if (digits && !digits.startsWith('0')) return '0' + digits;
  return digits;
}

// ─── Ekspor ─────────────────────────────────────────────────────────────────

export async function buildMembersWorkbook({ status } = {}) {
  await ensureMemberIdentity();
  const members = await prisma.member.findMany({
    where: status ? { status } : undefined,
    include: { orgMember: true }
  });
  members.sort((a, b) =>
    (a.status === b.status ? 0 : a.status === 'ACTIVE' ? -1 : 1) ||
    compareKelas(a.className, b.className) ||
    a.name.localeCompare(b.name, 'id'));

  const wb = new ExcelJS.Workbook();
  wb.creator = 'PIK-R MANSEKU';
  const ws = wb.addWorksheet('Anggota');
  const cols = [...COLUMNS, ...READ_ONLY];
  ws.columns = cols.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  const head = ws.getRow(1);
  head.height = 24;
  head.eachCell((cell, i) => {
    const readOnly = i > COLUMNS.length;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: readOnly ? 'FF9CA3AF' : ORANGE } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = border;
  });

  for (const m of members) {
    const org = m.orgMember;
    ws.addRow({
      nisn: m.nisn, name: m.name.trim(), className: m.className, gender: m.gender,
      whatsappNumber: m.whatsappNumber, email: m.email, asalSekolah: m.asalSekolah === '-' ? '' : m.asalSekolah,
      joinYear: m.joinYear, jabatan: org?.isCurrent && m.status === 'ACTIVE' ? org.jabatan : '',
      status: m.status === 'ACTIVE' ? 'AKTIF' : 'ALUMNI', bio: m.bio || '',
      memberCode: m.memberCode || '', slug: m.slug ? `/@${m.slug}` : ''
    });
  }
  ws.eachRow((row, n) => { if (n > 1) row.eachCell((c, i) => { c.border = border; if (i > COLUMNS.length) c.font = { color: { argb: 'FF6B7280' } }; }); });
  // NISN, nomor WA sebagai teks supaya angka 0 di depan tidak hilang
  ['nisn', 'whatsappNumber'].forEach((k) => { ws.getColumn(k).numFmt = '@'; });
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: 'A1', to: { row: 1, column: cols.length } };

  addGuideSheet(wb);
  return wb;
}

/** Templat kosong berisi 2 baris contoh. */
export async function buildTemplateWorkbook() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'PIK-R MANSEKU';
  const ws = wb.addWorksheet('Anggota');
  ws.columns = COLUMNS.map((c) => ({ header: c.header + (c.required ? ' *' : ''), key: c.key, width: c.width }));
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORANGE } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = border;
  });
  ws.addRow({ nisn: '0123456789', name: 'Contoh Nama Anggota', className: 'X-1', gender: 'Perempuan', whatsappNumber: '081234567890', email: 'contoh@gmail.com', asalSekolah: 'SMPN 1 Muara Enim', joinYear: new Date().getFullYear(), jabatan: '', status: 'AKTIF', bio: '' });
  ws.addRow({ nisn: '0123456790', name: 'm.contoh dua', className: 'XI-2', gender: 'L', whatsappNumber: '6281234567891', email: 'dua@gmail.com', joinYear: new Date().getFullYear(), jabatan: 'Anggota Humas', status: 'AKTIF' });
  ['nisn', 'whatsappNumber'].forEach((k) => { ws.getColumn(k).numFmt = '@'; });
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  addGuideSheet(wb);
  return wb;
}

function addGuideSheet(wb) {
  const g = wb.addWorksheet('Petunjuk');
  g.columns = [{ width: 24 }, { width: 90 }];
  const rows = [
    ['PETUNJUK IMPOR ANGGOTA', ''],
    ['', ''],
    ['Kolom wajib', 'NISN (10 digit), Nama Lengkap, Kelas, Jenis Kelamin, No. WhatsApp, Email'],
    ['Pencocokan', 'Baris dengan NISN yang sudah terdaftar akan MEMPERBARUI data anggota itu. NISN baru = anggota baru.'],
    ['Nama', 'Dirapikan otomatis: "M.hAlo" jadi "M. Halo", "HAIKAL MABRUR" jadi "Haikal Mabrur".'],
    ['Kelas', 'Boleh ditulis "x1", "X.1", "xi 3", "12-2". Disimpan sebagai X-1, XI-3, XII-2.'],
    ['Jenis Kelamin', 'Laki-laki / Perempuan (juga diterima: L, P, Pria, Wanita).'],
    ['No. WhatsApp', 'Diawali 0 atau 62; disimpan sebagai 08xxxxxxxxxx.'],
    ['Jabatan', 'Opsional, harus sama dengan jabatan di Struktur Organisasi (mis. "Ketua Humas", "Anggota MedInfo"). Kosongkan untuk anggota biasa.'],
    ['Status', 'AKTIF (bawaan) atau ALUMNI. Alumni tidak punya jabatan aktif.'],
    ['Kolom abu-abu', 'Kode ID Card dan Link Profil hanya untuk dibaca. Diabaikan saat impor.'],
    ['Sandi', 'Anggota baru otomatis mendapat sandi acak 6 digit (terlihat di halaman Anggota).']
  ];
  rows.forEach((r) => g.addRow(r));
  g.getRow(1).font = { bold: true, size: 14, color: { argb: 'FFC2410C' } };
  g.getColumn(1).font = { bold: true };
  g.eachRow((row) => row.eachCell((c) => { c.alignment = { vertical: 'top', wrapText: true }; }));
}

// ─── Baca & validasi ────────────────────────────────────────────────────────

/** Baca sheet pertama dan petakan kolom lewat judul (urutan kolom bebas). */
export async function parseMembersSheet(buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.getWorksheet('Anggota') || wb.worksheets[0];
  if (!ws) throw new OrgError('File Excel kosong');

  const colOf = {};
  ws.getRow(1).eachCell((cell, i) => {
    const h = norm(cellText(cell)).replace(/\s*\*$/, '');
    for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(h) && !colOf[key]) colOf[key] = i;
    }
  });
  const missing = COLUMNS.filter((c) => c.required && !colOf[c.key]).map((c) => c.header);
  if (missing.length) throw new OrgError(`Kolom wajib tidak ditemukan di baris judul: ${missing.join(', ')}`);

  const rows = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const get = (k) => (colOf[k] ? cellText(row.getCell(colOf[k])).trim() : '');
    const raw = Object.fromEntries(COLUMNS.map((c) => [c.key, get(c.key)]));
    if (Object.values(raw).every((v) => !v)) return; // baris kosong
    rows.push({ line: n, raw });
  });
  if (!rows.length) throw new OrgError('Tidak ada baris data di file Excel');
  if (rows.length > 500) throw new OrgError('Maksimal 500 baris per impor');
  return rows;
}

/**
 * Validasi + rencana per baris. Tidak menulis apa pun.
 * @returns {{ plan: Array, summary }}
 */
export async function planImport(rows) {
  const catalog = await getCatalog();
  const existing = await prisma.member.findMany({ select: { id: true, nisn: true, name: true, status: true, role: true, className: true } });
  const byNisn = new Map(existing.filter((m) => m.nisn).map((m) => [m.nisn, m]));
  const holders = await prisma.orgMember.findMany({ where: { isCurrent: true }, select: { jabatan: true, memberId: true, name: true } });
  const seen = new Map();
  const claimed = new Map(); // jabatan tunggal -> baris yang mengklaim (deteksi bentrok di dalam file)

  const plan = rows.map(({ line, raw }) => {
    const errors = [];
    const warnings = [];
    const nisn = raw.nisn.replace(/\D/g, '');
    const name = formatPersonName(raw.name);
    const className = normalizeKelas(raw.className);
    const gender = normalizeGender(raw.gender);
    const whatsappNumber = normalizePhone(raw.whatsappNumber);
    const email = raw.email.trim();
    const status = /alumni/i.test(raw.status) ? 'ALUMNI' : 'ACTIVE';
    const joinYear = raw.joinYear ? parseInt(raw.joinYear, 10) : null;
    const bio = raw.bio ? raw.bio.slice(0, 300) : null;
    const asalSekolah = raw.asalSekolah.trim() || null;
    const jabatan = raw.jabatan.trim();

    if (!/^\d{10}$/.test(nisn)) errors.push('NISN harus 10 digit angka');
    if (!name) errors.push('Nama kosong');
    if (!className) errors.push('Kelas kosong');
    else if (!/^(XII|XI|X)-\d{1,2}$/.test(className)) warnings.push(`Kelas "${className}" tidak umum`);
    if (!gender) errors.push('Jenis kelamin harus Laki-laki / Perempuan');
    if (!/^0\d{8,13}$/.test(whatsappNumber)) errors.push('No. WhatsApp tidak valid');
    if (!/^\S+@\S+\.\S+$/.test(email)) errors.push('Email tidak valid');
    if (joinYear !== null && (joinYear < 2000 || joinYear > 2100)) errors.push('Angkatan tidak valid');
    if (nisn && seen.has(nisn)) errors.push(`NISN dobel dengan baris ${seen.get(nisn)}`);
    if (nisn) seen.set(nisn, line);

    let position = null;
    let replaces = [];
    if (jabatan) {
      position = findPosition(jabatan, catalog);
      if (!position) errors.push(`Jabatan "${jabatan}" tidak ada di Struktur Organisasi`);
      else if (status === 'ALUMNI') warnings.push('Alumni tidak menerima jabatan aktif; jabatan diabaikan');
      else if (position.unique) {
        const target = byNisn.get(nisn);
        replaces = holders.filter((h) => h.jabatan === position.label && h.memberId !== target?.id).map((h) => h.name.trim());
        if (claimed.has(position.label)) errors.push(`Jabatan "${position.label}" juga diklaim baris ${claimed.get(position.label)}`);
        else claimed.set(position.label, line);
      }
    }

    const found = byNisn.get(nisn);
    return {
      line, action: errors.length ? 'ERROR' : found ? 'UPDATE' : 'CREATE',
      errors, warnings, replaces,
      existingName: found?.name?.trim() || null,
      data: { nisn, name, className, gender, whatsappNumber, email, asalSekolah, joinYear, status, bio },
      jabatan: position && status === 'ACTIVE' ? position.label : '',
      clearJabatan: false
    };
  });

  const count = (a) => plan.filter((p) => p.action === a).length;
  return { plan, summary: { total: plan.length, create: count('CREATE'), update: count('UPDATE'), error: count('ERROR'), replacing: plan.filter((p) => p.replaces.length).length } };
}

// ─── Terapkan ───────────────────────────────────────────────────────────────

/**
 * Jalankan rencana. Baris ERROR dilewati. Tiap baris diproses sendiri-sendiri
 * supaya satu baris bermasalah tidak membatalkan yang lain.
 * @param {'archive'|'remove'} displaceMode nasib pemegang lama jabatan tunggal
 */
export async function applyImport(plan, displaceMode = 'archive') {
  const result = { created: 0, updated: 0, skipped: 0, failed: [] };
  const year = new Date().getFullYear();

  for (const p of plan) {
    if (p.action === 'ERROR') { result.skipped++; continue; }
    const d = p.data;
    try {
      let member = await prisma.member.findUnique({ where: { nisn: d.nisn } });
      if (member) {
        member = await prisma.member.update({
          where: { id: member.id },
          data: {
            name: d.name, className: d.className, gender: d.gender, whatsappNumber: d.whatsappNumber, email: d.email,
            ...(d.asalSekolah ? { asalSekolah: d.asalSekolah } : {}),
            ...(d.joinYear ? { joinYear: d.joinYear } : {}),
            ...(d.bio !== null ? { bio: d.bio } : {}),
            status: d.status
          }
        });
        result.updated++;
      } else {
        const plain = String(Math.floor(100000 + Math.random() * 900000));
        member = await prisma.member.create({
          data: {
            nisn: d.nisn, name: d.name, className: d.className, gender: d.gender, whatsappNumber: d.whatsappNumber, email: d.email,
            asalSekolah: d.asalSekolah || '-', joinYear: d.joinYear || year, bio: d.bio, status: d.status,
            plainPassword: plain, password: await bcrypt.hash(plain, 10), role: 'member'
          }
        });
        result.created++;
      }
      if (d.status === 'ALUMNI') await clearPosition(member.id);
      else if (p.jabatan) await assignPosition(member.id, p.jabatan, { displaceMode });
      else if (p.clearJabatan) await clearPosition(member.id);
    } catch (e) {
      result.failed.push({ line: p.line, name: d.name, message: e instanceof OrgError ? e.message : 'Gagal menyimpan baris ini' });
    }
  }
  await ensureMemberIdentity();
  return result;
}
