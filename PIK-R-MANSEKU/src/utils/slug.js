import prisma from '../config/db.js';

/**
 * Identitas ID Card anggota (dicetak di kartu, jadi TIDAK BOLEH berubah setelah dibuat):
 * - memberCode  "PIKR_0001-26"  -> barcode batang di depan ID Card (diisi manual lewat Excel)
 * - slug        "kenziefavianmahardika" -> QR belakang: https://pikr-manseku.my.id/@kenziefavianmahardika
 */

// Harus identik dengan make_handle() di idcard-generator/processor.py
export function slugify(name) {
  return String(name || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 60) || 'anggota';
}

export async function uniqueSlug(name) {
  const base = slugify(name);
  let candidate = base;
  let n = 2;
  while (await prisma.member.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}${n++}`;
  }
  return candidate;
}

/**
 * Isi slug (link profil) untuk member yang belum punya. Kode ID Card (memberCode) TIDAK dibuat
 * otomatis: admin mengisinya lewat Excel di Absensi -> ID Card, supaya sama dengan kartu cetak.
 */
export async function ensureMemberIdentity() {
  try {
    const members = await prisma.member.findMany({
      where: { slug: null },
      orderBy: [{ joinYear: 'asc' }, { createdAt: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true }
    });
    for (const m of members) {
      await prisma.member.update({ where: { id: m.id }, data: { slug: await uniqueSlug(m.name) } });
    }
    if (members.length) console.log(`[Absen] Link profil dibuat untuk ${members.length} anggota.`);
  } catch (error) {
    console.error('[Absen] Gagal membuat link profil:', error.message);
  }
}
