/**
 * Cadangan data: satu ZIP berisi database (snapshot konsisten) + seluruh folder uploads + info.json.
 * Dipakai oleh tombol "Unduh Cadangan" di dashboard dan oleh scripts/backup.mjs (otomatis harian).
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import prisma from '../config/db.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const DB_PATH = path.join(here, '../../local.db');
export const UPLOADS_DIR = path.join(here, '../../public/uploads');

export class BackupError extends Error {}

function countFiles(dir) {
  let files = 0;
  let bytes = 0;
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else { files++; bytes += fs.statSync(full).size; }
    }
  };
  walk(dir);
  return { files, bytes };
}

/** Tulis ZIP cadangan ke stream `out`. Mengembalikan ringkasan isi setelah selesai. */
export async function writeBackupZip(out) {
  if (!fs.existsSync(DB_PATH)) throw new BackupError('Database SQLite local.db tidak ditemukan di root server.');
  const tmp = path.join(os.tmpdir(), `pikr_snapshot_${Date.now()}_${process.pid}.db`);
  const cleanup = () => fs.promises.rm(tmp, { force: true }).catch(() => {});
  try {
    // VACUUM INTO menyalin database yang sedang dipakai tanpa file setengah tertulis; cadangan: salin biasa
    try {
      await prisma.$executeRawUnsafe(`VACUUM INTO '${tmp.replace(/'/g, "''")}'`);
    } catch {
      await fs.promises.copyFile(DB_PATH, tmp);
    }
    const { files, bytes } = countFiles(UPLOADS_DIR);
    const info = {
      dibuat: new Date().toISOString(), versi: process.env.npm_package_version || null,
      database: 'pikr_manseku.db', gambar: files, ukuranGambarByte: bytes,
      pulihkan: 'Hentikan server, salin pikr_manseku.db menjadi local.db di root server, dan isi folder uploads/ ke public/uploads/.'
    };

    await new Promise((resolve, reject) => {
      const zip = archiver('zip', { zlib: { level: 6 } });
      zip.on('error', reject);
      out.on('error', reject);
      out.on('close', resolve);
      zip.pipe(out);
      zip.file(tmp, { name: 'pikr_manseku.db' });
      if (fs.existsSync(UPLOADS_DIR)) zip.directory(UPLOADS_DIR, 'uploads');
      zip.append(JSON.stringify(info, null, 2), { name: 'info.json' });
      zip.finalize();
    });
    return info;
  } finally {
    await cleanup();
  }
}
