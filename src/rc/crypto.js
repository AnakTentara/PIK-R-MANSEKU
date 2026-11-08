/**
 * Enkripsi isi pesan saat disimpan (encryption at rest) untuk Pesan (DM) dan Bilik Konseling.
 *
 * - AES-256-GCM, kunci 32 byte dari .env `RC_MESSAGE_KEY` (base64). Kunci TIDAK ikut cadangan ZIP,
 *   jadi local.db / ZIP cadangan yang bocor tidak membuka isi pesan.
 * - Format teks: "e1:" + base64url(iv 12 | tag 16 | ciphertext). Awalan versi memungkinkan rotasi kunci.
 * - Format file: "RCE1" + iv + tag + ciphertext.
 * - Ini BUKAN end-to-end: server bisa membuka pesan (diperlukan untuk laporan & keadaan darurat).
 *   End-to-end untuk DM ada di rencana pembaruan.
 *
 * PENTING: kehilangan RC_MESSAGE_KEY = semua pesan tidak bisa dibuka lagi. Simpan salinan .env terpisah.
 */
import crypto from 'crypto';
import dotenv from 'dotenv';
import { RcError } from './core.js';

dotenv.config();

const DEV_KEY = crypto.createHash('sha256').update('pikr-ruang-cerita-dev-only').digest();
let cached = null;

function key() {
  if (cached) return cached;
  const raw = process.env.RC_MESSAGE_KEY;
  if (raw) {
    const k = Buffer.from(raw, 'base64');
    if (k.length !== 32) throw new RcError(503, 'Kunci enkripsi pesan tidak valid (RC_MESSAGE_KEY harus 32 byte base64).');
    cached = k;
    return k;
  }
  if (process.env.NODE_ENV === 'production') {
    console.error('[RC] RC_MESSAGE_KEY belum diisi di .env. Pesan & konseling dimatikan sampai kunci diisi.');
    throw new RcError(503, 'Fitur pesan belum dikonfigurasi di server.');
  }
  cached = DEV_KEY; // komputer pengembangan / sandbox saja
  return cached;
}

export function seal(plain) {
  if (plain === null || plain === undefined || plain === '') return plain;
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const ct = Buffer.concat([c.update(String(plain), 'utf8'), c.final()]);
  return `e1:${Buffer.concat([iv, c.getAuthTag(), ct]).toString('base64url')}`;
}

export function open(sealed) {
  if (!sealed || typeof sealed !== 'string' || !sealed.startsWith('e1:')) return sealed;
  try {
    const b = Buffer.from(sealed.slice(3), 'base64url');
    const d = crypto.createDecipheriv('aes-256-gcm', key(), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8');
  } catch (err) {
    if (err instanceof RcError) throw err;
    return '[pesan tidak dapat dibuka]';
  }
}

const MAGIC = Buffer.from('RCE1');
export function sealBuffer(buf) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const ct = Buffer.concat([c.update(buf), c.final()]);
  return Buffer.concat([MAGIC, iv, c.getAuthTag(), ct]);
}
export function openBuffer(buf) {
  if (!buf.subarray(0, 4).equals(MAGIC)) return buf;
  const d = crypto.createDecipheriv('aes-256-gcm', key(), buf.subarray(4, 16));
  d.setAuthTag(buf.subarray(16, 32));
  return Buffer.concat([d.update(buf.subarray(32)), d.final()]);
}

/** Dipanggil saat server menyala: memastikan kunci ada (pesan error jelas di log, server tetap jalan). */
export function checkMessageKey() {
  try { key(); return true; } catch { return false; }
}
