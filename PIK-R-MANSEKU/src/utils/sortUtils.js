/**
 * Urutan kelas yang benar untuk SMA/MA: X-1 ... X-9, XI-1 ..., XII-1 ... (bukan urutan huruf).
 * Sama dengan compareKelas di frontend (components/common/PickerField.jsx).
 */
const KELAS_RE = /^(XII|XI|X)[-. ]?(\d+)$/i;
const TINGKAT = { X: 1, XI: 2, XII: 3 };
const collator = new Intl.Collator('id', { numeric: true, sensitivity: 'base' });

export function compareKelas(a, b) {
  const ma = KELAS_RE.exec(String(a || '').trim());
  const mb = KELAS_RE.exec(String(b || '').trim());
  if (ma && mb) return (TINGKAT[ma[1].toUpperCase()] - TINGKAT[mb[1].toUpperCase()]) || (Number(ma[2]) - Number(mb[2]));
  if (ma) return -1;
  if (mb) return 1;
  return collator.compare(a || '', b || '');
}
