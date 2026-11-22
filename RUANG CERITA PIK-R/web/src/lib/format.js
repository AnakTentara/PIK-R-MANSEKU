/** Format angka & waktu bergaya Instagram, dalam Bahasa Indonesia. */
export function compact(n = 0) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace('.0', '').replace('.', ',')} jt`;
  if (n >= 1e4) return `${Math.floor(n / 1e3)} rb`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace('.0', '').replace('.', ',')} rb`;
  return String(n);
}

/** Format angka ringkas untuk tombol aksi: 1-999, 1rb-999rb, 1,2rb, 1jt-999jt. */
export function formatStatCount(n = 0) {
  const num = Number(n) || 0;
  if (num <= 0) return '0';
  if (num >= 1e6) {
    const v = (num / 1e6).toFixed(1).replace('.0', '').replace('.', ',');
    return `${v}jt`;
  }
  if (num >= 1e3) {
    const v = (num / 1e3).toFixed(1).replace('.0', '').replace('.', ',');
    return `${v}rb`;
  }
  return String(num);
}
export const plural = (n, word) => `${compact(n)} ${word}`;

/** "2 mnt", "3 j", "5 h", "12 Nov" — ringkas seperti Instagram. */
export function ago(date) {
  const d = new Date(date);
  const s = Math.max(1, Math.round((Date.now() - d) / 1000));
  if (s < 60) return `${s} dtk`;
  if (s < 3600) return `${Math.floor(s / 60)} mnt`;
  if (s < 86400) return `${Math.floor(s / 3600)} j`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} h`;
  if (s < 52 * 7 * 86400) return `${Math.floor(s / (7 * 86400))} mgg`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
/** Versi panjang untuk bawah postingan: "3 jam yang lalu", "12 November". */
export function agoLong(date) {
  const d = new Date(date);
  const s = Math.max(1, Math.round((Date.now() - d) / 1000));
  if (s < 60) return 'Baru saja';
  if (s < 3600) return `${Math.floor(s / 60)} menit yang lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam yang lalu`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} hari yang lalu`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', ...(d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) });
}
export const clock = (date) => new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

/** Status aktif ("Aktif sekarang", "Aktif 5 mnt lalu"). */
export function activeLabel(lastSeenAt) {
  if (!lastSeenAt) return null;
  const s = (Date.now() - new Date(lastSeenAt)) / 1000;
  if (s < 180) return 'Aktif sekarang';
  if (s < 3600) return `Aktif ${Math.floor(s / 60)} mnt lalu`;
  if (s < 86400) return `Aktif ${Math.floor(s / 3600)} j lalu`;
  return null;
}

/** Pecah teks menjadi bagian biasa, @sebutan, dan #tagar (untuk dirender sebagai tautan). */
export function tokenize(text = '') {
  const out = [];
  const re = /(@[a-z0-9._-]{2,40}|#[\p{L}0-9_]{2,40}|https?:\/\/[^\s]+)/giu;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push({ t: 'text', v: text.slice(last, m.index) });
    const v = m[0];
    out.push({ t: v[0] === '@' ? 'mention' : v[0] === '#' ? 'tag' : 'url', v });
    last = m.index + v.length;
  }
  if (last < text.length) out.push({ t: 'text', v: text.slice(last) });
  return out;
}
