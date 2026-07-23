/**
 * Rate limiting middleware untuk endpoint-endpoint sensitif.
 * Mencegah brute force login, spam OTP, dan spam registrasi.
 */

import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Rate limiter untuk endpoint login admin & kandidat.
 * Max 10 percobaan per 15 menit per IP.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.'
  }
});

/**
 * Rate limiter untuk endpoint verifikasi OTP.
 * Max 5 percobaan per 10 menit per IP.
 */
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: isDev ? 100 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Terlalu banyak percobaan OTP. Silakan coba lagi dalam 10 menit.'
  }
});

/**
 * Rate limiter untuk endpoint registrasi.
 * Max 5 pendaftaran per jam per IP.
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 100 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Terlalu banyak percobaan pendaftaran. Silakan coba lagi dalam 1 jam.'
  }
});
