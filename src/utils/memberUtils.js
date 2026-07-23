/**
 * Shared utility: kalkulator masa aktif keanggotaan PIK-R
 * Berdasarkan kelas (X=3thn, XI=2thn, XII=1thn) sejak joinYear.
 */

export function isMemberExpired(joinYear, className) {
  const cName = (className || '').trim().toUpperCase();
  let yearsToAdd = 3; // Default: Kelas X

  if (cName.startsWith('XI-') || cName.startsWith('XI ') || cName === 'XI' || cName.startsWith('11')) {
    yearsToAdd = 2;
  } else if (cName.startsWith('XII-') || cName.startsWith('XII ') || cName === 'XII' || cName.startsWith('12')) {
    yearsToAdd = 1;
  } else if (cName.startsWith('X-') || cName.startsWith('X ') || cName === 'X' || cName.startsWith('10')) {
    yearsToAdd = 3;
  }

  const expirationDate = new Date(joinYear + yearsToAdd, 6, 25, 23, 59, 59); // 25 Juli setelah yearsToAdd
  return new Date() > expirationDate;
}
