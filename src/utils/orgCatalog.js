/**
 * Katalog jabatan struktur organisasi: bisa diubah admin (tambah jabatan, ganti nama, geser hierarki).
 *
 *   level  = baris hierarki (1 = paling atas). Jabatan dengan level sama tampil berdampingan.
 *   order  = urutan dari kiri ke kanan di dalam satu level.
 *   parent = jabatan induk (anggota bidang menempel ke ketua bidangnya, tidak punya baris sendiri).
 *   unique = hanya boleh dipegang satu orang aktif (pemegang lama otomatis dipindahkan).
 *
 * Disimpan di Setting `ORG_POSITIONS`; bila belum pernah diubah, memakai DEFAULT_POSITIONS.
 */
import prisma from '../config/db.js';

export class OrgError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const BIDANG = ['MedInfo', 'Konselor Sebaya', 'Pendidik Sebaya', 'Humas', 'Informasi', 'Konseling dan Pendamping', 'Kegiatan dan Kreativitas'];

export const ROLE_TYPES = ['PEMBINA', 'KETUA', 'WAKIL', 'KABINET', 'ANGGOTA'];
const SETTING_KEY = 'ORG_POSITIONS';

export const DEFAULT_POSITIONS = [
  { label: 'Pembina', role: 'PEMBINA', group: 'Pembina', unique: true, level: 1, order: 1 },
  { label: 'Ketua Umum', role: 'KETUA', group: 'Pimpinan Inti', unique: true, level: 2, order: 1 },
  { label: 'Wakil Ketua Umum', role: 'WAKIL', group: 'Pimpinan Inti', unique: true, level: 3, order: 1 },
  { label: 'Sekretaris Umum', role: 'KABINET', group: 'Pimpinan Inti', unique: true, level: 4, order: 1 },
  { label: 'Bendahara Umum', role: 'KABINET', group: 'Pimpinan Inti', unique: true, level: 4, order: 2 },
  ...BIDANG.map((b, i) => ({ label: `Ketua ${b}`, role: 'KABINET', group: 'Ketua Bidang', unique: true, level: 5, order: i + 1 })),
  ...BIDANG.map((b, i) => ({ label: `Anggota ${b}`, role: 'ANGGOTA', group: 'Anggota Bidang', unique: false, level: 5, order: i + 1, parent: `Ketua ${b}` }))
];

const norm = (s) => String(s || '').trim().toLowerCase();

function groupFor(p) {
  if (p.role === 'PEMBINA') return 'Pembina';
  if (p.parent || p.role === 'ANGGOTA') return 'Anggota Bidang';
  if (p.role === 'KETUA' || p.role === 'WAKIL' || p.level <= 4) return 'Pimpinan Inti';
  return 'Ketua Bidang';
}

/** Rapikan satu entri katalog dari input admin. */
function cleanPosition(p, i) {
  const label = String(p.label || '').replace(/\s+/g, ' ').trim();
  if (!label) throw new OrgError('Nama jabatan tidak boleh kosong');
  if (label.length > 60) throw new OrgError(`Nama jabatan terlalu panjang: "${label.slice(0, 20)}…"`);
  if (!ROLE_TYPES.includes(p.role)) throw new OrgError(`Peran tidak valid untuk "${label}"`);
  const out = {
    label,
    role: p.role,
    unique: p.role === 'ANGGOTA' ? false : p.unique !== false,
    level: Math.max(1, Math.min(20, parseInt(p.level, 10) || 1)),
    order: parseInt(p.order, 10) || i + 1
  };
  if (p.parent) out.parent = String(p.parent).trim();
  out.group = p.group || groupFor(out);
  return out;
}

/** Katalog aktif: dari database bila pernah diubah admin, selain itu bawaan. */
export async function getCatalog() {
  const row = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  if (!row) return DEFAULT_POSITIONS;
  try {
    const list = JSON.parse(row.value);
    return Array.isArray(list) && list.length ? list : DEFAULT_POSITIONS;
  } catch {
    return DEFAULT_POSITIONS;
  }
}

export function findPosition(label, catalog = DEFAULT_POSITIONS) {
  return catalog.find((p) => norm(p.label) === norm(label)) || null;
}

/**
 * Simpan katalog baru dalam satu transaksi.
 * Entri boleh membawa `was` (nama lama) untuk mengganti nama: baris struktur AKTIF bernama lama
 * ikut berganti. Arsip dibiarkan apa adanya (riwayat). Jabatan yang masih dipegang pengurus aktif
 * tidak boleh hilang dari katalog.
 * @returns {{ catalog, renamed: Array<{from, to, count}> }}
 */
export async function saveCatalog(list) {
  if (!Array.isArray(list) || !list.length) throw new OrgError('Daftar jabatan kosong');
  const cleaned = list.map((p, i) => ({ ...cleanPosition(p, i), was: p.was ? String(p.was).trim() : undefined }));

  // Induk yang diganti namanya: anggota bidang yang masih menunjuk nama lama ikut menunjuk nama baru
  for (const p of cleaned) {
    if (!p.was || norm(p.was) === norm(p.label)) continue;
    cleaned.forEach((c) => { if (c.parent && norm(c.parent) === norm(p.was)) c.parent = p.label; });
  }

  const labels = new Set();
  for (const p of cleaned) {
    if (labels.has(norm(p.label))) throw new OrgError(`Nama jabatan dobel: "${p.label}"`);
    labels.add(norm(p.label));
  }
  for (const p of cleaned) {
    if (p.parent && !cleaned.some((x) => norm(x.label) === norm(p.parent) && !x.parent)) {
      throw new OrgError(`Induk "${p.parent}" untuk "${p.label}" tidak ada`);
    }
  }

  const active = await prisma.orgMember.findMany({ where: { isCurrent: true }, select: { jabatan: true } });
  const renamedFrom = new Set(cleaned.filter((p) => p.was).map((p) => norm(p.was)));
  const missing = [...new Set(active.map((a) => a.jabatan))].filter((j) => !labels.has(norm(j)) && !renamedFrom.has(norm(j)));
  if (missing.length) throw new OrgError(`Jabatan masih dipegang pengurus aktif, pindahkan dulu: ${missing.join(', ')}`);

  const renamed = [];
  const catalog = cleaned.map(({ was, ...p }) => p);
  await prisma.$transaction(async (tx) => {
    for (const p of cleaned) {
      if (!p.was || norm(p.was) === norm(p.label)) continue;
      const res = await tx.orgMember.updateMany({ where: { jabatan: p.was, isCurrent: true }, data: { jabatan: p.label, role: p.role } });
      const holders = await tx.orgMember.findMany({ where: { jabatan: p.label, isCurrent: true, memberId: { not: null } }, select: { memberId: true } });
      for (const h of holders) await tx.member.updateMany({ where: { id: h.memberId }, data: { role: p.role } });
      catalog.forEach((c) => { if (c.parent && norm(c.parent) === norm(p.was)) c.parent = p.label; });
      renamed.push({ from: p.was, to: p.label, count: res.count });
    }
    const value = JSON.stringify(catalog);
    await tx.setting.upsert({ where: { key: SETTING_KEY }, update: { value }, create: { key: SETTING_KEY, value } });
  });
  return { catalog, renamed };
}

/** Kembalikan katalog ke bawaan (hanya menghapus pengaturan; data pengurus tidak disentuh). */
export async function resetCatalog() {
  // Jabatan khusus yang masih dipegang pengurus aktif akan "yatim" kalau katalog dikembalikan: tolak dulu.
  const known = new Set(DEFAULT_POSITIONS.map((p) => norm(p.label)));
  const active = await prisma.orgMember.findMany({ where: { isCurrent: true }, select: { jabatan: true } });
  const orphan = [...new Set(active.map((a) => a.jabatan))].filter((j) => !known.has(norm(j)));
  if (orphan.length) throw new OrgError(`Jabatan khusus masih dipegang pengurus aktif, pindahkan dulu: ${orphan.join(', ')}`);
  await prisma.setting.deleteMany({ where: { key: SETTING_KEY } });
  return DEFAULT_POSITIONS;
}
