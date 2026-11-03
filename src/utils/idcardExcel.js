/**
 * Daftar ID Card lewat Excel (Absensi -> ID Card).
 *
 * Ekspor : anggota aktif, yang SUDAH punya kode ID di atas (urut kode), yang BELUM di bawahnya (A-Z).
 *          Kolom: No, Kode ID Card, Nama Lengkap, NISN, Email, No. WhatsApp, Jenis Kelamin, Kelas, Link Profil.
 * Impor  : dicocokkan lewat NISN (cadangan: nama persis). Hanya kolom Kode ID Card yang dibaca.
 *          Kode kosong = tidak diubah. Selalu pratinjau (dryRun) dulu.
 * File yang sama dibaca ID Card Generator (.exe) sebagai sumber kebenaran nama, kode, dan link.
 */
import ExcelJS from 'exceljs';
import prisma from '../config/db.js';
import { ensureMemberIdentity } from './slug.js';
import { OrgError } from './orgSync.js';
import { cellText, norm } from './memberExcel.js';

const CODE_RE = /^PIKR_(\d{1,6})-(\d{2})$/;
const ORANGE = 'FFF97316';
const thin = { style: 'thin', color: { argb: 'FFD9D9D9' } };
const border = { top: thin, left: thin, bottom: thin, right: thin };

export const ROSTER_COLUMNS = [
  { key: 'no', header: 'No', width: 6 },
  { key: 'code', header: 'Kode ID Card', width: 16 },
  { key: 'name', header: 'Nama Lengkap', width: 34 },
  { key: 'nisn', header: 'NISN', width: 14 },
  { key: 'email', header: 'Email', width: 28 },
  { key: 'phone', header: 'No. WhatsApp', width: 16 },
  { key: 'gender', header: 'Jenis Kelamin', width: 14 },
  { key: 'className', header: 'Kelas', width: 9 },
  { key: 'link', header: 'Link Profil', width: 48 }
];

const ALIASES = {
  code: ['kode id card', 'kode', 'kode barcode', 'id pik-r', 'id pikr'],
  name: ['nama lengkap', 'nama'],
  nisn: ['nisn']
};

export function normalizeCode(raw) {
  const m = String(raw ?? '').trim().toUpperCase().match(CODE_RE);
  return m ? `PIKR_${m[1].padStart(4, '0')}-${m[2]}` : null;
}

const words = (s) => String(s || '').toUpperCase().replace(/[^A-Z]+/g, ' ').trim();

export async function buildRosterWorkbook() {
  await ensureMemberIdentity();
  const base = process.env.PUBLIC_SITE_URL || 'https://pikr-manseku.my.id';
  const members = await prisma.member.findMany({ where: { status: 'ACTIVE' } });
  const byName = (a, b) => a.name.trim().localeCompare(b.name.trim(), 'id');
  const withCode = members.filter((m) => m.memberCode).sort((a, b) => a.memberCode.localeCompare(b.memberCode));
  const without = members.filter((m) => !m.memberCode).sort(byName);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'PIK-R MANSEKU';
  const ws = wb.addWorksheet('Daftar ID Card');
  ws.columns = ROSTER_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  ws.getRow(1).height = 24;
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORANGE } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = border;
  });
  [...withCode, ...without].forEach((m, i) => {
    const row = ws.addRow({
      no: i + 1, code: m.memberCode || '', name: m.name.trim(), nisn: m.nisn, email: m.email,
      phone: m.whatsappNumber, gender: m.gender, className: m.className, link: m.slug ? `${base}/@${m.slug}` : ''
    });
    row.eachCell((c) => { c.border = border; });
    // Baris yang belum punya kode diberi warna lembut supaya mudah dikenali
    if (!m.memberCode) row.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7E6' } }; });
  });
  ['nisn', 'phone', 'code'].forEach((k) => { ws.getColumn(k).numFmt = '@'; });
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: 'A1', to: { row: 1, column: ROSTER_COLUMNS.length } };

  const g = wb.addWorksheet('Petunjuk');
  g.columns = [{ width: 22 }, { width: 92 }];
  [
    ['PETUNJUK DAFTAR ID CARD', ''],
    ['', ''],
    ['Urutan', `Baris putih sudah punya kode ID (${withCode.length}). Baris krem di bawahnya belum punya kode (${without.length}).`],
    ['Mengisi kode', 'Isi kolom "Kode ID Card" dengan format PIKR_0001-26 (nomor 4 digit, strip, 2 digit tahun masuk). Kode tidak boleh dobel.'],
    ['Kolom lain', 'Nama, NISN, email, dan seterusnya hanya untuk mencocokkan. Perubahannya TIDAK disimpan ke data anggota. Ubah data anggota di halaman Anggota.'],
    ['Mengunggah', 'Absensi -> ID Card -> Impor Excel. Pencocokan lewat NISN. Kode yang dikosongkan tidak mengubah apa pun.'],
    ['ID Card Generator', 'Pilih file ini di aplikasi generator ("Muat Excel daftar"). Foto yang namanya tidak ada di daftar, atau daftar yang tidak punya foto, masuk Failed/failed-list.xlsx.']
  ].forEach((r) => g.addRow(r));
  g.getRow(1).font = { bold: true, size: 14, color: { argb: 'FFC2410C' } };
  g.getColumn(1).font = { bold: true };
  g.eachRow((row) => row.eachCell((c) => { c.alignment = { vertical: 'top', wrapText: true }; }));
  return wb;
}

export async function parseRosterSheet(buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.getWorksheet('Daftar ID Card') || wb.worksheets[0];
  if (!ws) throw new OrgError('File Excel kosong');
  const colOf = {};
  ws.getRow(1).eachCell((cell, i) => {
    const h = norm(cellText(cell));
    for (const [key, list] of Object.entries(ALIASES)) if (list.includes(h) && !colOf[key]) colOf[key] = i;
  });
  if (!colOf.code) throw new OrgError('Kolom "Kode ID Card" tidak ditemukan di baris judul');
  if (!colOf.nisn && !colOf.name) throw new OrgError('Kolom "NISN" atau "Nama Lengkap" diperlukan untuk mencocokkan anggota');
  const rows = [];
  ws.eachRow((row, line) => {
    if (line === 1) return;
    const get = (k) => (colOf[k] ? cellText(row.getCell(colOf[k])).trim() : '');
    const r = { line, code: get('code'), name: get('name'), nisn: get('nisn') };
    if (r.code || r.name || r.nisn) rows.push(r);
  });
  if (!rows.length) throw new OrgError('Tidak ada baris data di file Excel');
  if (rows.length > 1000) throw new OrgError('Maksimal 1000 baris per impor');
  return rows;
}

/** Rencana impor tanpa menulis apa pun. */
export async function planRosterImport(rows) {
  const members = await prisma.member.findMany({
    where: { status: 'ACTIVE' }, select: { id: true, name: true, nisn: true, memberCode: true }
  });
  const byNisn = new Map(members.map((m) => [m.nisn, m]));
  const byName = new Map();
  for (const m of members) {
    const k = words(m.name);
    byName.set(k, byName.has(k) ? null : m); // null = nama kembar, tidak boleh dipakai mencocokkan
  }

  const plan = [];
  const errors = [];
  let skipped = 0;
  const seenMember = new Set();
  for (const r of rows) {
    if (!r.code) { skipped++; continue; } // kosong = tidak diubah
    const code = normalizeCode(r.code);
    const label = r.name || r.nisn || `baris ${r.line}`;
    if (!code) { errors.push({ line: r.line, nama: label, alasan: `Format kode "${r.code}" salah (contoh PIKR_0001-26)` }); continue; }
    const m = (r.nisn && byNisn.get(r.nisn)) || (r.name ? byName.get(words(r.name)) : null);
    if (!m) { errors.push({ line: r.line, nama: label, alasan: r.nisn || r.name ? 'Anggota aktif tidak ditemukan (cek NISN / nama)' : 'NISN dan nama kosong' }); continue; }
    if (seenMember.has(m.id)) { errors.push({ line: r.line, nama: label, alasan: 'Anggota ini muncul dua kali di file' }); continue; }
    seenMember.add(m.id);
    plan.push({ line: r.line, id: m.id, name: m.name.trim(), code, before: m.memberCode, changed: m.memberCode !== code });
  }

  // Kode dobel di dalam file
  const count = new Map();
  plan.forEach((p) => count.set(p.code, (count.get(p.code) || 0) + 1));
  const valid = [];
  for (const p of plan) {
    if (count.get(p.code) > 1) errors.push({ line: p.line, nama: p.name, alasan: `Kode ${p.code} dipakai lebih dari satu baris` });
    else valid.push(p);
  }

  // Kode yang sudah dipegang anggota lain yang TIDAK ikut berubah di file ini
  const finalOf = new Map(valid.map((p) => [p.id, p.code]));
  const free = [];
  for (const p of valid) {
    const holder = members.find((m) => m.memberCode === p.code && m.id !== p.id);
    if (holder && !(finalOf.has(holder.id) && finalOf.get(holder.id) !== p.code)) {
      errors.push({ line: p.line, nama: p.name, alasan: `Kode ${p.code} sudah dipakai ${holder.name.trim()}` });
    } else free.push(p);
  }
  return { plan: free, errors, skipped };
}

export async function applyRosterImport(plan) {
  const todo = plan.filter((p) => p.changed);
  if (!todo.length) return 0;
  // Lepas dulu semua kode yang akan berpindah supaya tukar kode tidak melanggar @unique
  await prisma.$transaction([
    prisma.member.updateMany({ where: { id: { in: todo.map((p) => p.id) } }, data: { memberCode: null } }),
    ...todo.map((p) => prisma.member.update({ where: { id: p.id }, data: { memberCode: p.code } }))
  ]);
  return todo.length;
}
