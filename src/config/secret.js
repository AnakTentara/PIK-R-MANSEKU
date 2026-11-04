import dotenv from 'dotenv';
dotenv.config();

const KNOWN_DEFAULT = 'supersecretkeypikrmanseku123';

/**
 * Rahasia penanda token login. Wajib diisi di .env saat NODE_ENV=production;
 * nilai bawaan lama ditolak karena tertulis di repositori. Di mode pengembangan tetap ada nilai cadangan
 * supaya `npm run dev` langsung jalan.
 */
export const JWT_SECRET = (() => {
  const v = process.env.JWT_SECRET;
  const prod = process.env.NODE_ENV === 'production';
  if (prod && (!v || v === KNOWN_DEFAULT || v.length < 24)) {
    console.error('[ENV] JWT_SECRET belum aman. Isi JWT_SECRET di .env dengan teks acak minimal 24 karakter (lihat .env.example).');
    process.exit(1);
  }
  return v || KNOWN_DEFAULT;
})();
