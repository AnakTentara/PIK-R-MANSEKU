/**
 * Rapikan format nama anggota & struktur organisasi memakai aturan yang sama dengan pendaftaran
 * (toTitleCase): "M.hAlo" -> "M. Halo", "HAIKAL MABRUR" -> "Haikal Mabrur", spasi ganda/ujung dibuang.
 *
 *   node scripts/rapikan-nama.js          # pratinjau saja
 *   node scripts/rapikan-nama.js --apply  # simpan
 *
 * Yang disentuh: Member.name dan OrgMember.name. Tidak mengubah slug/kode ID Card
 * (keduanya sudah tercetak di kartu dan tidak boleh berubah).
 * Gelar seperti "S.Pd" ditulis "S.Pd" (bukan "S. Pd"), dan nama-nama pengecualian bisa
 * ditambahkan di NAMA_KHUSUS.
 */
import prisma from '../src/config/db.js';
import { toTitleCase } from '../src/utils/nameUtils.js';

const apply = process.argv.includes('--apply');

// Pengecualian: nama persis (setelah trim) -> penulisan yang benar
const NAMA_KHUSUS = {
  'Panca Nopriansyah, S.Pd': 'Panca Nopriansyah, S.Pd'
};

const GELAR = /\b([SMDA])\. (Pd|Kom|Si|E|Ag|H|T|Psi|Kep|Farm|Sos|Hum|Ked|Ds)\b/g;

export function rapikan(name) {
  const trimmed = String(name || '').trim();
  if (NAMA_KHUSUS[trimmed]) return NAMA_KHUSUS[trimmed];
  // gelar akademik: "S. Pd" -> "S.Pd" (toTitleCase menyisipkan spasi setelah titik)
  return toTitleCase(trimmed).replace(GELAR, '$1.$2');
}

const members = await prisma.member.findMany({ select: { id: true, name: true, status: true } });
const orgs = await prisma.orgMember.findMany({ select: { id: true, name: true, memberId: true } });
const memberById = new Map(members.map(m => [m.id, m]));

const changes = [];
for (const m of members) {
  const to = rapikan(m.name);
  if (to !== m.name) changes.push({ table: 'Member', id: m.id, from: m.name, to });
}
for (const o of orgs) {
  // baris struktur yang tertaut mengikuti nama anggota (sumber kebenaran)
  const linked = o.memberId ? memberById.get(o.memberId) : null;
  const to = rapikan(linked ? linked.name : o.name);
  if (to !== o.name) changes.push({ table: 'OrgMember', id: o.id, from: o.name, to });
}

console.log(`${changes.length} nama akan dirapikan${apply ? '' : '  (PRATINJAU, tambahkan --apply untuk menyimpan)'}:`);
for (const c of changes) console.log(`  [${c.table.padEnd(9)}] ${JSON.stringify(c.from).padEnd(40)} -> ${JSON.stringify(c.to)}`);

if (apply && changes.length) {
  await prisma.$transaction(changes.map(c =>
    c.table === 'Member'
      ? prisma.member.update({ where: { id: c.id }, data: { name: c.to } })
      : prisma.orgMember.update({ where: { id: c.id }, data: { name: c.to } })
  ));
  console.log(`\nSelesai: ${changes.length} nama diperbarui.`);
}
await prisma.$disconnect();
