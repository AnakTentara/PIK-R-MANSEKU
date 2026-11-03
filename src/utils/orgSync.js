/**
 * Sinkronisasi satu pintu antara Member.role (halaman Anggota) dan OrgMember (Struktur Organisasi).
 *
 * Aturan:
 * - OrgMember aktif (isCurrent) adalah sumber kebenaran jabatan. Member.role hanyalah turunannya
 *   ('member' bila tidak punya jabatan aktif).
 * - Satu anggota hanya punya satu baris OrgMember (memberId @unique): baris itu = jabatan terbarunya.
 * - Jabatan tunggal (Ketua Umum, Sekretaris, Ketua bidang, Pembina, ...) hanya boleh dipegang satu orang
 *   aktif; pemegang lama otomatis diarsipkan.
 * - Alumni tidak punya jabatan aktif. Jabatan tim inti mereka tetap tersimpan di arsip kepengurusan.
 */
import prisma from '../config/db.js';
import { OrgError, DEFAULT_POSITIONS, getCatalog, findPosition } from './orgCatalog.js';

export { OrgError, getCatalog, findPosition };
export const POSITIONS = DEFAULT_POSITIONS;

/** Jabatan bawaan untuk peran yang jabatannya sudah pasti (KABINET/ANGGOTA tidak bisa ditebak). */
export function defaultJabatanForRole(role) {
  return { PEMBINA: 'Pembina', KETUA: 'Ketua Umum', WAKIL: 'Wakil Ketua Umum' }[role] || null;
}

const thisYear = () => new Date().getFullYear();

export function parseBool(v, fallback) {
  if (v === undefined || v === null || v === '') return fallback;
  return v === true || v === 'true' || v === '1' || v === 1;
}

/** Arsipkan baris OrgMember (isCurrent=false, yearEnd) dan reset peran anggotanya ke 'member'. */
async function archiveRows(tx, rows, year) {
  const names = [];
  for (const row of rows) {
    await tx.orgMember.update({ where: { id: row.id }, data: { isCurrent: false, yearEnd: year } });
    if (row.memberId) await tx.member.updateMany({ where: { id: row.memberId }, data: { role: 'member' } });
    names.push(row.name.trim());
  }
  return names;
}

/** Hapus baris pemegang lama tanpa arsip (pilihan "Tidak" saat penggantian) dan reset perannya. */
async function removeRows(tx, rows) {
  const names = [];
  for (const row of rows) {
    await tx.orgMember.delete({ where: { id: row.id } });
    if (row.memberId) await tx.member.updateMany({ where: { id: row.memberId }, data: { role: 'member' } });
    names.push(row.name.trim());
  }
  return names;
}

/**
 * Pindahkan pemegang lama sebuah jabatan tunggal.
 * mode 'archive' (bawaan): jabatannya masuk Arsip Kepengurusan.
 * mode 'remove': hanya diganti, catatannya tidak disimpan di arsip.
 */
async function displaceHolders(tx, jabatan, exceptOrgId, year, mode = 'archive') {
  const holders = (await tx.orgMember.findMany({ where: { jabatan, isCurrent: true } })).filter(h => h.id !== exceptOrgId);
  return mode === 'remove' ? removeRows(tx, holders) : archiveRows(tx, holders, year);
}

/**
 * Simpan satu entri struktur (tambah / ubah) dan sinkronkan Member.role.
 * @param {object} input { id?, memberId?, name?, jabatan?, role?, yearStart?, yearEnd?, isCurrent?, quote?, photoPath?, displaceMode? }
 *   memberId: id anggota | 'NONE' (lepas tautan) | undefined (tidak diubah)
 *   displaceMode: 'archive' (bawaan) | 'remove' -> nasib pemegang lama jabatan tunggal
 * @returns {{ org, displaced: string[] }}
 */
export async function saveOrgEntry(input) {
  const year = thisYear();
  const existing = input.id ? await prisma.orgMember.findUnique({ where: { id: input.id } }) : null;
  if (input.id && !existing) throw new OrgError('Data tidak ditemukan', 404);

  // Anggota yang ditautkan (1 anggota = 1 baris)
  let memberId = existing?.memberId ?? null;
  if (input.memberId === 'NONE' || input.memberId === '') memberId = null;
  else if (input.memberId && input.memberId !== 'MANUAL') memberId = input.memberId;

  const member = memberId ? await prisma.member.findUnique({ where: { id: memberId } }) : null;
  if (memberId && !member) throw new OrgError('Akun anggota tidak ditemukan', 404);

  const sameMemberRow = memberId && !existing
    ? await prisma.orgMember.findUnique({ where: { memberId } })
    : null;
  const target = existing || sameMemberRow; // baris yang akan diubah

  const catalog = await getCatalog();
  const jabatan = (input.jabatan || target?.jabatan || '').trim();
  const pos = findPosition(jabatan, catalog);
  const role = pos?.role || input.role || target?.role;
  const name = (member?.name || input.name || target?.name || '').trim();
  if (!name || !jabatan || !role) throw new OrgError('Nama/anggota, jabatan, dan peran wajib diisi');

  let isCurrent = parseBool(input.isCurrent, target ? target.isCurrent : true);
  if (member && member.status !== 'ACTIVE') isCurrent = false; // alumni tidak punya jabatan aktif

  const yearStart = input.yearStart ? parseInt(input.yearStart, 10) : (target?.yearStart ?? year);
  const yearEnd = isCurrent ? null : (input.yearEnd ? parseInt(input.yearEnd, 10) : (target?.yearEnd ?? year));
  // Baris arsip yang dibuka lagi dianggap periode baru
  const reopened = isCurrent && target && !target.isCurrent;

  const result = await prisma.$transaction(async (tx) => {
    const displaced = isCurrent && pos?.unique
      ? await displaceHolders(tx, jabatan, target?.id ?? null, year, input.displaceMode === 'remove' ? 'remove' : 'archive')
      : [];

    const data = {
      name, role, jabatan,
      yearStart: reopened ? year : yearStart,
      yearEnd,
      isCurrent,
      quote: input.quote !== undefined ? (input.quote || null) : (target?.quote ?? null),
      photoPath: input.photoPath !== undefined ? input.photoPath : (target?.photoPath ?? null),
      memberId
    };
    const org = target
      ? await tx.orgMember.update({ where: { id: target.id }, data })
      : await tx.orgMember.create({ data });

    // Peran anggota lama yang dilepas dari baris ini kembali menjadi 'member'
    if (target?.memberId && target.memberId !== memberId && target.isCurrent) {
      await tx.member.updateMany({ where: { id: target.memberId }, data: { role: 'member' } });
    }
    // Peran anggota yang ditautkan mengikuti jabatan aktifnya
    if (memberId) {
      await tx.member.update({ where: { id: memberId }, data: { role: isCurrent ? role : 'member' } });
    }
    return { org, displaced };
  });
  return result;
}

/** Beri anggota aktif sebuah jabatan (dipakai halaman Anggota). */
export async function assignPosition(memberId, jabatan, opts = {}) {
  const pos = findPosition(jabatan, await getCatalog());
  if (!pos) throw new OrgError(`Jabatan "${jabatan}" tidak dikenal`);
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) throw new OrgError('Anggota tidak ditemukan', 404);
  if (member.status !== 'ACTIVE') throw new OrgError('Alumni tidak bisa diberi jabatan aktif');
  return saveOrgEntry({ memberId, jabatan: pos.label, isCurrent: true, quote: opts.quote, yearStart: opts.yearStart, displaceMode: opts.displaceMode });
}

/** Cabut jabatan aktif anggota (jadi anggota biasa); jabatannya diarsipkan. */
export async function clearPosition(memberId, year = thisYear()) {
  const rows = await prisma.orgMember.findMany({ where: { memberId, isCurrent: true } });
  await prisma.$transaction(async (tx) => {
    await archiveRows(tx, rows, year);
    await tx.member.updateMany({ where: { id: memberId }, data: { role: 'member' } });
  });
  return rows.length;
}

/** Hapus baris struktur; peran anggota yang tertaut kembali ke 'member' bila baris itu aktif. */
export async function deleteOrgEntry(id) {
  const row = await prisma.orgMember.findUnique({ where: { id } });
  if (!row) throw new OrgError('Data tidak ditemukan', 404);
  await prisma.$transaction(async (tx) => {
    await tx.orgMember.delete({ where: { id } });
    if (row.memberId && row.isCurrent) await tx.member.updateMany({ where: { id: row.memberId }, data: { role: 'member' } });
  });
  return row;
}

/** Nama anggota berubah -> salin ke baris struktur yang tertaut. */
export function syncOrgName(memberId, name) {
  return prisma.orgMember.updateMany({ where: { memberId }, data: { name: String(name).trim() } });
}

/** Anggota yang akan dihapus: jabatan aktifnya diarsipkan (nama tetap di arsip), bukan jadi "hantu" di bagan. */
export async function archiveBeforeDelete(memberId, year = thisYear()) {
  await prisma.orgMember.updateMany({ where: { memberId, isCurrent: true }, data: { isCurrent: false, yearEnd: year } });
}

/**
 * Laporan ketidaksesuaian data. `fixes` aman diterapkan otomatis; `needsPosition` butuh keputusan admin
 * (peran KABINET/ANGGOTA tanpa jabatan tidak bisa ditebak bidangnya).
 */
export async function buildSyncReport() {
  const members = await prisma.member.findMany({
    select: { id: true, name: true, className: true, status: true, role: true, photoPath: true, orgMember: true }
  });
  const fixes = [];
  const needsPosition = [];

  for (const m of members) {
    const org = m.orgMember;
    const label = { id: m.id, name: m.name.trim(), className: m.className, photoPath: m.photoPath };
    if (m.status === 'ALUMNI') {
      if (org?.isCurrent) fixes.push({ ...label, type: 'ALUMNI_JABATAN_AKTIF', detail: `Jabatan "${org.jabatan}" ditutup (alumni)` });
      if (m.role !== 'member' && m.role !== 'PEMBINA') fixes.push({ ...label, type: 'ALUMNI_PERAN', detail: `Peran ${m.role} → member` });
      continue;
    }
    if (org?.isCurrent && m.role !== org.role) {
      fixes.push({ ...label, type: 'PERAN_BEDA', detail: `Peran ${m.role} → ${org.role} (mengikuti "${org.jabatan}")` });
    } else if (!org?.isCurrent && m.role !== 'member') {
      const def = defaultJabatanForRole(m.role);
      if (def) fixes.push({ ...label, type: 'BUAT_JABATAN', jabatan: def, detail: `Peran ${m.role} dibuatkan jabatan "${def}"` });
      else needsPosition.push({ ...label, role: m.role });
    }
  }

  const orphans = await prisma.orgMember.findMany({ where: { isCurrent: true, memberId: null, NOT: { role: 'PEMBINA' } } });
  orphans.forEach(o => needsPosition.push({ id: o.id, name: o.name.trim(), className: '-', role: o.role, orphan: true }));

  return { fixes, needsPosition };
}

/** Terapkan perbaikan aman dari buildSyncReport(). */
export async function applySyncFixes() {
  const { fixes } = await buildSyncReport();
  const year = thisYear();
  let applied = 0;
  for (const f of fixes) {
    if (f.type === 'ALUMNI_JABATAN_AKTIF') {
      await prisma.orgMember.updateMany({ where: { memberId: f.id, isCurrent: true }, data: { isCurrent: false, yearEnd: year } });
    } else if (f.type === 'ALUMNI_PERAN') {
      await prisma.member.update({ where: { id: f.id }, data: { role: 'member' } });
    } else if (f.type === 'PERAN_BEDA') {
      const org = await prisma.orgMember.findUnique({ where: { memberId: f.id } });
      await prisma.member.update({ where: { id: f.id }, data: { role: org.role } });
    } else if (f.type === 'BUAT_JABATAN') {
      await assignPosition(f.id, f.jabatan);
    }
    applied++;
  }
  return { applied, remaining: (await buildSyncReport()).needsPosition };
}
