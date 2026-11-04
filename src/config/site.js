/**
 * Satu-satunya tempat alamat situs didefinisikan. Pindah domain / server = ubah .env saja.
 *
 *  PUBLIC_SITE_URL   alamat utama situs (dipakai link QR, email, WhatsApp, sitemap)
 *  ABSEN_SITE_URL    alamat web absen (opsional)
 *  API_SITE_URL      alamat API publik (opsional)
 *  CORS_ORIGINS      origin tambahan, dipisah koma (mis. alamat LAN untuk tes dari HP)
 *  CORS_EXTRA_ORIGINS  nama lama dari CORS_ORIGINS, tetap dibaca
 */
const clean = (v) => String(v || '').trim().replace(/\/+$/, '');
const list = (v) => String(v || '').split(',').map(clean).filter(Boolean);

export const SITE_URL = clean(process.env.PUBLIC_SITE_URL) || 'https://pikr-manseku.my.id';
const siteHost = new URL(SITE_URL).hostname.replace(/^www\./, '');

export const ABSEN_URL = clean(process.env.ABSEN_SITE_URL) || `https://absen.${siteHost}`;
export const API_URL = clean(process.env.API_SITE_URL) || `https://d-base.${siteHost}`;

export const ALLOWED_ORIGINS = [...new Set([
  clean(process.env.FRONTEND_URL) || 'http://localhost:25551',
  'http://localhost:25551',
  'http://localhost:25554',
  SITE_URL,
  `https://www.${siteHost}`,
  ABSEN_URL,
  API_URL,
  ...list(process.env.CORS_ORIGINS),
  ...list(process.env.CORS_EXTRA_ORIGINS)
])];

export const ABSEN_HOST = new URL(ABSEN_URL).hostname;
