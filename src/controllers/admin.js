import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma, { initDatabase, getDbProvider } from '../config/db.js';
import { sendBulkNotifications } from '../services/notification.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeypikrmanseku123';

// 1. Admin Login
export async function loginAdmin(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi' });
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'admin', adminRole: admin.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login berhasil',
      token,
      admin: { id: admin.id, username: admin.username, role: admin.role }
    });
  } catch (error) {
    console.error('Error admin login:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
}

// 2. Get All Candidates
export async function getCandidates(req, res) {
  try {
    const candidates = await prisma.candidate.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(candidates);
  } catch (error) {
    console.error('Error get candidates:', error);
    return res.status(500).json({ message: 'Gagal mengambil data pendaftar' });
  }
}

// 3. Get Candidate Detail
export async function getCandidateById(req, res) {
  const { id } = req.params;
  try {
    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (!candidate) {
      return res.status(404).json({ message: 'Pendaftar tidak ditemukan' });
    }
    return res.json(candidate);
  } catch (error) {
    console.error('Error get candidate detail:', error);
    return res.status(500).json({ message: 'Gagal mengambil detail pendaftar' });
  }
}

// 4. Create Candidate manually by Admin
export async function createCandidate(req, res) {
  const { nisn, name, className, whatsappNumber, email, gender, reason, status, asalSekolah } = req.body;

  if (!nisn || !name || !className || !whatsappNumber || !email || !gender || !asalSekolah) {
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  }

  try {
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
        status: status || 'PENDING'
      }
    });

    return res.status(201).json({ message: 'Pendaftar berhasil ditambahkan', candidate });
  } catch (error) {
    console.error('Error create candidate:', error);
    return res.status(500).json({ message: 'Gagal menambahkan pendaftar' });
  }
}

// 5. Update Candidate
export async function updateCandidate(req, res) {
  const { id } = req.params;
  const { nisn, name, className, whatsappNumber, email, gender, reason, status, plainPassword, asalSekolah } = req.body;

  try {
    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (!candidate) {
      return res.status(404).json({ message: 'Pendaftar tidak ditemukan' });
    }

    if (nisn && nisn !== candidate.nisn) {
      const existing = await prisma.candidate.findUnique({ where: { nisn } });
      if (existing) {
        return res.status(400).json({ message: 'NISN sudah terdaftar oleh pengguna lain' });
      }
    }

    const updateData = {
      nisn: nisn ?? candidate.nisn,
      name: name ?? candidate.name,
      className: className ?? candidate.className,
      whatsappNumber: whatsappNumber ?? candidate.whatsappNumber,
      email: email ?? candidate.email,
      gender: gender ?? candidate.gender,
      asalSekolah: asalSekolah ?? candidate.asalSekolah,
      reason: reason ?? candidate.reason,
      status: status ?? candidate.status
    };

    if (plainPassword !== undefined) {
      updateData.plainPassword = plainPassword;
      if (plainPassword) {
        updateData.password = await bcrypt.hash(plainPassword, 10);
      } else {
        updateData.password = null;
      }
    }

    const updated = await prisma.candidate.update({
      where: { id },
      data: updateData
    });

    return res.json({ message: 'Biodata pendaftar berhasil diperbarui', candidate: updated });
  } catch (error) {
    console.error('Error update candidate:', error);
    return res.status(500).json({ message: 'Gagal memperbarui biodata pendaftar' });
  }
}

// 6. Delete Candidate
export async function deleteCandidate(req, res) {
  const { id } = req.params;
  try {
    await prisma.candidate.delete({ where: { id } });
    return res.json({ message: 'Pendaftar berhasil dihapus' });
  } catch (error) {
    console.error('Error delete candidate:', error);
    return res.status(500).json({ message: 'Gagal menghapus pendaftar' });
  }
}

// 7. Auto-Generate Passwords for candidates without password
export async function generatePasswords(req, res) {
  try {
    const candidatesWithoutPassword = await prisma.candidate.findMany({
      where: {
        OR: [
          { password: null },
          { password: '' }
        ]
      }
    });

    if (candidatesWithoutPassword.length === 0) {
      return res.json({ message: 'Semua pendaftar sudah memiliki password' });
    }

    let updatedCount = 0;
    for (const candidate of candidatesWithoutPassword) {
      // Generate a simple easy-to-read 6-digit number password (e.g. 294819)
      const simplePassword = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedPassword = await bcrypt.hash(simplePassword, 10);

      await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          password: hashedPassword,
          plainPassword: simplePassword
        }
      });
      updatedCount++;
    }

    return res.json({
      message: `Berhasil meng-generate password untuk ${updatedCount} pendaftar`,
      count: updatedCount
    });
  } catch (error) {
    console.error('Error generating passwords:', error);
    return res.status(500).json({ message: 'Gagal meng-generate password otomatis' });
  }
}

// 8. Export Candidate Accounts to JSON
export async function exportJSON(req, res) {
  try {
    const candidates = await prisma.candidate.findMany({
      select: {
        nisn: true,
        name: true,
        className: true,
        plainPassword: true,
        status: true
      }
    });

    res.setHeader('Content-Disposition', 'attachment; filename=akun_pendaftar.json');
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(candidates, null, 2));
  } catch (error) {
    console.error('Error exporting JSON:', error);
    return res.status(500).json({ message: 'Gagal mengekspor data akun ke JSON' });
  }
}

// 9. Export Candidates to Excel
export async function exportExcel(req, res) {
  try {
    const candidates = await prisma.candidate.findMany({
      orderBy: { className: 'asc' }
    });

    const data = candidates.map((c, index) => ({
      'No': index + 1,
      'NISN': c.nisn,
      'Nama': c.name,
      'Kelas': c.className,
      'Jenis Kelamin': c.gender,
      'No. WhatsApp': c.whatsappNumber,
      'Email': c.email,
      'Alasan Bergabung': c.reason,
      'Status Kelulusan': c.status,
      'Password Akun': c.plainPassword || '-',
      'Sudah Email': c.emailNotified ? 'Ya' : 'Belum',
      'Sudah WA': c.waNotified ? 'Ya' : 'Belum',
      'Tanggal Daftar': c.createdAt.toISOString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pendaftar PIK-R');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=rekap_pendaftar_pikr.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (error) {
    console.error('Error exporting Excel:', error);
    return res.status(500).json({ message: 'Gagal mengekspor data ke Excel' });
  }
}

// 10. Send Notifications (Email + WhatsApp)
export async function triggerNotifications(req, res) {
  try {
    const result = await sendBulkNotifications();
    return res.json({
      message: 'Proses pengiriman notifikasi selesai',
      details: result
    });
  } catch (error) {
    console.error('Error triggering notifications:', error);
    return res.status(500).json({ message: 'Gagal mengirimkan notifikasi' });
  }
}

// 11. Get Settings
export async function getSettings(req, res) {
  try {
    const allSettings = await prisma.setting.findMany();
    const mysqlSetting = allSettings.find(s => s.key === 'MYSQL_CONFIG');
    const smtpSetting = allSettings.find(s => s.key === 'SMTP_CONFIG');

    const mysql = mysqlSetting && mysqlSetting.value ? JSON.parse(mysqlSetting.value) : {
      host: '',
      port: 3306,
      username: '',
      password: '',
      database: ''
    };

    const smtp = smtpSetting && smtpSetting.value ? JSON.parse(smtpSetting.value) : {
      host: '',
      port: 587,
      username: '',
      password: '',
      from: ''
    };

    return res.json({
      provider: getDbProvider(),
      mysql,
      smtp,
      settings: allSettings
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    return res.status(500).json({ message: 'Gagal mengambil data pengaturan' });
  }
}

// 12. Save Settings
export async function saveSettings(req, res) {
  const { mysql, smtp, key, value } = req.body;

  try {
    // 1. Generic key-value save
    if (key && value !== undefined) {
      await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    }

    // 2. MySQL config save
    if (mysql) {
      await prisma.setting.upsert({
        where: { key: 'MYSQL_CONFIG' },
        update: { value: JSON.stringify(mysql) },
        create: { key: 'MYSQL_CONFIG', value: JSON.stringify(mysql) }
      });
    }

    // 3. SMTP config save
    if (smtp) {
      await prisma.setting.upsert({
        where: { key: 'SMTP_CONFIG' },
        update: { value: JSON.stringify(smtp) },
        create: { key: 'SMTP_CONFIG', value: JSON.stringify(smtp) }
      });
    }

    // 4. Re-initialize database connection dynamically if MySQL changed
    let provider = getDbProvider();
    if (mysql) {
      const initResult = await initDatabase();
      provider = initResult.provider;
    }

    return res.json({
      message: 'Pengaturan berhasil disimpan',
      provider
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return res.status(500).json({ message: 'Gagal menyimpan pengaturan' });
  }
}

// ─────────────────────────────────────────────────
// SESSION LIFECYCLE
// ─────────────────────────────────────────────────

// 13. Close Registration Session → migrate LULUS → Member, clear Candidates
export async function closeSession(req, res) {
  const currentYear = new Date().getFullYear();
  try {
    // 1. Fetch all LULUS candidates
    const lulusList = await prisma.candidate.findMany({
      where: { status: 'LULUS' }
    });

    // 2. Migrate to Member table (upsert by nisn)
    for (const c of lulusList) {
      let plainPassword = c.plainPassword;
      let password = c.password;

      // If the candidate does not have a generated password, create a random 6-digit one now
      if (!plainPassword || plainPassword === 'pikr2024') {
        plainPassword = Math.floor(100000 + Math.random() * 900000).toString();
        password = await bcrypt.hash(plainPassword, 10);
      }

      await prisma.member.upsert({
        where: { nisn: c.nisn },
        update: {
          name: c.name,
          className: c.className,
          whatsappNumber: c.whatsappNumber,
          email: c.email,
          gender: c.gender,
          asalSekolah: c.asalSekolah,
          password,
          plainPassword,
          status: 'ACTIVE',
        },
        create: {
          nisn: c.nisn,
          name: c.name,
          className: c.className,
          whatsappNumber: c.whatsappNumber,
          email: c.email,
          gender: c.gender,
          asalSekolah: c.asalSekolah,
          password,
          plainPassword,
          status: 'ACTIVE',
          joinYear: currentYear,
          role: 'member',
        }
      });
    }

    // 3. Clear all Candidates (clean slate for next session)
    await prisma.candidate.deleteMany({});

    // 4. Mark session as closed
    await prisma.setting.upsert({
      where: { key: 'REGISTRATION_SESSION' },
      update: { value: JSON.stringify({ status: 'closed', closedAt: new Date().toISOString(), migratedCount: lulusList.length }) },
      create: { key: 'REGISTRATION_SESSION', value: JSON.stringify({ status: 'closed', closedAt: new Date().toISOString(), migratedCount: lulusList.length }) }
    });

    // 5. Auto-alumni check for all members
    const threeYearsAgo = currentYear - 3;
    await prisma.member.updateMany({
      where: { joinYear: { lte: threeYearsAgo }, status: 'ACTIVE' },
      data: { status: 'ALUMNI' }
    });

    return res.json({
      message: `Sesi berhasil ditutup. ${lulusList.length} calon anggota dipindahkan ke Member, ${lulusList.length - (await prisma.member.count({ where: { status: 'ACTIVE' } }))} anggota dijadikan alumni.`,
      migratedCount: lulusList.length
    });
  } catch (error) {
    console.error('Error closing session:', error);
    return res.status(500).json({ message: 'Gagal menutup sesi pendaftaran' });
  }
}

// 14. Open New Registration Session
export async function openSession(req, res) {
  try {
    await prisma.setting.upsert({
      where: { key: 'REGISTRATION_SESSION' },
      update: { value: JSON.stringify({ status: 'open', openedAt: new Date().toISOString() }) },
      create: { key: 'REGISTRATION_SESSION', value: JSON.stringify({ status: 'open', openedAt: new Date().toISOString() }) }
    });

    return res.json({ message: 'Sesi pendaftaran baru berhasil dibuka.' });
  } catch (error) {
    console.error('Error opening session:', error);
    return res.status(500).json({ message: 'Gagal membuka sesi pendaftaran' });
  }
}

// ─────────────────────────────────────────────────
// MEMBER CRUD
// ─────────────────────────────────────────────────

// 15. Get All Members (with auto-alumni check)
export async function getMembers(req, res) {
  const currentYear = new Date().getFullYear();
  const threeYearsAgo = currentYear - 3;
  try {
    // Auto-update alumni status
    await prisma.member.updateMany({
      where: { joinYear: { lte: threeYearsAgo }, status: 'ACTIVE' },
      data: { status: 'ALUMNI' }
    });

    const { status } = req.query;
    const members = await prisma.member.findMany({
      where: status ? { status } : undefined,
      orderBy: { joinYear: 'desc' }
    });
    return res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return res.status(500).json({ message: 'Gagal mengambil data anggota' });
  }
}

// 15.5 Create Member manually
export async function createMember(req, res) {
  const { nisn, name, className, whatsappNumber, email, gender, role, status, asalSekolah } = req.body;
  const currentYear = new Date().getFullYear();

  if (!nisn || !name || !className || !whatsappNumber || !email || !gender || !asalSekolah) {
    return res.status(400).json({ message: 'Semua field keanggotaan wajib diisi' });
  }

  try {
    // Check if duplicate NISN
    const existing = await prisma.member.findUnique({ where: { nisn } });
    if (existing) {
      return res.status(400).json({ message: 'NISN sudah terdaftar sebagai anggota tetap' });
    }

    // Generate random 6-digit password
    const plainPassword = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const member = await prisma.member.create({
      data: {
        nisn,
        name,
        className,
        whatsappNumber,
        email,
        gender,
        asalSekolah,
        password: hashedPassword,
        plainPassword,
        status: status || 'ACTIVE',
        joinYear: currentYear,
        role: role || 'member'
      }
    });

    // If role is a leadership role, automatically create an OrgMember entry
    if (role && role !== 'member') {
      // Unset previous active OrgMember with same role if it exists
      if (role !== 'KABINET') {
        await prisma.orgMember.updateMany({ where: { role, isCurrent: true }, data: { isCurrent: false } });
      }

      // Determine default specific position (jabatan)
      let jabatan = 'Pengurus';
      if (role === 'PEMBINA') jabatan = 'Pembina';
      else if (role === 'KETUA') jabatan = 'Ketua Umum';
      else if (role === 'WAKIL') jabatan = 'Wakil Ketua';

      await prisma.orgMember.create({
        data: {
          name,
          role,
          jabatan,
          yearStart: currentYear,
          isCurrent: true
        }
      });
    }

    return res.status(201).json({ message: 'Anggota berhasil ditambahkan secara manual', member });
  } catch (error) {
    console.error('Error creating member:', error);
    return res.status(500).json({ message: 'Gagal menambahkan anggota secara manual' });
  }
}

// 16. Update Member
export async function updateMember(req, res) {
  const { id } = req.params;
  const { name, className, whatsappNumber, email, gender, status, role, plainPassword, asalSekolah } = req.body;
  try {
    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) return res.status(404).json({ message: 'Anggota tidak ditemukan' });

    const updateData = {
      name: name ?? member.name,
      className: className ?? member.className,
      whatsappNumber: whatsappNumber ?? member.whatsappNumber,
      email: email ?? member.email,
      gender: gender ?? member.gender,
      asalSekolah: asalSekolah ?? member.asalSekolah,
      status: status ?? member.status,
      role: role ?? member.role,
    };

    if (plainPassword) {
      updateData.plainPassword = plainPassword;
      updateData.password = await bcrypt.hash(plainPassword, 10);
    }

    const updated = await prisma.member.update({ where: { id }, data: updateData });
    return res.json({ message: 'Data anggota berhasil diperbarui', member: updated });
  } catch (error) {
    console.error('Error updating member:', error);
    return res.status(500).json({ message: 'Gagal memperbarui data anggota' });
  }
}

// 17. Delete Member
export async function deleteMember(req, res) {
  const { id } = req.params;
  try {
    await prisma.member.delete({ where: { id } });
    return res.json({ message: 'Anggota berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting member:', error);
    return res.status(500).json({ message: 'Gagal menghapus anggota' });
  }
}

// ─────────────────────────────────────────────────
// ORG MEMBER CRUD
// ─────────────────────────────────────────────────

// 18. Get Org Members
export async function getOrgMembers(req, res) {
  try {
    const members = await prisma.orgMember.findMany({ orderBy: [{ yearStart: 'desc' }, { role: 'asc' }] });
    return res.json(members);
  } catch (error) {
    console.error('Error fetching org members:', error);
    return res.status(500).json({ message: 'Gagal mengambil data struktur organisasi' });
  }
}

// 19. Create Org Member
export async function createOrgMember(req, res) {
  const { name, role, jabatan, yearStart, yearEnd, isCurrent, quote, memberId } = req.body;
  const photoPath = req.file ? `/uploads/photos/${req.file.filename}` : null;
  
  let finalName = name;
  let memberRecord = null;
  try {
    if (memberId) {
      memberRecord = await prisma.member.findUnique({ where: { id: memberId } });
      if (memberRecord) {
        finalName = memberRecord.name;
      }
    }

    if (!finalName || !role || !jabatan || !yearStart) {
      return res.status(400).json({ message: 'Nama/Anggota, role, jabatan, dan tahun mulai wajib diisi' });
    }

    // If isCurrent, unset previous isCurrent for same role
    if (isCurrent === 'true' || isCurrent === true) {
      await prisma.orgMember.updateMany({ where: { role, isCurrent: true }, data: { isCurrent: false } });
    }
    const org = await prisma.orgMember.create({
      data: {
        name: finalName, role, jabatan,
        yearStart: parseInt(yearStart),
        yearEnd: yearEnd ? parseInt(yearEnd) : null,
        isCurrent: isCurrent === 'true' || isCurrent === true,
        photoPath,
        quote: quote || null
      }
    });

    // Sync member role if linked
    if (memberRecord) {
      await prisma.member.update({
        where: { id: memberId },
        data: { role }
      });
    }

    return res.status(201).json({ message: 'Anggota organisasi berhasil ditambahkan', org });
  } catch (error) {
    console.error('Error creating org member:', error);
    return res.status(500).json({ message: 'Gagal menambahkan anggota organisasi' });
  }
}

// 20. Update Org Member
export async function updateOrgMember(req, res) {
  const { id } = req.params;
  const { name, role, jabatan, yearStart, yearEnd, isCurrent, quote } = req.body;
  try {
    const existing = await prisma.orgMember.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Data tidak ditemukan' });

    const photoPath = req.file ? `/uploads/photos/${req.file.filename}` : existing.photoPath;

    if (isCurrent === 'true' || isCurrent === true) {
      await prisma.orgMember.updateMany({
        where: { role: role || existing.role, isCurrent: true, id: { not: id } },
        data: { isCurrent: false }
      });
    }

    const updated = await prisma.orgMember.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        role: role ?? existing.role,
        jabatan: jabatan ?? existing.jabatan,
        yearStart: yearStart ? parseInt(yearStart) : existing.yearStart,
        yearEnd: yearEnd ? parseInt(yearEnd) : existing.yearEnd,
        isCurrent: isCurrent !== undefined ? (isCurrent === 'true' || isCurrent === true) : existing.isCurrent,
        photoPath,
        quote: quote !== undefined ? quote : existing.quote,
      }
    });

    // Sync member role if name matches an active member
    if (role && role !== existing.role) {
      const correspondingMember = await prisma.member.findFirst({
        where: { name: name ?? existing.name, status: 'ACTIVE' }
      });
      if (correspondingMember) {
        await prisma.member.update({
          where: { id: correspondingMember.id },
          data: { role }
        });
      }
    }

    return res.json({ message: 'Data organisasi berhasil diperbarui', org: updated });
  } catch (error) {
    console.error('Error updating org member:', error);
    return res.status(500).json({ message: 'Gagal memperbarui data organisasi' });
  }
}

// 21. Delete Org Member
export async function deleteOrgMember(req, res) {
  const { id } = req.params;
  try {
    await prisma.orgMember.delete({ where: { id } });
    return res.json({ message: 'Data organisasi berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting org member:', error);
    return res.status(500).json({ message: 'Gagal menghapus data organisasi' });
  }
}

// ─────────────────────────────────────────────────
// ALUMNI TESTIMONIALS CRUD
// ─────────────────────────────────────────────────

// 22. Get Testimonials
export async function getTestimonials(req, res) {
  try {
    const testimonials = await prisma.alumniTestimonial.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json(testimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return res.status(500).json({ message: 'Gagal mengambil data testimoni' });
  }
}

// 23. Create Testimonial
export async function createTestimonial(req, res) {
  const { name, angkatan, content } = req.body;
  const photoPath = req.file ? `/uploads/photos/${req.file.filename}` : null;
  if (!name || !content) return res.status(400).json({ message: 'Nama dan isi testimoni wajib diisi' });
  try {
    const t = await prisma.alumniTestimonial.create({
      data: { name, angkatan: angkatan || '', photoPath, content }
    });
    return res.status(201).json({ message: 'Testimoni berhasil ditambahkan', testimonial: t });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    return res.status(500).json({ message: 'Gagal menambahkan testimoni' });
  }
}

// 24. Update Testimonial
export async function updateTestimonial(req, res) {
  const { id } = req.params;
  const { name, angkatan, content } = req.body;
  try {
    const existing = await prisma.alumniTestimonial.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Testimoni tidak ditemukan' });
    const photoPath = req.file ? `/uploads/photos/${req.file.filename}` : existing.photoPath;
    const updated = await prisma.alumniTestimonial.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        angkatan: angkatan ?? existing.angkatan,
        photoPath,
        content: content ?? existing.content,
      }
    });
    return res.json({ message: 'Testimoni berhasil diperbarui', testimonial: updated });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return res.status(500).json({ message: 'Gagal memperbarui testimoni' });
  }
}

// 25. Delete Testimonial
export async function deleteTestimonial(req, res) {
  const { id } = req.params;
  try {
    await prisma.alumniTestimonial.delete({ where: { id } });
    return res.json({ message: 'Testimoni berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return res.status(500).json({ message: 'Gagal menghapus testimoni' });
  }
}

// 26. Admin Users CRUD
export async function getAdminUsers(req, res) {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ users: admins });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return res.status(500).json({ message: 'Gagal memuat daftar admin' });
  }
}

export async function createAdminUser(req, res) {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Username, password, dan role wajib diisi' });
  }

  try {
    const existing = await prisma.admin.findUnique({ where: { username } });
    if (existing) {
      return res.status(400).json({ message: 'Username sudah digunakan' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        role
      }
    });

    return res.status(201).json({
      message: 'User admin berhasil dibuat',
      user: { id: newUser.id, username: newUser.username, role: newUser.role }
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    return res.status(500).json({ message: 'Gagal membuat user admin' });
  }
}

export async function updateAdminUser(req, res) {
  const { id } = req.params;
  const { username, password, role } = req.body;

  try {
    const existing = await prisma.admin.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'User admin tidak ditemukan' });
    }

    if (username && username !== existing.username) {
      const taken = await prisma.admin.findUnique({ where: { username } });
      if (taken) {
        return res.status(400).json({ message: 'Username sudah digunakan' });
      }
    }

    const data = {
      username: username ?? existing.username,
      role: role ?? existing.role
    };

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.admin.update({
      where: { id },
      data
    });

    return res.json({
      message: 'User admin berhasil diperbarui',
      user: { id: updated.id, username: updated.username, role: updated.role }
    });
  } catch (error) {
    console.error('Error updating admin user:', error);
    return res.status(500).json({ message: 'Gagal memperbarui user admin' });
  }
}

export async function deleteAdminUser(req, res) {
  const { id } = req.params;

  try {
    const existing = await prisma.admin.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'User admin tidak ditemukan' });
    }

    if (existing.username === 'pikrmanseku01') {
      return res.status(400).json({ message: 'Akun developer utama tidak dapat dihapus' });
    }

    if (req.admin.id === id) {
      return res.status(400).json({ message: 'Anda tidak dapat menghapus akun Anda sendiri' });
    }

    await prisma.admin.delete({ where: { id } });
    return res.json({ message: 'User admin berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    return res.status(500).json({ message: 'Gagal menghapus user admin' });
  }
}

// 27. File Manager
export async function getUploadedFiles(req, res) {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const uploadsDir = path.join(__dirname, '../../public/uploads');

    const subdirs = ['photos', 'blog', 'logos'];
    let allFiles = [];

    subdirs.forEach(subdir => {
      const dirPath = path.join(uploadsDir, subdir);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
          const filePath = path.join(dirPath, file);
          const stat = fs.statSync(filePath);
          if (stat.isFile()) {
            allFiles.push({
              name: file,
              path: `/uploads/${subdir}/${file}`,
              size: stat.size,
              createdAt: stat.birthtime,
              category: subdir
            });
          }
        });
      }
    });

    allFiles.sort((a, b) => b.createdAt - a.createdAt);
    return res.json({ files: allFiles });
  } catch (error) {
    console.error('Error listing files:', error);
    return res.status(500).json({ message: 'Gagal memuat daftar file' });
  }
}

export async function deleteUploadedFile(req, res) {
  const { filePath } = req.body;
  if (!filePath || !filePath.startsWith('/uploads/')) {
    return res.status(400).json({ message: 'Path file tidak valid' });
  }

  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const absolutePath = path.join(__dirname, '../../public', filePath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      return res.json({ message: 'File berhasil dihapus' });
    } else {
      return res.status(404).json({ message: 'File tidak ditemukan di disk' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ message: 'Gagal menghapus file' });
  }
}

