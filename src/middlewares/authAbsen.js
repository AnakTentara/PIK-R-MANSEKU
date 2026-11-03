import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import prisma from '../config/db.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeypikrmanseku123';

/**
 * Akun bersama aplikasi absensi (dipakai turun-temurun dari tahun ke tahun).
 * Disimpan di tabel Setting, BUKAN tabel Admin: seedDefaultAdmin() di server.js
 * menghapus admin bernama 'pikrmanseku01' setiap server start.
 * Password bisa diganti dari halaman Pengaturan aplikasi absen.
 */
const DEFAULT_USERNAME = process.env.ABSEN_USERNAME || 'pikrmanseku01';
const DEFAULT_PASSWORD = process.env.ABSEN_PASSWORD || 'pikrmanseku1me';

export async function ensureAbsenAccount() {
  try {
    const existing = await prisma.setting.findUnique({ where: { key: 'absen_password_hash' } });
    if (existing) return;
    await prisma.$transaction([
      prisma.setting.upsert({
        where: { key: 'absen_username' },
        update: {},
        create: { key: 'absen_username', value: DEFAULT_USERNAME }
      }),
      prisma.setting.create({
        data: { key: 'absen_password_hash', value: await bcrypt.hash(DEFAULT_PASSWORD, 10) }
      })
    ]);
    console.log(`[Absen] Akun absensi dibuat: ${DEFAULT_USERNAME}`);
  } catch (error) {
    console.error('[Absen] Gagal membuat akun absensi:', error.message);
  }
}

export async function getAbsenAccount() {
  await ensureAbsenAccount();
  const rows = await prisma.setting.findMany({
    where: { key: { in: ['absen_username', 'absen_password_hash'] } }
  });
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return { username: map.absen_username || DEFAULT_USERNAME, passwordHash: map.absen_password_hash };
}

export function signAbsenToken(officer) {
  return jwt.sign(
    { id: officer.id, kind: officer.kind, role: 'absen' },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

// Role dashboard admin yang boleh memakai API absensi, dan yang boleh mengubah data
export const DASHBOARD_READ_ROLES = ['DEVELOPER', 'KABINET_UMUM', 'MEDINFO'];
export const DASHBOARD_WRITE_ROLES = ['DEVELOPER', 'KABINET_UMUM'];

/**
 * Menerima 2 jenis token:
 * - token web absen (role 'absen'): akun bersama atau admin yang login di web absen
 * - token dashboard admin (role 'admin'): dipakai menu Absensi di dashboard
 * req.officer = { kind, name, adminRole? }
 */
export async function authAbsen(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Akses ditolak, token tidak ditemukan' });
  }

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);

    // Token dashboard admin
    if (decoded.role === 'admin') {
      const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
      if (!admin) return res.status(401).json({ message: 'Akun admin tidak ditemukan' });
      if (!DASHBOARD_READ_ROLES.includes(admin.role)) {
        return res.status(403).json({ message: 'Role ini tidak punya akses ke absensi' });
      }
      req.officer = { kind: 'admin', name: admin.username, adminRole: admin.role };
      return next();
    }

    if (decoded.role !== 'absen') {
      return res.status(403).json({ message: 'Token ini bukan untuk aplikasi absensi' });
    }

    if (decoded.kind === 'admin') {
      const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
      if (!admin) return res.status(401).json({ message: 'Akun admin tidak ditemukan' });
      req.officer = { kind: 'admin', name: admin.username, adminRole: admin.role };
      return next();
    }

    // Akun bersama: token batal otomatis kalau username diganti
    const account = await getAbsenAccount();
    if (decoded.kind !== 'shared' || decoded.id !== account.username) {
      return res.status(401).json({ message: 'Sesi login sudah tidak berlaku, silakan masuk lagi' });
    }
    req.officer = { kind: 'shared', name: account.username };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid atau kedaluwarsa' });
  }
}

/**
 * Hanya admin website ber-role DEVELOPER / KABINET_UMUM (dari dashboard maupun web absen).
 * Dipakai untuk aksi pengelolaan: hapus kegiatan, reset password akun absen, impor ID Card.
 */
export function requireManager(req, res, next) {
  if (req.officer?.kind !== 'admin' || !DASHBOARD_WRITE_ROLES.includes(req.officer.adminRole)) {
    return res.status(403).json({ message: 'Hanya admin (Developer / Kabinet Umum) yang boleh melakukan ini' });
  }
  next();
}

/**
 * Akses tulis absensi: akun bersama web absen, atau admin selain MEDINFO.
 * MEDINFO di dashboard hanya boleh melihat rekap.
 */
export function requireWriter(req, res, next) {
  if (req.officer?.kind === 'admin' && !DASHBOARD_WRITE_ROLES.includes(req.officer.adminRole)) {
    return res.status(403).json({ message: 'Role ini hanya boleh melihat rekap absensi' });
  }
  next();
}
