/**
 * Shared Multer configuration untuk semua upload routes.
 * Menggantikan konfigurasi duplikat di routes/admin.js, routes/candidates.js, routes/forum.js
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ALLOWED_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

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
        let ext = path.extname(file.originalname).toLowerCase();
        if (!ALLOWED_IMAGE_EXTS.has(ext)) ext = '.jpg';
        cb(null, `${prefix}${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
      }
    }),
    limits: { fileSize: sizeMB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (file.mimetype.startsWith('image/') && ALLOWED_IMAGE_EXTS.has(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Hanya file gambar (.jpg, .jpeg, .png, .webp, .gif) yang diperbolehkan'));
      }
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

// Dokumen lampiran (PDF/DOC, max 15MB)
const ALLOWED_DOC_EXTS = new Set(['.pdf', '.doc', '.docx']);
function makeDocUpload(subfolder, sizeMB = 15) {
  const dir = path.join(__dirname, `../../public/uploads/${subfolder}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, dir),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeExt = ALLOWED_DOC_EXTS.has(ext) ? ext : '.pdf';
        cb(null, `doc-${Date.now()}-${Math.random().toString(36).slice(2)}${safeExt}`);
      }
    }),
    limits: { fileSize: sizeMB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ALLOWED_DOC_EXTS.has(ext)) cb(null, true);
      else cb(new Error('Hanya file dokumen (.pdf, .doc, .docx) yang diperbolehkan'));
    }
  });
}

export const uploadDocs = makeDocUpload('documents', 15);

// File Excel anggota: disimpan di memori (tidak ditulis ke disk), maks 5MB, hanya .xlsx
export const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/\.xlsx$/i.test(file.originalname)) cb(null, true);
    else cb(new Error('Hanya file .xlsx yang diperbolehkan'));
  }
});
