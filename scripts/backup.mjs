#!/usr/bin/env node
/**
 * Cadangan otomatis harian (dijalankan PM2 tiap pukul 03:00, lihat ecosystem.config.cjs).
 *
 *   node scripts/backup.mjs                 # simpan ke BACKUP_DIR (bawaan: ../PIK-R-BACKUP)
 *   BACKUP_KEEP=14 BACKUP_DIR=E:\cadangan node scripts/backup.mjs
 *
 * Simpan juga salinan di luar komputer ini (flashdisk / cloud): cadangan satu disk tidak menolong bila disknya rusak.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env') });
process.chdir(root);

const dir = path.resolve(process.env.BACKUP_DIR || path.join(root, '..', 'PIK-R-BACKUP'));
const keep = Math.max(1, Number(process.env.BACKUP_KEEP) || 14);
const PREFIX = 'pikr_backup_';

const { writeBackupZip } = await import('../src/utils/backup.js');
const { default: prisma } = await import('../src/config/db.js');

try {
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
  const file = path.join(dir, `${PREFIX}${stamp}.zip`);
  const part = `${file}.part`;
  const info = await writeBackupZip(fs.createWriteStream(part));
  fs.renameSync(part, file); // baru dianggap ada setelah selesai utuh
  const mb = (fs.statSync(file).size / 1048576).toFixed(1);
  console.log(`[backup] ${file} (${mb} MB, ${info.gambar} gambar)`);

  const old = fs.readdirSync(dir).filter((f) => f.startsWith(PREFIX) && f.endsWith('.zip')).sort().reverse().slice(keep);
  for (const f of old) { fs.rmSync(path.join(dir, f), { force: true }); console.log(`[backup] hapus yang lama: ${f}`); }
  for (const f of fs.readdirSync(dir)) if (f.endsWith('.part')) fs.rmSync(path.join(dir, f), { force: true });
} catch (err) {
  console.error('[backup] GAGAL:', err.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
