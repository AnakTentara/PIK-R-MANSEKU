/**
 * Helper waktu WIB (Asia/Jakarta, UTC+7, tanpa DST).
 * Semua logika "hari yang sama" absensi wajib lewat helper ini,
 * supaya tidak meleset kalau jam server memakai UTC.
 */

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

// Date -> 'YYYY-MM-DD' menurut WIB
export function wibDate(d = new Date()) {
  return new Date(d.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

// Date -> 'HH:mm' menurut WIB
export function wibTime(d) {
  if (!d) return null;
  return new Date(new Date(d).getTime() + WIB_OFFSET_MS).toISOString().slice(11, 16);
}

// ('YYYY-MM-DD', 'HH:mm') -> Date
export function fromWib(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time || '')) {
    return null;
  }
  return new Date(`${date}T${time}:00+07:00`);
}

// 'YYYY-MM-DD' -> 0 (Minggu) .. 6 (Sabtu)
export function wibWeekday(date) {
  return new Date(`${date}T12:00:00+07:00`).getUTCDay();
}

export function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date || '') && !Number.isNaN(new Date(`${date}T00:00:00+07:00`).getTime());
}
