/**
 * Shared Multer configuration untuk semua upload routes.
 * Menggantikan konfigurasi duplikat di routes/admin.js, routes/candidates.js, routes/forum.js
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Factory function: buat multer instance dengan konfigurasi terstandarisasi.
 * @param {string} subfolder - subfolder dalam public/uploads/ (photos, blog, logos)
 * @param {string} prefix    - prefix nama file (opsional)
 * @param {number} sizeMB    - batas ukuran file dalam MB
 */
function makeUpload(subfolder, prefix = '', sizeMB = 25) {
  const dir = path.join(__dirname, `../../public/uploads/${subfolder}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, dir),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${prefix}${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
      }
    }),
    limits: { fileSize: sizeMB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Hanya file gambar yang diperbolehkan'));
    }
  });
}

// Foto profil anggota/kandidat/org (max 25MB)
export const uploadPhoto = makeUpload('photos', '', 25);

// Gambar artikel blog admin (max 5MB)
export const uploadBlog = makeUpload('blog', 'blog-', 5);

// Logo website (max 2MB)
export const uploadLogo = makeUpload('logos', 'logo-', 2);

// Featured image forum/blog anggota (max 5MB)
export const uploadForum = makeUpload('blog', 'forum-', 5);
