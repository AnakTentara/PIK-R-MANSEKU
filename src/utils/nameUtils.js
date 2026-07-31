/**
 * Utility untuk memformat nama ke format Title Case secara cerdas:
 * 1. Menghapus spasi di awal dan di akhir (trim).
 * 2. Mengubah spasi ganda/berlebih menjadi 1 spasi.
 * 3. Menambahkan spasi setelah titik jika menempel dengan huruf (contoh: "m.aziz" -> "M. Aziz").
 * 4. Mengubah huruf pertama setiap kata/singkatan menjadi kapital (contoh: "haikal mabrur" -> "Haikal Mabrur").
 */
export function toTitleCase(str) {
  if (!str || typeof str !== 'string') return '';

  let cleaned = str
    .trim()
    // 1. Sisipkan spasi setelah titik jika langsung diikuti huruf/angka tanpa spasi (m.aziz -> m. aziz)
    .replace(/\.([a-zA-Z0-9])/g, '. $1')
    // 2. Ubah spasi ganda/berlebih menjadi 1 spasi tunggal
    .replace(/\s+/g, ' ');

  // 3. Title-case setiap kata (dan bagian setelah titik)
  return cleaned
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (!word) return '';
      // Jika kata mengandung titik (misal "m." atau "drs.")
      if (word.includes('.')) {
        return word
          .split('.')
          .map(part => part ? part.charAt(0).toUpperCase() + part.slice(1) : '')
          .join('.');
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}
