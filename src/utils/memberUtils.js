/**
 * Shared utility: helper functions for member management.
 * Auto-alumni logic has been removed — status is now fully managed by admin.
 */

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
