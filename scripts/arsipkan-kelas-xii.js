/**
 * Arsipkan anggota kelas XII yang sudah tamat -> status ALUMNI.
 *
 *   node scripts/arsipkan-kelas-xii.js          # dry run: hanya menampilkan daftar
 *   node scripts/arsipkan-kelas-xii.js --apply  # simpan perubahan
 *
 * - Member kelas XII (className diawali "XII") -> status ALUMNI.
 * - Jabatan struktur (OrgMember) yang masih aktif milik mereka -> isCurrent=false, yearEnd=tahun ini,
 *   supaya bagan struktur organisasi tidak lagi menampilkan pengurus lama.
 * - Pembina tidak pernah disentuh.
 */
import prisma from '../src/config/db.js';

const apply = process.argv.includes('--apply');
const year = new Date().getFullYear();

const members = await prisma.member.findMany({
  where: { status: 'ACTIVE', className: { startsWith: 'XII' }, NOT: { role: 'PEMBINA' } },
  orderBy: [{ className: 'asc' }, { name: 'asc' }],
  include: { orgMember: true }
});

console.log(`${members.length} anggota kelas XII aktif:${apply ? '' : '  (DRY RUN, tambahkan --apply untuk menyimpan)'}`);
for (const m of members) {
  const jab = m.orgMember?.isCurrent ? `  [jabatan aktif: ${m.orgMember.jabatan}]` : '';
  console.log(`  - ${m.className.padEnd(6)} ${m.name.trim()}${jab}`);
}

if (apply && members.length) {
  const ids = members.map(m => m.id);
  const [mem, org] = await prisma.$transaction([
    prisma.member.updateMany({ where: { id: { in: ids } }, data: { status: 'ALUMNI' } }),
    prisma.orgMember.updateMany({ where: { memberId: { in: ids }, isCurrent: true }, data: { isCurrent: false, yearEnd: year } })
  ]);
  console.log(`\nSelesai: ${mem.count} anggota -> ALUMNI, ${org.count} jabatan struktur ditutup (yearEnd=${year}).`);
}

const active = await prisma.member.count({ where: { status: 'ACTIVE' } });
console.log(`Anggota aktif ${apply ? 'sekarang' : 'saat ini'}: ${active}`);
await prisma.$disconnect();
