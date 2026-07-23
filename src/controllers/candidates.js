import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { isMemberExpired } from '../utils/memberUtils.js';

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
    let candidate = await prisma.candidate.findUnique({
      where: { nisn },
      select: {
        name: true,
        nisn: true,
        status: true,
        className: true
      }
    });

    // If not found in candidate table, fallback to member table
    if (!candidate) {
      const member = await prisma.member.findUnique({
        where: { nisn },
        select: {
          name: true,
          nisn: true,
          className: true
        }
      });

      if (member) {
        candidate = {
          name: member.name,
          nisn: member.nisn,
          className: member.className,
          status: 'LULUS' // If they are in the Member table, they are accepted!
        };
      }
    }

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
    // 1. Check Candidate table first
    let user = await prisma.candidate.findUnique({ where: { nisn } });
    let isMember = false;

    if (!user) {
      // 2. Fallback to Member table (Active Members)
      user = await prisma.member.findUnique({ where: { nisn } });
      isMember = true;
    }

    if (!user || !user.password) {
      return res.status(401).json({ message: 'NISN atau password salah' });
    }

    // 3. For Members, check expiration (Auto-alumni check)
    if (isMember && user.role !== 'PEMBINA') {
      const joinYear = user.joinYear || new Date(user.createdAt).getFullYear();
      if (user.status === 'ALUMNI' || isMemberExpired(joinYear, user.className)) {
        if (user.status !== 'ALUMNI') {
          await prisma.member.update({
            where: { id: user.id },
            data: { status: 'ALUMNI' }
          });
        }
        return res.status(403).json({ 
          message: 'Akun Anda telah dinonaktifkan karena masa aktif keanggotaan Anda telah habis (Sudah menjadi Alumni).' 
        });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'NISN atau password salah' });
    }

    const token = jwt.sign(
      { id: user.id, nisn: user.nisn, role: 'candidate', isMember },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login berhasil',
      token,
      candidate: {
        id: user.id,
        nisn: user.nisn,
        name: user.name,
        status: isMember ? 'MEMBER' : user.status
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
    let user = await prisma.candidate.findUnique({
      where: { id: req.candidate.id }
    });

    if (!user) {
      user = await prisma.member.findUnique({
        where: { id: req.candidate.id }
      });
    }

    if (!user) {
      return res.status(404).json({ message: 'Profil anggota tidak ditemukan' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Error getting profile:', error);
    return res.status(500).json({ message: 'Gagal mengambil data profil' });
  }
}

// 5. Update Candidate Profile (Self)
export async function updateProfile(req, res) {
  const { name, className, whatsappNumber, email, gender, reason, asalSekolah } = req.body;
  const photoPath = req.file ? `/uploads/photos/${req.file.filename}` : undefined;

  try {
    let candidate = await prisma.candidate.findUnique({
      where: { id: req.candidate.id }
    });

    if (candidate) {
      // Update Candidate
      const updated = await prisma.candidate.update({
        where: { id: req.candidate.id },
        data: {
          name: name ?? candidate.name,
          className: className ?? candidate.className,
          whatsappNumber: whatsappNumber ?? candidate.whatsappNumber,
          email: email ?? candidate.email,
          gender: gender ?? candidate.gender,
          reason: reason ?? candidate.reason,
          asalSekolah: asalSekolah ?? candidate.asalSekolah,
          photoPath: photoPath ?? candidate.photoPath
        }
      });

      // Synchronize with Member table if status is LULUS
      if (candidate.status === 'LULUS') {
        const correspondingMember = await prisma.member.findUnique({
          where: { nisn: candidate.nisn }
        });
        if (correspondingMember) {
          await prisma.member.update({
            where: { id: correspondingMember.id },
            data: {
              name: name ?? correspondingMember.name,
              className: className ?? correspondingMember.className,
              whatsappNumber: whatsappNumber ?? correspondingMember.whatsappNumber,
              email: email ?? correspondingMember.email,
              gender: gender ?? correspondingMember.gender,
              asalSekolah: asalSekolah ?? correspondingMember.asalSekolah,
              photoPath: photoPath ?? correspondingMember.photoPath
            }
          });
        }
      }

      return res.json({
        message: 'Profil pendaftar berhasil diperbarui',
        candidate: updated
      });
    } else {
      // Fallback: Update Member directly
      const member = await prisma.member.findUnique({
        where: { id: req.candidate.id }
      });

      if (!member) {
        return res.status(404).json({ message: 'Profil tidak ditemukan' });
      }

      const updatedMember = await prisma.member.update({
        where: { id: req.candidate.id },
        data: {
          name: name ?? member.name,
          className: className ?? member.className,
          whatsappNumber: whatsappNumber ?? member.whatsappNumber,
          email: email ?? member.email,
          gender: gender ?? member.gender,
          asalSekolah: asalSekolah ?? member.asalSekolah,
          photoPath: photoPath ?? member.photoPath
        }
      });

      return res.json({
        message: 'Profil anggota berhasil diperbarui',
        candidate: updatedMember
      });
    }
  } catch (error) {
    console.error('Error updating candidate profile:', error);
    return res.status(500).json({ message: 'Gagal memperbarui profil' });
  }
}

// 6. Verify OTP & Reset Password
export async function verifyResetOtp(req, res) {
  const { identifier, otpCode, newPassword } = req.body;

  if (!identifier || !otpCode || !newPassword) {
    return res.status(400).json({ message: 'NISN/Nomor WA, Kode OTP, dan Kata Sandi baru wajib diisi' });
  }

  try {
    const cleanId = identifier.trim();
    const cleanOtp = otpCode.trim();

    // 1. Find OTP record — ikat ke identifier supaya OTP user A tidak bisa dipakai user B
    const otpModel = prisma.passwordResetOtp || prisma.PasswordResetOtp;
    if (!otpModel) {
      return res.status(400).json({ message: 'Layanan OTP sedang dalam pembaruan. Silakan coba beberapa saat lagi.' });
    }

    // 1. Find active OTP by code
    const otpRecord = await otpModel.findFirst({
      where: {
        otpCode: cleanOtp,
        isUsed: false,
        expiresAt: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Kode OTP tidak valid atau telah kedaluwarsa (berlaku 10 menit).' });
    }

    // 2. Find Member or Candidate using input identifier OR OTP stored identifier
    const searchIds = [cleanId, otpRecord.identifier].filter(Boolean);
    const searchConditions = [];

    for (const id of searchIds) {
      const cleanStr = id.trim();
      searchConditions.push({ nisn: cleanStr });
      searchConditions.push({ whatsappNumber: cleanStr });
      if (cleanStr.length >= 6) {
        searchConditions.push({ whatsappNumber: { contains: cleanStr.slice(-9) } });
      }
    }

    let member = await prisma.member.findFirst({
      where: { OR: searchConditions }
    });

    let candidate = null;
    if (!member) {
      candidate = await prisma.candidate.findFirst({
        where: { OR: searchConditions }
      });
    }

    if (!member && !candidate) {
      return res.status(404).json({ message: 'Akun pendaftar/anggota tidak ditemukan' });
    }

    // 3. Verify OTP ownership
    const userNisn = member?.nisn || candidate?.nisn || '';
    const userWa = member?.whatsappNumber || candidate?.whatsappNumber || '';
    const otpId = otpRecord.identifier || '';

    const isOtpOwner =
      otpId === cleanId ||
      (userNisn && otpId.includes(userNisn)) ||
      (userWa && userWa.includes(otpId.slice(-9))) ||
      (userWa && otpId.includes(userWa.slice(-9))) ||
      (userNisn && cleanId.includes(userNisn)) ||
      (userWa && cleanId.includes(userWa.slice(-9)));

    if (!isOtpOwner) {
      return res.status(400).json({ message: 'Kode OTP ini tidak terhubung dengan akun yang dimasukkan.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (member) {
      await prisma.member.update({
        where: { id: member.id },
        data: {
          password: hashedPassword,
          plainPassword: newPassword
        }
      });
    }

    if (candidate) {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          password: hashedPassword,
          plainPassword: newPassword
        }
      });
    }

    // 4. Mark OTP as used
    await otpModel.update({
      where: { id: otpRecord.id },
      data: { isUsed: true }
    });

    return res.json({ message: 'Kata sandi berhasil diperbarui! Silakan login dengan kata sandi baru Anda.' });
  } catch (error) {
    console.error('Error verifying reset OTP:', error);
    return res.status(500).json({ message: 'Gagal mereset kata sandi' });
  }
}

