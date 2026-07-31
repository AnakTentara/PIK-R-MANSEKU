import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma, { initDatabase, getDbProvider } from '../config/db.js';
import { sendBulkNotifications } from '../services/notification.js';
import { isMemberExpired } from '../utils/memberUtils.js';
import { toTitleCase } from '../utils/nameUtils.js';
import { sendWhatsApp, sendWhatsAppWithAttachments } from '../services/whatsapp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  const { nisn, name, className, whatsappNumber, email, gender, reason, status, plainPassword, asalSekolah, selectionDay, selectionDate, selectionNotified, attendanceStatus } = req.body;

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

    if (selectionDay !== undefined) updateData.selectionDay = selectionDay;
    if (selectionDate !== undefined) updateData.selectionDate = selectionDate ? new Date(selectionDate) : null;
    if (selectionNotified !== undefined) updateData.selectionNotified = Boolean(selectionNotified);
    
    if (attendanceStatus !== undefined) {
      updateData.attendanceStatus = attendanceStatus;
      if (attendanceStatus === 'TIDAK_HADIR') {
        updateData.status = 'TIDAK_LULUS';
      } else if (attendanceStatus === 'HADIR' && candidate.status === 'TIDAK_LULUS') {
        updateData.status = 'PENDING';
      } else if (attendanceStatus === 'BELUM_KONFIRMASI' && candidate.status === 'TIDAK_LULUS') {
        updateData.status = 'PENDING';
      }
    }

    if (req.file) {
      updateData.photoPath = `/uploads/photos/${req.file.filename}`;
    }

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

    return res.json({ message: 'Pendaftar berhasil diperbarui', candidate: updated });
  } catch (error) {
    console.error('Error updating candidate:', error);
    return res.status(500).json({ message: 'Gagal memperbarui pendaftar' });
  }
}

// 5b. Batch Update Candidate Attendance Status
export async function batchUpdateAttendance(req, res) {
  const { candidateIds, attendanceStatus } = req.body;

  if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
    return res.status(400).json({ message: 'Daftar ID kandidat tidak boleh kosong' });
  }

  if (!['HADIR', 'TIDAK_HADIR', 'BELUM_KONFIRMASI'].includes(attendanceStatus)) {
    return res.status(400).json({ message: 'Status kehadiran tidak valid' });
  }

  try {
    const updateData = { attendanceStatus };
    if (attendanceStatus === 'TIDAK_HADIR') {
      updateData.status = 'TIDAK_LULUS';
    } else if (attendanceStatus === 'HADIR') {
      updateData.status = 'PENDING';
    }

    await prisma.candidate.updateMany({
      where: { id: { in: candidateIds } },
      data: updateData
    });

    const statusLabel = attendanceStatus === 'HADIR' ? 'HADIR' : (attendanceStatus === 'TIDAK_HADIR' ? 'TIDAK HADIR (Otomatis Tidak Lulus)' : 'BELUM PRESENSI');
    return res.json({
      message: `${candidateIds.length} peserta berhasil ditandai ${statusLabel}.`,
      count: candidateIds.length
    });
  } catch (error) {
    console.error('Error batch updating attendance:', error);
    return res.status(500).json({ message: 'Gagal memperbarui presensi peserta' });
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

// 9. Export Candidates to Excel using styled template file with ExcelJS
export async function exportExcel(req, res) {
  try {
    const currentYear = new Date().getFullYear();
    const templatePath1 = path.join(__dirname, '../../public/file/pendaftaran/xlsx/[this_year]-REKAP_DATA_PENDAFTARAN_PIK-R_MANSEKU.xlsx');
    const templatePath2 = path.join(__dirname, `../../public/file/pendaftaran/xlsx/${currentYear}-REKAP_DATA_PENDAFTARAN_PIK-R_MANSEKU.xlsx`);
    const finalTemplatePath = fs.existsSync(templatePath1) ? templatePath1 : (fs.existsSync(templatePath2) ? templatePath2 : null);

    const candidates = await prisma.candidate.findMany({
      orderBy: [{ className: 'asc' }, { name: 'asc' }]
    });

    let buffer;
    if (finalTemplatePath) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(finalTemplatePath);

      const worksheet = workbook.worksheets[0];
      if (worksheet) {
        worksheet.name = String(currentYear);

        // Update A2 title text
        const cellA2 = worksheet.getCell('A2');
        cellA2.value = `TAHUN ${currentYear}`;

        // Populate candidate data rows starting at Row 4 (1-indexed)
        candidates.forEach((c, index) => {
          const rowNum = 4 + index;
          const row = worksheet.getRow(rowNum);
          const formattedName = toTitleCase(c.name || '');

          const values = [
            index + 1,
            c.nisn || '',
            formattedName,
            c.className || '',
            c.gender || '',
            c.whatsappNumber || '',
            c.email || '',
            c.status || 'PENDING',
            c.plainPassword || '-',
            c.emailNotified ? 'Ya' : 'Belum',
            c.waNotified ? 'Ya' : 'Belum',
            c.createdAt ? new Date(c.createdAt).toLocaleDateString('id-ID') : '-'
          ];

          values.forEach((val, colIdx) => {
            const cell = row.getCell(colIdx + 1);
            cell.value = val;
          });

          row.commit();
        });

        // Clear placeholder text in remaining rows up to 1000 without clearing cell styles
        for (let r = 4 + candidates.length; r <= 1000; r++) {
          const row = worksheet.getRow(r);
          for (let colIdx = 1; colIdx <= 12; colIdx++) {
            const cell = row.getCell(colIdx);
            if (cell.value !== null && cell.value !== undefined) {
              cell.value = null;
            }
          }
        }
      }

      buffer = await workbook.xlsx.writeBuffer();
    } else {
      const data = candidates.map((c, index) => ({
        'No': index + 1,
        'NISN': c.nisn,
        'Nama': toTitleCase(c.name),
        'Kelas': c.className,
        'Jenis Kelamin': c.gender,
        'No. WhatsApp': c.whatsappNumber,
        'Email': c.email,
        'Status Kelulusan': c.status,
        'Password Akun': c.plainPassword || '-',
        'Sudah Email': c.emailNotified ? 'Ya' : 'Belum',
        'Sudah WA': c.waNotified ? 'Ya' : 'Belum',
        'Tanggal Daftar': c.createdAt ? new Date(c.createdAt).toLocaleDateString('id-ID') : '-'
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, String(currentYear));
      buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }

    res.setHeader('Content-Disposition', `attachment; filename=${currentYear}-REKAP_DATA_PENDAFTARAN_PIK-R_MANSEKU.xlsx`);
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

// 12b. Promote single candidate directly to Member (without closing the session)
export async function promoteCandidateToMember(req, res) {
  const { id } = req.params;
  const currentYear = new Date().getFullYear();

  try {
    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (!candidate) {
      return res.status(404).json({ message: 'Pendaftar tidak ditemukan.' });
    }

    let plainPassword = candidate.plainPassword;
    let password = candidate.password;

    // Generate a fresh password if none exists
    if (!plainPassword || plainPassword === 'pikr2024') {
      plainPassword = Math.floor(100000 + Math.random() * 900000).toString();
      password = await bcrypt.hash(plainPassword, 10);
    }

    const formattedName = toTitleCase(candidate.name);

    // Upsert the member record
    await prisma.member.upsert({
      where: { nisn: candidate.nisn },
      update: {
        name: formattedName,
        className: candidate.className,
        whatsappNumber: candidate.whatsappNumber,
        email: candidate.email,
        gender: candidate.gender,
        asalSekolah: candidate.asalSekolah,
        password,
        plainPassword,
        status: 'ACTIVE',
      },
      create: {
        nisn: candidate.nisn,
        name: formattedName,
        className: candidate.className,
        whatsappNumber: candidate.whatsappNumber,
        email: candidate.email,
        gender: candidate.gender,
        asalSekolah: candidate.asalSekolah,
        password,
        plainPassword,
        status: 'ACTIVE',
        joinYear: currentYear,
        role: 'member',
      },
    });

    // Remove from candidates table
    await prisma.candidate.delete({ where: { id } });

    // Send automatic WA congratulation notification
    try {
      const waMsg = `🎉 *SELAMAT ${formattedName.toUpperCase()}!*\n\nKamu telah resmi dinyatakan *LULUS* dan dipromosikan sebagai *Anggota PIK-R MANSEKU*.\n\nSilakan cek status kelulusan dan kredensial akun kamu melalui tautan di bawah ini:\n🔗 https://pikr-manseku.my.id/cek-kelulusan\n\nSelamat bergabung di keluarga besar PIK-R MANSEKU! 💪`;
      await sendWhatsApp(candidate.whatsappNumber, waMsg);
    } catch (waErr) {
      console.error('Gagal mengirim WA promosi anggota:', waErr);
    }

    return res.json({
      message: `${formattedName} berhasil dipindahkan ke Anggota PIK-R dan pesan WhatsApp telah dikirim.`,
      memberId: candidate.nisn,
    });
  } catch (error) {
    console.error('Error promoting candidate to member:', error);
    return res.status(500).json({ message: 'Gagal memindahkan pendaftar ke anggota.' });
  }
}

// 13. Close Registration Session → migrate LULUS → Member, clear Candidates
export async function closeSession(req, res) {
  const currentYear = new Date().getFullYear();
  try {
    // 1. Fetch all LULUS candidates
    const lulusList = await prisma.candidate.findMany({
      where: { status: 'LULUS' }
    });

    // 2. Migrate to Member table menggunakan $transaction (atomik — gagal satu = semua rollback)
    await prisma.$transaction(
      lulusList.map(c => {
        const plainPassword = (!c.plainPassword || c.plainPassword === 'pikr2024')
          ? Math.floor(100000 + Math.random() * 900000).toString()
          : c.plainPassword;
        // Note: password sudah pasti ter-hash dari proses sebelumnya
        const password = c.password || '';
        const formattedName = toTitleCase(c.name);
        return prisma.member.upsert({
          where: { nisn: c.nisn },
          update: {
            name: formattedName, className: c.className,
            whatsappNumber: c.whatsappNumber, email: c.email,
            gender: c.gender, asalSekolah: c.asalSekolah,
            password, plainPassword, status: 'ACTIVE',
          },
          create: {
            nisn: c.nisn, name: formattedName, className: c.className,
            whatsappNumber: c.whatsappNumber, email: c.email,
            gender: c.gender, asalSekolah: c.asalSekolah,
            password, plainPassword, status: 'ACTIVE',
            joinYear: currentYear, role: 'member',
          },
        });
      })
    );

    // 3. Clear all Candidates (clean slate for next session)
    await prisma.candidate.deleteMany({});

    // 4. Mark session as closed
    await prisma.setting.upsert({
      where: { key: 'REGISTRATION_SESSION' },
      update: { value: JSON.stringify({ status: 'closed', closedAt: new Date().toISOString(), migratedCount: lulusList.length }) },
      create: { key: 'REGISTRATION_SESSION', value: JSON.stringify({ status: 'closed', closedAt: new Date().toISOString(), migratedCount: lulusList.length }) }
    });

    // 5. Auto-alumni menggunakan updateMany (1 query, tidak N+1)
    const currentYear2 = new Date().getFullYear();
    await prisma.member.updateMany({
      where: {
        status: 'ACTIVE',
        NOT: { role: 'PEMBINA' },
        OR: [
          { className: { startsWith: 'XII' }, joinYear: { lte: currentYear2 - 1 } },
          { className: { startsWith: '12' },  joinYear: { lte: currentYear2 - 1 } },
          { className: { startsWith: 'XI' },  joinYear: { lte: currentYear2 - 2 } },
          { className: { startsWith: '11' },  joinYear: { lte: currentYear2 - 2 } },
          { joinYear: { lte: currentYear2 - 3 } },
        ]
      },
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

// 15. Get All Members (with auto-alumni check via updateMany — efisien 1 query)
export async function getMembers(req, res) {
  try {
    const currentYear = new Date().getFullYear();

    // Auto-update alumni: gunakan updateMany agar tidak N+1 query per anggota
    await prisma.member.updateMany({
      where: {
        status: 'ACTIVE',
        NOT: { role: 'PEMBINA' },
        OR: [
          { className: { startsWith: 'XII' }, joinYear: { lte: currentYear - 1 } },
          { className: { startsWith: '12' },  joinYear: { lte: currentYear - 1 } },
          { className: { startsWith: 'XI' },  joinYear: { lte: currentYear - 2 } },
          { className: { startsWith: '11' },  joinYear: { lte: currentYear - 2 } },
          { joinYear: { lte: currentYear - 3 } }, // default: Kelas X / 3 tahun
        ]
      },
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
  const { nisn, name, className, whatsappNumber, email, gender, role, status, asalSekolah, plainPassword: customPassword } = req.body;
  const currentYear = new Date().getFullYear();

  const isPembina = role === 'PEMBINA';
  const resolvedClassName = isPembina ? (className || 'Pembina') : className;
  const resolvedAsalSekolah = asalSekolah || '-';
  const resolvedNisn = (nisn && nisn.trim()) ? nisn.trim() : (isPembina ? null : null);

  if (!isPembina && !resolvedNisn) {
    return res.status(400).json({ message: 'NISN wajib diisi untuk anggota biasa' });
  }

  if (!name || !whatsappNumber || !email || !gender) {
    return res.status(400).json({ message: 'Nama, Nomor WhatsApp, Email, dan Jenis Kelamin wajib diisi' });
  }

  try {
    // Check if duplicate NISN if NISN is provided
    if (resolvedNisn) {
      const existing = await prisma.member.findUnique({ where: { nisn: resolvedNisn } });
      if (existing) {
        return res.status(400).json({ message: 'NISN sudah terdaftar sebagai anggota tetap' });
      }
    }

    // Password handling
    const plainPassword = customPassword && customPassword.trim() 
      ? customPassword.trim() 
      : Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const photoPath = req.file ? `/uploads/photos/${req.file.filename}` : null;

    const member = await prisma.member.create({
      data: {
        nisn: resolvedNisn,
        name,
        className: resolvedClassName,
        whatsappNumber,
        email,
        gender,
        asalSekolah: resolvedAsalSekolah,
        password: hashedPassword,
        plainPassword,
        photoPath,
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
  const { name, className, whatsappNumber, email, gender, status, role, plainPassword, asalSekolah, joinYear } = req.body;
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

    // Handle joinYear update
    if (joinYear !== undefined && joinYear !== '') {
      updateData.joinYear = parseInt(joinYear);
    }

    // Handle photo upload
    if (req.file) {
      updateData.photoPath = `/uploads/photos/${req.file.filename}`;
    }

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

// 18. Get Org Members (includes linked Member data)
export async function getOrgMembers(req, res) {
  try {
    const members = await prisma.orgMember.findMany({
      orderBy: [{ yearStart: 'desc' }, { role: 'asc' }],
      include: {
        member: {
          select: { id: true, name: true, photoPath: true, className: true, status: true, role: true, nisn: true }
        }
      }
    });
    // Normalize: if linked member has a photo, use it as the effective photo
    const normalized = members.map((m) => ({
      ...m,
      effectivePhoto: (m.member?.photoPath) || m.photoPath || null,
    }));
    return res.json(normalized);
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

    // Determine finalIsCurrent automatically based on yearEnd and current year
    const currentYear = new Date().getFullYear();
    const parsedYearEnd = yearEnd ? parseInt(yearEnd) : null;
    let finalIsCurrent = isCurrent === 'true' || isCurrent === true;
    
    if (parsedYearEnd) {
      if (parsedYearEnd >= currentYear) {
        finalIsCurrent = true;
      } else {
        finalIsCurrent = false;
      }
    }

    const org = await prisma.orgMember.create({
      data: {
        name: finalName, role, jabatan,
        yearStart: parseInt(yearStart),
        yearEnd: parsedYearEnd,
        isCurrent: finalIsCurrent,
        photoPath,       // stored only for orphan entries
        quote: quote || null,
        memberId: memberId || null,  // FK link to Member account
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
  const { name, role, jabatan, yearStart, yearEnd, isCurrent, quote, memberId } = req.body;
  try {
    const existing = await prisma.orgMember.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Data tidak ditemukan' });

    const photoPath = req.file ? `/uploads/photos/${req.file.filename}` : existing.photoPath;

    // Determine finalIsCurrent automatically based on yearEnd and current year
    const currentYear = new Date().getFullYear();
    const parsedYearEnd = yearEnd !== undefined ? (yearEnd ? parseInt(yearEnd) : null) : existing.yearEnd;
    let finalIsCurrent = isCurrent !== undefined ? (isCurrent === 'true' || isCurrent === true) : existing.isCurrent;
    
    if (parsedYearEnd) {
      if (parsedYearEnd >= currentYear) {
        finalIsCurrent = true;
      } else {
        finalIsCurrent = false;
      }
    }

    // Resolve memberId: use sent value, fall back to existing
    let resolvedMemberId = existing.memberId;
    let memberRecord = null;
    if (memberId === '' || memberId === 'NONE') {
      resolvedMemberId = null; // explicitly unlink
    } else if (memberId && memberId !== 'MANUAL') {
      memberRecord = await prisma.member.findUnique({ where: { id: memberId } });
      if (memberRecord) {
        resolvedMemberId = memberId;
      }
    }

    const updated = await prisma.orgMember.update({
      where: { id },
      data: {
        name: (memberRecord ? memberRecord.name : name) ?? existing.name,
        role: role ?? existing.role,
        jabatan: jabatan ?? existing.jabatan,
        yearStart: yearStart ? parseInt(yearStart) : existing.yearStart,
        yearEnd: parsedYearEnd,
        isCurrent: finalIsCurrent,
        photoPath,
        quote: quote !== undefined ? quote : existing.quote,
        memberId: resolvedMemberId,
      }
    });

    // Sync member role if linked member has a changed role
    const effectiveRole = role ?? existing.role;
    if (memberRecord && effectiveRole !== memberRecord.role) {
      await prisma.member.update({
        where: { id: resolvedMemberId },
        data: { role: effectiveRole }
      });
    } else if (!memberRecord && role && role !== existing.role) {
      // Fallback: still try name-match if no FK (backward compat for old entries)
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

    if (existing.username === 'pikr-manseku') {
      return res.status(400).json({ message: 'Akun developer utama tidak dapat dihapus' });
    }

    if (req.admin.id === id) {
      return res.status(400).json({ message: 'Anda tidak dapat menghapus akun Anda sendiri' });
    }

    // Reassign any posts authored by this admin to the master developer admin
    const masterDev = await prisma.admin.findUnique({ where: { username: 'pikr-manseku' } });
    if (masterDev) {
      await prisma.post.updateMany({
        where: { authorId: id },
        data: { authorId: masterDev.id }
      });
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
    // 1. Check if used in Web Editor settings
    const webSetting = await prisma.setting.findUnique({ where: { key: 'WEB_EDITOR_CONFIG' } });
    if (webSetting && webSetting.value) {
      try {
        const config = JSON.parse(webSetting.value);
        if (config.hero?.webLogoUrl === filePath || config.hero?.navbarLogoUrl === filePath) {
          return res.status(400).json({ 
            message: 'File ini sedang digunakan sebagai Logo Website atau Logo Navbar. Harap ganti logo terlebih dahulu di Web Editor sebelum menghapusnya.' 
          });
        }
      } catch (err) {
        console.error('Error parsing web config:', err);
      }
    }

    // 2. Check if used in Org Members
    const isUsedInOrg = await prisma.orgMember.findFirst({ where: { photoPath: filePath } });
    if (isUsedInOrg) {
      return res.status(400).json({ 
        message: `File ini sedang digunakan sebagai foto pengurus: ${isUsedInOrg.name}.` 
      });
    }

    // 3. Check if used in Alumni Testimonials
    const isUsedInTestimonial = await prisma.alumniTestimonial.findFirst({ where: { photoPath: filePath } });
    if (isUsedInTestimonial) {
      return res.status(400).json({ 
        message: `File ini sedang digunakan sebagai foto testimoni: ${isUsedInTestimonial.name}.` 
      });
    }

    // 4. Check if used in Members
    const isUsedInMember = await prisma.member.findFirst({ where: { photoPath: filePath } });
    if (isUsedInMember) {
      return res.status(400).json({ 
        message: `File ini sedang digunakan sebagai foto profil anggota aktif: ${isUsedInMember.name}.` 
      });
    }

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

export async function downloadBackupDb(req, res) {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const dbPath = path.join(__dirname, '../../local.db');

    if (fs.existsSync(dbPath)) {
      return res.download(dbPath, 'pikr_manseku_backup.db');
    } else {
      return res.status(404).json({ message: 'Database SQLite local.db tidak ditemukan di root server.' });
    }
  } catch (error) {
    console.error('Error backing up database:', error);
    return res.status(500).json({ message: 'Gagal membuat cadangan database' });
  }
}

export async function getDashboardStats(req, res) {
  try {
    const totalCandidates = await prisma.candidate.count();
    const passedCandidates = await prisma.candidate.count({ where: { status: 'LULUS' } });
    const notPassedCandidates = await prisma.candidate.count({ where: { status: 'TIDAK_LULUS' } });
    const pendingCandidates = await prisma.candidate.count({ where: { status: 'PENDING' } });
    
    const totalMembers = await prisma.member.count({ where: { status: 'ACTIVE' } });
    const totalNews = await prisma.post.count();
    const totalBlogPosts = await prisma.blogPost.count({ where: { status: 'PUBLISHED' } });
    const pendingBlogDrafts = await prisma.blogPost.count({ where: { status: 'DRAFT' } });

    // Recent comments count (last 7 days)
    const recentBlogCommentsCount = await prisma.blogComment.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    return res.json({
      candidates: {
        total: totalCandidates,
        passed: passedCandidates,
        notPassed: notPassedCandidates,
        pending: pendingCandidates
      },
      members: {
        active: totalMembers
      },
      blog: {
        totalNews,
        totalBlogPosts,
        pendingBlogDrafts,
        recentComments: recentBlogCommentsCount
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ message: 'Gagal mengambil statistik dashboard' });
  }
}

// ─────────────────────────────────────────────────
// SELECTION SCHEDULE & NOTIFICATION CONTROLLERS
// ─────────────────────────────────────────────────

// 21. Randomize / Assign Selection Days with specific daily quotas
export async function randomizeSelectionDays(req, res) {
  const { targetCandidateIds, dayQuotas, excludedCandidateIds } = req.body;

  if (!Array.isArray(dayQuotas) || dayQuotas.length === 0) {
    return res.status(400).json({ message: 'Daftar alokasi kuota hari seleksi wajib diisi' });
  }

  try {
    let candidateIds = targetCandidateIds;
    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      const pendingCandidates = await prisma.candidate.findMany({
        where: { status: 'PENDING' },
        select: { id: true }
      });
      candidateIds = pendingCandidates.map(c => c.id);
    }

    // Exclude candidate IDs if provided
    if (Array.isArray(excludedCandidateIds) && excludedCandidateIds.length > 0) {
      candidateIds = candidateIds.filter(id => !excludedCandidateIds.includes(id));
      
      // Update excluded candidates: clear selection schedule
      await prisma.candidate.updateMany({
        where: { id: { in: excludedCandidateIds } },
        data: { selectionDay: null, selectionDate: null }
      });
    }

    // Randomize order of selected candidate IDs
    const shuffled = [...candidateIds].sort(() => Math.random() - 0.5);

    let currentIndex = 0;
    const updates = [];

    for (const dq of dayQuotas) {
      const quota = parseInt(dq.quota) || 0;
      const assignedIds = shuffled.slice(currentIndex, currentIndex + quota);
      currentIndex += quota;

      if (assignedIds.length > 0) {
        // ... (remaining implementation omitted for brevity)
      }
    }
  } catch (error) {
    // ...
  }
}

// 22. Send Selection Notifications (WA message + optional PDF attachments)
export async function sendSelectionNotifications(req, res) {
  try {
    const { candidateIds, template, singleCandidateId, debugTargetNumber, isDebugMode } = req.body;
    let targetIds = [];

    if (singleCandidateId) {
      targetIds = [singleCandidateId];
    } else if (Array.isArray(candidateIds)) {
      targetIds = candidateIds;
    } else if (typeof candidateIds === 'string' && candidateIds.trim()) {
      try { targetIds = JSON.parse(candidateIds); }
      catch { targetIds = candidateIds.split(',').map(s => s.trim()); }
    }

    if (targetIds.length === 0) {
      const scheduled = await prisma.candidate.findMany({
        where: {
          status: 'PENDING',
          selectionDay: { not: null }
        },
        select: { id: true }
      });
      targetIds = scheduled.map(c => c.id);
    }

    const candidates = await prisma.candidate.findMany({
      where: { id: { in: targetIds } }
    });

    if (candidates.length === 0) {
      return res.status(404).json({ message: 'Tidak ada peserta yang ditemukan untuk dikirim notifikasi.' });
    }

    // Process attached files
    const attachments = [];
    if (req.files) {
      const fileList = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      for (const f of fileList) {
        attachments.push({
          path: f.path,
          filename: f.originalname,
          mimetype: f.mimetype
        });
      }
    }

    const defaultTemplate =
      `Halo {nama} ({kelas}),\n\n` +
      `Selamat! Kamu dijadwalkan untuk mengikuti *Tahap Seleksi Calon Anggota PIK-R MANSEKU* pada:\n` +
      `📅 *Hari/Tanggal:* {hari_seleksi}\n` +
      `📌 *NISN:* {nisn}\n` +
      `📍 *Lokasi:* Ruang PIK-R MAN 1 Muara Enim\n\n` +
      `Harap hadir tepat waktu dan membawa dokumen yang terlampir.\n\n` +
      `Semangat dan persiapkan dirimu sebaik mungkin! 💪`;

    const msgTemplate = (template && template.trim()) ? template : defaultTemplate;

    const isDebug = (isDebugMode === 'true' || isDebugMode === true) || Boolean(debugTargetNumber && debugTargetNumber.trim());
    const overrideNumber = (debugTargetNumber && debugTargetNumber.trim()) ? debugTargetNumber.trim() : null;

    // Helper to send candidate notification (supports Debug Mode step-by-step sequence)
    const sendCandidateNotification = async (c, destNumber) => {
      const formattedName = toTitleCase(c.name);
      const rawText = msgTemplate
        .replace(/{nama}/gi, formattedName)
        .replace(/{nisn}/gi, c.nisn)
        .replace(/{kelas}/gi, c.className)
        .replace(/{hari_seleksi}/gi, c.selectionDay || 'Sesuai Jadwal')
        .replace(/{tanggal_seleksi}/gi, c.selectionDay || 'Sesuai Jadwal');

      if (isDebug || overrideNumber) {
        // Step 1: Send candidate phone number as a standalone message (easy 1-click copy/chat)
        await sendWhatsAppWithAttachments(destNumber, `${c.whatsappNumber}`);
        await new Promise(r => setTimeout(r, 600));

        // Step 2: Send notification body text + PDF attachments
        const ok = await sendWhatsAppWithAttachments(destNumber, rawText, attachments);
        await new Promise(r => setTimeout(r, 600));

        // Step 3: Send divider line
        await sendWhatsAppWithAttachments(destNumber, `==============================`);
        return ok;
      } else {
        // Direct sending to candidate's own number
        return await sendWhatsAppWithAttachments(destNumber, rawText, attachments);
      }
    };

    // Single Candidate Notification
    if (singleCandidateId || candidates.length === 1) {
      const c = candidates[0];
      const destNumber = overrideNumber || c.whatsappNumber;

      const ok = await sendCandidateNotification(c, destNumber);
      if (ok) {
        await prisma.candidate.update({
          where: { id: c.id },
          data: { selectionNotified: true }
        });
        const targetLabel = overrideNumber ? `Nomor Debug/Admin (${destNumber})` : c.name;
        return res.json({ message: `Notifikasi seleksi berhasil dikirim ke ${targetLabel}.` });
      } else {
        return res.status(500).json({ message: `Gagal mengirimkan notifikasi ke ${destNumber}. Pastikan bot WA aktif.` });
      }
    }

    // Mass Broadcast Notification
    const targetLabel = overrideNumber ? `Nomor Admin/Debug (${overrideNumber})` : `${candidates.length} nomor peserta`;
    res.json({
      message: `Proses pengiriman WA massal ke ${targetLabel} telah dimulai di latar belakang.`,
      totalCount: candidates.length
    });

    (async () => {
      console.log(`[WA Massal] Memulai pengiriman ke ${targetLabel}...`);
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];
        const destNumber = overrideNumber || c.whatsappNumber;

        try {
          const ok = await sendCandidateNotification(c, destNumber);
          if (ok) {
            successCount++;
            await prisma.candidate.update({
              where: { id: c.id },
              data: { selectionNotified: true }
            });
          } else {
            failCount++;
          }
        } catch (err) {
          console.error(`[WA Massal Error] Gagal mengirim ke ${destNumber}:`, err);
          failCount++;
        }

        const delay = overrideNumber ? 1500 : (Math.floor(Math.random() * 2000) + 3500);
        await new Promise(r => setTimeout(r, delay));

        // Extra rest pause every 5 messages
        if ((i + 1) % 5 === 0 && i < candidates.length - 1) {
          console.log(`[WA Massal] Istirahat sejenak 5 detik setelah mengirim ${i + 1} pesan...`);
          await new Promise(r => setTimeout(r, 5000));
        }
      }
      console.log(`[WA Massal Finished] Selesai! Berhasil: ${successCount}, Gagal: ${failCount}`);
    })();
  } catch (error) {
    console.error('Error sending selection notifications:', error);
    return res.status(500).json({ message: 'Gagal mengirimkan notifikasi seleksi' });
  }
}

// 23. Export Selection Schedule to Excel using styled template file from /public/file/seleksi/xlsx
export async function exportSelectionExcel(req, res) {
  try {
    const currentYear = new Date().getFullYear();
    const templatePath1 = path.join(__dirname, '../../public/file/seleksi/xlsx/[this_year]-REKAP_DATA_SELEKSI_PIK-R_MANSEKU.xlsx');
    const templatePath2 = path.join(__dirname, `../../public/file/seleksi/xlsx/${currentYear}-REKAP_DATA_SELEKSI_PIK-R_MANSEKU.xlsx`);
    const finalTemplatePath = fs.existsSync(templatePath1) ? templatePath1 : (fs.existsSync(templatePath2) ? templatePath2 : null);

    const candidates = await prisma.candidate.findMany({
      orderBy: [{ selectionDay: 'asc' }, { className: 'asc' }, { name: 'asc' }]
    });

    let buffer;
    if (finalTemplatePath) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(finalTemplatePath);

      const worksheet = workbook.worksheets[0];
      if (worksheet) {
        worksheet.name = String(currentYear);

        const cellA2 = worksheet.getCell('A2');
        cellA2.value = `TAHUN ${currentYear}`;

        // Populate candidate rows starting at Row 4 (1-indexed, Columns A to I)
        candidates.forEach((c, index) => {
          const rowNum = 4 + index;
          const row = worksheet.getRow(rowNum);
          const formattedName = toTitleCase(c.name || '');

          const values = [
            index + 1,
            c.nisn || '',
            formattedName,
            c.className || '',
            c.selectionDay || 'Belum Diatur',
            c.selectionNotified ? 'Sudah Dikirim' : 'Belum Dikirim',
            c.status || 'PENDING',
            c.whatsappNumber || '',
            c.createdAt ? new Date(c.createdAt).toLocaleDateString('id-ID') : '-'
          ];

          values.forEach((val, colIdx) => {
            const cell = row.getCell(colIdx + 1);
            cell.value = val;
          });

          row.commit();
        });

        // Clear placeholder text in remaining rows up to 1000 without clearing cell styles
        for (let r = 4 + candidates.length; r <= 1000; r++) {
          const row = worksheet.getRow(r);
          for (let colIdx = 1; colIdx <= 9; colIdx++) {
            const cell = row.getCell(colIdx);
            if (cell.value !== null && cell.value !== undefined) {
              cell.value = null;
            }
          }
        }
      }

      buffer = await workbook.xlsx.writeBuffer();
    } else {
      const data = candidates.map((c, index) => ({
        'No.': index + 1,
        'NISN': c.nisn,
        'Nama Lengkap': toTitleCase(c.name),
        'Kelas': c.className,
        'Hari Seleksi': c.selectionDay || 'Belum Diatur',
        'Status WA Notif': c.selectionNotified ? 'Sudah Dikirim' : 'Belum Dikirim',
        'Status Seleksi': c.status,
        'No. WhatsApp': c.whatsappNumber,
        'Tanggal Daftar': c.createdAt ? new Date(c.createdAt).toLocaleDateString('id-ID') : '-'
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, String(currentYear));
      buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }

    res.setHeader('Content-Disposition', `attachment; filename=${currentYear}-REKAP_DATA_SELEKSI_PIK-R_MANSEKU.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (error) {
    console.error('Error exporting selection Excel:', error);
    return res.status(500).json({ message: 'Gagal mengekspor jadwal seleksi ke Excel' });
  }
}

// --- SELECTION POS EVALUATION CONTROLLERS ---

// 1. Get Evaluators List (Members & Admins)
export async function getSelectionEvaluators(req, res) {
  try {
    const members = await prisma.member.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, className: true, role: true },
      orderBy: { name: 'asc' }
    });
    const admins = await prisma.admin.findMany({
      select: { id: true, username: true, role: true },
      orderBy: { username: 'asc' }
    });
    return res.json({ members, admins });
  } catch (error) {
    console.error('Error fetching evaluators:', error);
    return res.status(500).json({ message: 'Gagal memuat daftar penyeleksi' });
  }
}

// 2. Get Selection Scores for all candidates
export async function getSelectionScores(req, res) {
  try {
    const candidates = await prisma.candidate.findMany({
      include: { selectionScore: true },
      orderBy: [{ className: 'asc' }, { name: 'asc' }]
    });

    const data = candidates.map(c => {
      const s = c.selectionScore || {};
      return {
        candidateId: c.id,
        nisn: c.nisn,
        name: c.name,
        className: c.className,
        selectionDay: c.selectionDay,
        status: c.status,
        
        // POS 1
        pos1Evaluator: s.pos1Evaluator || '',
        pos1Comm: s.pos1Comm ?? null,
        pos1Trust: s.pos1Trust ?? null,
        pos1Motiv: s.pos1Motiv ?? null,
        pos1Komitmen: s.pos1Komitmen ?? null,
        pos1KerjaSama: s.pos1KerjaSama ?? null,
        pos1Kepemimpinan: s.pos1Kepemimpinan ?? null,
        pos1Pengetahuan: s.pos1Pengetahuan ?? null,
        pos1Etika: s.pos1Etika ?? null,
        pos1Bonus: s.pos1Bonus ?? null,
        pos1Avg: s.pos1Avg ?? null,
        pos1Completed: s.pos1Completed || false,
        pos1Notes: s.pos1Notes || '',

        // POS 2
        pos2Evaluator: s.pos2Evaluator || '',
        pos2Creativity: s.pos2Creativity ?? null,
        pos2Mastery: s.pos2Mastery ?? null,
        pos2Pres: s.pos2Pres ?? null,
        pos2Orig: s.pos2Orig ?? null,
        pos2Potency: s.pos2Potency ?? null,
        pos2Confidence: s.pos2Confidence ?? null,
        pos2Avg: s.pos2Avg ?? null,
        pos2Completed: s.pos2Completed || false,
        pos2Notes: s.pos2Notes || '',

        // POS 3
        pos3Evaluator: s.pos3Evaluator || '',
        pos3Pemahaman: s.pos3Pemahaman ?? null,
        pos3Analysis: s.pos3Analysis ?? null,
        pos3Solution: s.pos3Solution ?? null,
        pos3Empati: s.pos3Empati ?? null,
        pos3PublicSpk: s.pos3PublicSpk ?? null,
        pos3Logika: s.pos3Logika ?? null,
        pos3Pengetahuan: s.pos3Pengetahuan ?? null,
        pos3Avg: s.pos3Avg ?? null,
        pos3Completed: s.pos3Completed || false,
        pos3Notes: s.pos3Notes || '',

        // Final
        finalScore: s.finalScore ?? null,
        isCompleted: s.isCompleted || false
      };
    });

    return res.json(data);
  } catch (error) {
    console.error('Error get selection scores:', error);
    return res.status(500).json({ message: 'Gagal mengambil data nilai seleksi' });
  }
}

// Helper to compute averages
function calcAvg(arr) {
  const valid = arr.filter(v => typeof v === 'number' && !isNaN(v));
  if (valid.length === 0) return null;
  const sum = valid.reduce((a, b) => a + b, 0);
  return Math.round((sum / valid.length) * 100) / 100;
}

// 3. Update Selection Score for a Candidate
export async function updateSelectionScore(req, res) {
  const { candidateId } = req.params;
  const body = req.body;

  try {
    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) {
      return res.status(404).json({ message: 'Kandidat tidak ditemukan' });
    }

    const parseNum = (v) => (v !== undefined && v !== null && v !== '' ? parseFloat(v) : null);

    // Existing score if any
    const existing = await prisma.selectionScore.findUnique({ where: { candidateId } });

    const p1Comm = parseNum(body.pos1Comm) ?? existing?.pos1Comm ?? null;
    const p1Trust = parseNum(body.pos1Trust) ?? existing?.pos1Trust ?? null;
    const p1Motiv = parseNum(body.pos1Motiv) ?? existing?.pos1Motiv ?? null;
    const p1Komitmen = parseNum(body.pos1Komitmen) ?? existing?.pos1Komitmen ?? null;
    const p1KerjaSama = parseNum(body.pos1KerjaSama) ?? existing?.pos1KerjaSama ?? null;
    const p1Kepemimpinan = parseNum(body.pos1Kepemimpinan) ?? existing?.pos1Kepemimpinan ?? null;
    const p1Pengetahuan = parseNum(body.pos1Pengetahuan) ?? existing?.pos1Pengetahuan ?? null;
    const p1Etika = parseNum(body.pos1Etika) ?? existing?.pos1Etika ?? null;
    const p1Bonus = parseNum(body.pos1Bonus) ?? existing?.pos1Bonus ?? null;
    const pos1Avg = calcAvg([p1Comm, p1Trust, p1Motiv, p1Komitmen, p1KerjaSama, p1Kepemimpinan, p1Pengetahuan, p1Etika, p1Bonus]);

    const p2Creat = parseNum(body.pos2Creativity) ?? existing?.pos2Creativity ?? null;
    const p2Mast = parseNum(body.pos2Mastery) ?? existing?.pos2Mastery ?? null;
    const p2Pres = parseNum(body.pos2Pres) ?? existing?.pos2Pres ?? null;
    const p2Orig = parseNum(body.pos2Orig) ?? existing?.pos2Orig ?? null;
    const p2Pot = parseNum(body.pos2Potency) ?? existing?.pos2Potency ?? null;
    const p2Conf = parseNum(body.pos2Confidence) ?? existing?.pos2Confidence ?? null;
    const pos2Avg = calcAvg([p2Creat, p2Mast, p2Pres, p2Orig, p2Pot, p2Conf]);

    const p3Pemahaman = parseNum(body.pos3Pemahaman) ?? existing?.pos3Pemahaman ?? null;
    const p3Anal = parseNum(body.pos3Analysis) ?? existing?.pos3Analysis ?? null;
    const p3Sol = parseNum(body.pos3Solution) ?? existing?.pos3Solution ?? null;
    const p3Empati = parseNum(body.pos3Empati) ?? existing?.pos3Empati ?? null;
    const p3Pub = parseNum(body.pos3PublicSpk) ?? existing?.pos3PublicSpk ?? null;
    const p3Logika = parseNum(body.pos3Logika) ?? existing?.pos3Logika ?? null;
    const p3Pengetahuan = parseNum(body.pos3Pengetahuan) ?? existing?.pos3Pengetahuan ?? null;
    const pos3Avg = calcAvg([p3Pemahaman, p3Anal, p3Sol, p3Empati, p3Pub, p3Logika, p3Pengetahuan]);

    // Rata-rata 33.3% per POS
    const validAvgs = [pos1Avg, pos2Avg, pos3Avg].filter(v => v !== null);
    const finalScore = validAvgs.length > 0 ? Math.round((validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length) * 100) / 100 : null;

    const dataToSave = {
      pos1Evaluator: body.pos1Evaluator ?? existing?.pos1Evaluator ?? null,
      pos1Comm: p1Comm,
      pos1Trust: p1Trust,
      pos1Motiv: p1Motiv,
      pos1Komitmen: p1Komitmen,
      pos1KerjaSama: p1KerjaSama,
      pos1Kepemimpinan: p1Kepemimpinan,
      pos1Pengetahuan: p1Pengetahuan,
      pos1Etika: p1Etika,
      pos1Bonus: p1Bonus,
      pos1Avg,
      pos1Completed: body.pos1Completed !== undefined ? Boolean(body.pos1Completed) : (existing?.pos1Completed || false),
      pos1Notes: body.pos1Notes ?? existing?.pos1Notes ?? null,

      pos2Evaluator: body.pos2Evaluator ?? existing?.pos2Evaluator ?? null,
      pos2Creativity: p2Creat,
      pos2Mastery: p2Mast,
      pos2Pres: p2Pres,
      pos2Orig: p2Orig,
      pos2Potency: p2Pot,
      pos2Confidence: p2Conf,
      pos2Avg,
      pos2Completed: body.pos2Completed !== undefined ? Boolean(body.pos2Completed) : (existing?.pos2Completed || false),
      pos2Notes: body.pos2Notes ?? existing?.pos2Notes ?? null,

      pos3Evaluator: body.pos3Evaluator ?? existing?.pos3Evaluator ?? null,
      pos3Pemahaman: p3Pemahaman,
      pos3Analysis: p3Anal,
      pos3Solution: p3Sol,
      pos3Empati: p3Empati,
      pos3PublicSpk: p3Pub,
      pos3Logika: p3Logika,
      pos3Pengetahuan: p3Pengetahuan,
      pos3Avg,
      pos3Completed: body.pos3Completed !== undefined ? Boolean(body.pos3Completed) : (existing?.pos3Completed || false),
      pos3Notes: body.pos3Notes ?? existing?.pos3Notes ?? null,

      finalScore,
      isCompleted: body.isCompleted !== undefined ? Boolean(body.isCompleted) : (existing?.isCompleted || false)
    };

    const updatedScore = await prisma.selectionScore.upsert({
      where: { candidateId },
      create: { candidateId, ...dataToSave },
      update: dataToSave
    });

    return res.json({ message: 'Nilai seleksi berhasil diperbarui', score: updatedScore });
  } catch (error) {
    console.error('Error update selection score:', error);
    return res.status(500).json({ message: 'Gagal memperbarui nilai seleksi' });
  }
}

// 4. Toggle Lock Status ("Selesai Seleksi" / "Perbarui Nilai")
export async function toggleSelectionLock(req, res) {
  const { candidateId } = req.params;
  const { pos, isCompleted } = req.body; // pos can be 'pos1', 'pos2', 'pos3', or 'all'

  try {
    const lockVal = Boolean(isCompleted);

    const updateData = {};
    if (pos === 'pos1') updateData.pos1Completed = lockVal;
    else if (pos === 'pos2') updateData.pos2Completed = lockVal;
    else if (pos === 'pos3') updateData.pos3Completed = lockVal;
    else {
      updateData.isCompleted = lockVal;
      updateData.pos1Completed = lockVal;
      updateData.pos2Completed = lockVal;
      updateData.pos3Completed = lockVal;
    }

    const updated = await prisma.selectionScore.upsert({
      where: { candidateId },
      create: { candidateId, ...updateData },
      update: updateData
    });

    return res.json({ message: `Status penilaian berhasil di-${lockVal ? 'kunci' : 'buka'}`, score: updated });
  } catch (error) {
    console.error('Error toggle selection lock:', error);
    return res.status(500).json({ message: 'Gagal mengubah status penyerahan nilai' });
  }
}

// 5. Export POS Scores to Excel (POS 1, POS 2, POS 3, or All POS Rapor Total)
export async function exportPOSScoreExcel(req, res) {
  const { pos } = req.query; // '1', '2', '3', or 'all'
  const currentYear = new Date().getFullYear();

  try {
    const candidates = await prisma.candidate.findMany({
      include: { selectionScore: true },
      orderBy: [{ className: 'asc' }, { name: 'asc' }]
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'PIK-R MANSEKU';

    // Helper styles
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
    const fontHeader = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    const fontTitle = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF1F4E79' } };
    const thinBorder = {
      top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
    };

    // ── SHEET 1 FOR 'all': RAPOR TOTAL SELEKSI REKAP FIRST ──
    if (pos === 'all') {
      const ws = wb.addWorksheet('RAPOR TOTAL SELEKSI');
      ws.views = [{ showGridLines: true, state: 'frozen', ySplit: 4 }];

      ws.addRow(['REKAPITULASI RAPOR SELEKSI PENDAFTAR PIK-R MANSEKU']);
      ws.getCell('A1').font = fontTitle;
      ws.addRow([`RAPOR PENILAIAN AKHIR 33.3% PER POS - TAHUN ${currentYear}`]);
      ws.addRow([]);

      const headers = ['Rank', 'NISN', 'Nama Lengkap', 'Kelas', 'Rata-Rata POS 1', 'Rata-Rata POS 2', 'Rata-Rata POS 3', 'NILAI AKHIR RAPOR', 'STATUS SELEKSI', 'STATUS KELULUSAN'];
      ws.addRow(headers);

      const headerRow = ws.getRow(4);
      headerRow.height = 25;
      headers.forEach((_, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.fill = headerFill;
        cell.font = fontHeader;
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = thinBorder;
      });

      // Sort by final score descending for ranking display, exclude absent candidates
      const sortedCandidates = [...candidates]
        .filter(c => c.attendanceStatus !== 'TIDAK_HADIR')
        .sort((a, b) => {
          const scoreA = a.selectionScore?.finalScore ?? -1;
          const scoreB = b.selectionScore?.finalScore ?? -1;
          return scoreB - scoreA;
        });

      sortedCandidates.forEach((c, index) => {
        const s = c.selectionScore || {};
        ws.addRow([
          index + 1,
          c.nisn || '-',
          toTitleCase(c.name),
          c.className,
          s.pos1Avg ?? '-',
          s.pos2Avg ?? '-',
          s.pos3Avg ?? '-',
          s.finalScore ?? '-',
          s.isCompleted ? 'SELESAI' : 'BELUM LENGKAP',
          c.status
        ]);

        const r = ws.getRow(5 + index);
        for (let col = 1; col <= headers.length; col++) {
          const cell = r.getCell(col);
          cell.border = thinBorder;
          cell.alignment = [1, 2, 4, 5, 6, 7, 8, 9, 10].includes(col) ? { horizontal: 'center' } : { horizontal: 'left' };
        }
      });

      ws.columns.forEach(col => { col.width = 18; });
      ws.getColumn(1).width = 8;
      ws.getColumn(3).width = 32;
    }

    // ── POS 1 SHEET ──
    if (pos === '1' || pos === 'all') {
      const ws = wb.addWorksheet('POS 1 - Wawancara');
      ws.views = [{ showGridLines: true, state: 'frozen', ySplit: 4 }];

      ws.addRow(['LEMBAR PENILAIAN POS 1: WAWANCARA & PERKENALAN']);
      ws.getCell('A1').font = fontTitle;
      ws.addRow([`PIK-R MANSEKU - TAHUN ${currentYear}`]);
      ws.addRow([]);

      const headers = ['No', 'NISN', 'Nama Lengkap', 'Kelas', 'Komunikasi', 'Percaya Diri', 'Motivasi', 'Komitmen', 'Kerja Sama', 'Kepemimpinan', 'Pengetahuan', 'Etika', 'Bonus', 'Rata-Rata POS 1', 'Penyeleksi', 'Status', 'Catatan'];
      ws.addRow(headers);

      const headerRow = ws.getRow(4);
      headerRow.height = 25;
      headers.forEach((_, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.fill = headerFill;
        cell.font = fontHeader;
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = thinBorder;
      });

      const attendingCandidates = candidates.filter(c => c.attendanceStatus !== 'TIDAK_HADIR');
      attendingCandidates.forEach((c, index) => {
        const s = c.selectionScore || {};
        ws.addRow([
          index + 1,
          c.nisn || '-',
          toTitleCase(c.name),
          c.className,
          s.pos1Comm ?? '-',
          s.pos1Trust ?? '-',
          s.pos1Motiv ?? '-',
          s.pos1Komitmen ?? '-',
          s.pos1KerjaSama ?? '-',
          s.pos1Kepemimpinan ?? '-',
          s.pos1Pengetahuan ?? '-',
          s.pos1Etika ?? '-',
          s.pos1Bonus ?? '-',
          s.pos1Avg ?? '-',
          s.pos1Evaluator || '-',
          s.pos1Completed ? 'SELESAI' : 'PROSES',
          s.pos1Notes || '-'
        ]);

        const r = ws.getRow(5 + index);
        for (let col = 1; col <= headers.length; col++) {
          const cell = r.getCell(col);
          cell.border = thinBorder;
          cell.alignment = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16].includes(col) ? { horizontal: 'center' } : { horizontal: 'left' };
        }
      });

      ws.columns.forEach(col => { col.width = 16; });
      ws.getColumn(3).width = 30;
    }

    // ── POS 2 SHEET ──
    if (pos === '2' || pos === 'all') {
      const ws = wb.addWorksheet('POS 2 - Minat Bakat');
      ws.views = [{ showGridLines: true, state: 'frozen', ySplit: 4 }];

      ws.addRow(['LEMBAR PENILAIAN POS 2: TES MINAT BAKAT']);
      ws.getCell('A1').font = fontTitle;
      ws.addRow([`PIK-R MANSEKU - TAHUN ${currentYear}`]);
      ws.addRow([]);

      const headers = ['No', 'NISN', 'Nama Lengkap', 'Kelas', 'Kreativitas', 'Penguasaan', 'Presentasi', 'Orisinalitas', 'Potensi', 'Percaya Diri', 'Rata-Rata POS 2', 'Penyeleksi', 'Status', 'Catatan'];
      ws.addRow(headers);

      const headerRow = ws.getRow(4);
      headerRow.height = 25;
      headers.forEach((_, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.fill = headerFill;
        cell.font = fontHeader;
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = thinBorder;
      });

      const attendingCandidates2 = candidates.filter(c => c.attendanceStatus !== 'TIDAK_HADIR');
      attendingCandidates2.forEach((c, index) => {
        const s = c.selectionScore || {};
        ws.addRow([
          index + 1,
          c.nisn || '-',
          toTitleCase(c.name),
          c.className,
          s.pos2Creativity ?? '-',
          s.pos2Mastery ?? '-',
          s.pos2Pres ?? '-',
          s.pos2Orig ?? '-',
          s.pos2Potency ?? '-',
          s.pos2Confidence ?? '-',
          s.pos2Avg ?? '-',
          s.pos2Evaluator || '-',
          s.pos2Completed ? 'SELESAI' : 'PROSES',
          s.pos2Notes || '-'
        ]);

        const r = ws.getRow(5 + index);
        for (let col = 1; col <= headers.length; col++) {
          const cell = r.getCell(col);
          cell.border = thinBorder;
          cell.alignment = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 13].includes(col) ? { horizontal: 'center' } : { horizontal: 'left' };
        }
      });

      ws.columns.forEach(col => { col.width = 16; });
      ws.getColumn(3).width = 30;
    }

    // ── POS 3 SHEET ──
    if (pos === '3' || pos === 'all') {
      const ws = wb.addWorksheet('POS 3 - Studi Kasus');
      ws.views = [{ showGridLines: true, state: 'frozen', ySplit: 4 }];

      ws.addRow(['LEMBAR PENILAIAN POS 3: STUDI KASUS']);
      ws.getCell('A1').font = fontTitle;
      ws.addRow([`PIK-R MANSEKU - TAHUN ${currentYear}`]);
      ws.addRow([]);

      const headers = ['No', 'NISN', 'Nama Lengkap', 'Kelas', 'Pemahaman', 'Analisis', 'Solusi', 'Empati', 'Public Speaking', 'Logika', 'Pengetahuan', 'Rata-Rata POS 3', 'Penyeleksi', 'Status', 'Catatan'];
      ws.addRow(headers);

      const headerRow = ws.getRow(4);
      headerRow.height = 25;
      headers.forEach((_, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.fill = headerFill;
        cell.font = fontHeader;
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = thinBorder;
      });

      const attendingCandidates3 = candidates.filter(c => c.attendanceStatus !== 'TIDAK_HADIR');
      attendingCandidates3.forEach((c, index) => {
        const s = c.selectionScore || {};
        ws.addRow([
          index + 1,
          c.nisn || '-',
          toTitleCase(c.name),
          c.className,
          s.pos3Pemahaman ?? '-',
          s.pos3Analysis ?? '-',
          s.pos3Solution ?? '-',
          s.pos3Empati ?? '-',
          s.pos3PublicSpk ?? '-',
          s.pos3Logika ?? '-',
          s.pos3Pengetahuan ?? '-',
          s.pos3Avg ?? '-',
          s.pos3Evaluator || '-',
          s.pos3Completed ? 'SELESAI' : 'PROSES',
          s.pos3Notes || '-'
        ]);

        const r = ws.getRow(5 + index);
        for (let col = 1; col <= headers.length; col++) {
          const cell = r.getCell(col);
          cell.border = thinBorder;
          cell.alignment = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14].includes(col) ? { horizontal: 'center' } : { horizontal: 'left' };
        }
      });

      ws.columns.forEach(col => { col.width = 18; });
      ws.getColumn(3).width = 32;
    }

    const buffer = await wb.xlsx.writeBuffer();
    const posLabel = (pos || 'all').toUpperCase();
    const filename = `RAPOR_SELEKSI_POS_${posLabel}_PIK-R_${currentYear}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.send(buffer);
  } catch (error) {
    console.error('Error export POS score excel:', error);
    return res.status(500).json({ message: 'Gagal mengekspor data nilai POS ke Excel' });
  }
}



