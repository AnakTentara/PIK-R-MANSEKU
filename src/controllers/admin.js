import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import XLSX from 'xlsx';
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
      { id: admin.id, username: admin.username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login berhasil',
      token,
      admin: { id: admin.id, username: admin.username }
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
  const { nisn, name, className, whatsappNumber, email, gender, reason, status } = req.body;

  if (!nisn || !name || !className || !whatsappNumber || !email || !gender) {
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
  const { nisn, name, className, whatsappNumber, email, gender, reason, status } = req.body;

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

    const updated = await prisma.candidate.update({
      where: { id },
      data: {
        nisn: nisn ?? candidate.nisn,
        name: name ?? candidate.name,
        className: className ?? candidate.className,
        whatsappNumber: whatsappNumber ?? candidate.whatsappNumber,
        email: email ?? candidate.email,
        gender: gender ?? candidate.gender,
        reason: reason ?? candidate.reason,
        status: status ?? candidate.status
      }
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
    const mysqlSetting = await prisma.setting.findUnique({ where: { key: 'MYSQL_CONFIG' } });
    const smtpSetting = await prisma.setting.findUnique({ where: { key: 'SMTP_CONFIG' } });

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
      smtp
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    return res.status(500).json({ message: 'Gagal mengambil data pengaturan' });
  }
}

// 12. Save Settings
export async function saveSettings(req, res) {
  const { mysql, smtp } = req.body;

  try {
    // 1. Save to Setting table
    if (mysql) {
      await prisma.setting.upsert({
        where: { key: 'MYSQL_CONFIG' },
        update: { value: JSON.stringify(mysql) },
        create: { key: 'MYSQL_CONFIG', value: JSON.stringify(mysql) }
      });
    }

    if (smtp) {
      await prisma.setting.upsert({
        where: { key: 'SMTP_CONFIG' },
        update: { value: JSON.stringify(smtp) },
        create: { key: 'SMTP_CONFIG', value: JSON.stringify(smtp) }
      });
    }

    // 2. Re-initialize database connection dynamically
    const initResult = await initDatabase();

    return res.json({
      message: 'Pengaturan berhasil disimpan dan sistem database diperbarui',
      provider: initResult.provider
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return res.status(500).json({ message: 'Gagal menyimpan pengaturan' });
  }
}
