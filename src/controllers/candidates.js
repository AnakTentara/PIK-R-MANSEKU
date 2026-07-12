import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeypikrmanseku123';

// 1. Public Candidate Registration
export async function registerCandidate(req, res) {
  const { nisn, name, className, whatsappNumber, email, gender, reason, asalSekolah } = req.body;

  if (!nisn || !name || !className || !whatsappNumber || !email || !gender || !asalSekolah) {
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  }

  try {
    // Check if registration session is open
    const sessionSetting = await prisma.setting.findUnique({ where: { key: 'REGISTRATION_SESSION' } });
    const session = sessionSetting ? JSON.parse(sessionSetting.value) : { status: 'open' };
    if (session && session.status !== 'open') {
      return res.status(400).json({ message: 'Maaf, pendaftaran anggota baru saat ini sedang ditutup.' });
    }

    const existing = await prisma.candidate.findUnique({ where: { nisn } });
    if (existing) {
      return res.status(400).json({ message: 'NISN sudah terdaftar' });
    }

    const candidate = await prisma.candidate.create({
      data: {
        nisn,
        name,
        className,
        whatsappNumber,
        email,
        gender,
        asalSekolah,
        reason: reason || '',
        status: 'PENDING'
      }
    });

    return res.status(201).json({
      message: 'Pendaftaran berhasil dilakukan. Silakan menunggu pengumuman hasil kelulusan.',
      candidate: {
        id: candidate.id,
        nisn: candidate.nisn,
        name: candidate.name
      }
    });
  } catch (error) {
    console.error('Error registering candidate:', error);
    return res.status(500).json({ message: 'Gagal melakukan pendaftaran' });
  }
}

// 2. SNBP-Like Announcement Check (Public)
export async function checkStatus(req, res) {
  const { nisn } = req.query;

  if (!nisn) {
    return res.status(400).json({ message: 'NISN wajib dicantumkan dalam query' });
  }

  try {
    const candidate = await prisma.candidate.findUnique({
      where: { nisn },
      select: {
        name: true,
        nisn: true,
        status: true,
        className: true
      }
    });

    if (!candidate) {
      return res.status(404).json({ message: 'Data peserta tidak ditemukan' });
    }

    return res.json({
      message: 'Data ditemukan',
      candidate
    });
  } catch (error) {
    console.error('Error checking candidate status:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan saat memeriksa status' });
  }
}

// 3. Member/Candidate Login
export async function loginCandidate(req, res) {
  const { nisn, password } = req.body;

  if (!nisn || !password) {
    return res.status(400).json({ message: 'NISN dan password wajib diisi' });
  }

  try {
    const candidate = await prisma.candidate.findUnique({ where: { nisn } });
    if (!candidate || !candidate.password) {
      return res.status(401).json({ message: 'NISN atau password salah (Pastikan admin telah memberikan password)' });
    }

    const isMatch = await bcrypt.compare(password, candidate.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'NISN atau password salah' });
    }

    const token = jwt.sign(
      { id: candidate.id, nisn: candidate.nisn, role: 'candidate' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login berhasil',
      token,
      candidate: {
        id: candidate.id,
        nisn: candidate.nisn,
        name: candidate.name,
        status: candidate.status
      }
    });
  } catch (error) {
    console.error('Error candidate login:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
}

// 4. Get Current Logged-in Candidate Profile (Self)
export async function getProfile(req, res) {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: req.candidate.id }
    });

    if (!candidate) {
      return res.status(404).json({ message: 'Biodata pendaftar tidak ditemukan' });
    }

    return res.json(candidate);
  } catch (error) {
    console.error('Error getting profile:', error);
    return res.status(500).json({ message: 'Gagal mengambil data profil' });
  }
}

// 5. Update Candidate Profile (Self)
export async function updateProfile(req, res) {
  const { name, className, whatsappNumber, email, gender, reason } = req.body;

  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: req.candidate.id }
    });

    if (!candidate) {
      return res.status(404).json({ message: 'Profil tidak ditemukan' });
    }

    // Calon pendaftar bisa update biodatanya sendiri
    const updated = await prisma.candidate.update({
      where: { id: req.candidate.id },
      data: {
        name: name ?? candidate.name,
        className: className ?? candidate.className,
        whatsappNumber: whatsappNumber ?? candidate.whatsappNumber,
        email: email ?? candidate.email,
        gender: gender ?? candidate.gender,
        reason: reason ?? candidate.reason
      }
    });

    return res.json({
      message: 'Profil pendaftar berhasil diperbarui',
      candidate: updated
    });
  } catch (error) {
    console.error('Error updating candidate profile:', error);
    return res.status(500).json({ message: 'Gagal memperbarui profil' });
  }
}
