/**
 * Shared utility: helper functions for member management.
 * Auto-alumni logic has been removed — status is now fully managed by admin.
 */
import prisma from '../config/db.js';

// Peran struktur yang dianggap tim inti (bukan anggota bidang biasa)
export const INTI_ROLES = ['KETUA', 'WAKIL', 'KABINET'];

/** Select OrgMember minimal yang dibutuhkan untuk menentukan jabatan / label alumni. */
export const ORG_TITLE_SELECT = { role: true, jabatan: true, isCurrent: true, yearStart: true, yearEnd: true };

/** Periode kepengurusan "2025/2026" dari yearStart/yearEnd OrgMember. */
export function periodeLabel(org) {
  if (!org?.yearStart) return null;
  const end = org.yearEnd && org.yearEnd > org.yearStart ? org.yearEnd : org.yearStart + 1;
  return `${org.yearStart}/${end}`;
}

/**
 * Label untuk alumni yang pernah menjabat di tim inti, mis. "ALUMNI KETUA UMUM 2025/2026".
 * Alumni yang dulu hanya anggota bidang (atau tidak punya jabatan) -> null.
 */
export function alumniLabel(org) {
  if (!org || !INTI_ROLES.includes(org.role) || !org.jabatan) return null;
  return `ALUMNI ${org.jabatan.trim().toUpperCase()} ${periodeLabel(org)}`;
}

/**
 * Jabatan yang boleh ditampilkan untuk seorang anggota (aturan satu pintu):
 * - ACTIVE  : jabatan struktur saat ini, atau "Anggota"
 * - ALUMNI  : label "ALUMNI <JABATAN> <PERIODE>" bila pernah tim inti, selain itu "Alumni"
 *             (alumni tidak punya jabatan & tidak masuk struktur)
 * @param {{status: string, orgMember?: object|null}} member
 */
export function memberTitle(member) {
  const org = member?.orgMember;
  if (member?.status === 'ALUMNI') return alumniLabel(org) || 'Alumni';
  return org?.isCurrent ? org.jabatan : 'Anggota';
}

/**
 * Tutup jabatan struktur aktif milik anggota yang menjadi alumni:
 * isCurrent=false + yearEnd=tahun ini, sehingga bagan struktur tidak lagi menampilkan mereka.
 * Riwayat tim inti tetap tersimpan untuk label alumni & arsip.
 */
export function closeOrgForMembers(memberIds, year = new Date().getFullYear()) {
  return prisma.orgMember.updateMany({
    where: { memberId: { in: memberIds }, isCurrent: true },
    data: { isCurrent: false, yearEnd: year }
  });
}

/**
 * Calculate estimated graduation year based on joinYear and className.
 * This is purely informational — does NOT affect member status.
 * @param {number} joinYear - The year the member joined
 * @param {string} className - The member's class (e.g. "X-1", "XI-3", "XII-2")
 * @returns {number} Estimated graduation year
 */
export function getGraduationYear(joinYear, className) {
  const cName = (className || '').trim().toUpperCase();
  let yearsToAdd = 3; // Default: Kelas X

  if (cName.startsWith('XII') || cName.startsWith('12')) {
    yearsToAdd = 1;
  } else if (cName.startsWith('XI') || cName.startsWith('11')) {
    yearsToAdd = 2;
  } else if (cName.startsWith('X') || cName.startsWith('10')) {
    yearsToAdd = 3;
  }

  return joinYear + yearsToAdd;
}
