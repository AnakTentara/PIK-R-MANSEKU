import prisma from '../config/db.js';
import { sendWhatsApp, sendWhatsAppWithAttachments, sendWhatsAppGroupBroadcast } from './whatsapp.js';
import path from 'path';

let schedulerInterval = null;
let isProcessing = false;

/**
 * Mendapatkan variabel global otomatis dari database (pembina, ketua, total anggota, waktu, link).
 */
export async function getGlobalTemplateVariables() {
  try {
    const totalAnggota = await prisma.member.count({ where: { status: 'ACTIVE' } });
    const pembina = await prisma.orgMember.findFirst({
      where: { OR: [{ role: 'PEMBINA' }, { jabatan: { contains: 'Pembina' } }] },
      orderBy: { createdAt: 'desc' }
    });
    const namaPembina = pembina?.name || 'Panca Nopriansyah, S.Pd';

    const ketua = await prisma.orgMember.findFirst({
      where: { OR: [{ role: 'KETUA' }, { jabatan: { contains: 'Ketua Umum' } }] },
      orderBy: { createdAt: 'desc' }
    });
    const namaKetua = ketua?.name || 'Febriady';

    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const hari = days[now.getDay()];
    const tanggal = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    const jam = now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) + ' WIB';

    return {
      '{total_anggota}': `${totalAnggota} Anggota`,
      '{nama_pembina}': namaPembina,
      '{nama_ketua}': namaKetua,
      '{organisasi}': 'PIK-R MANSEKU',
      '{sekolah}': 'MAN 1 Muara Enim',
      '{hari}': hari,
      '{tanggal}': tanggal,
      '{jam}': jam,
      '{link_web}': 'https://pikr-manseku.my.id',
      '{link_ruang_cerita}': 'https://pikr-manseku.my.id/ruang-cerita',
      '{link_kelulusan}': 'https://pikr-manseku.my.id/cek-kelulusan',
      '{link_daftar}': 'https://pikr-manseku.my.id/daftar'
    };
  } catch (e) {
    console.error('Error getting template variables:', e);
    return {
      '{total_anggota}': '101 Anggota',
      '{nama_pembina}': 'Panca Nopriansyah, S.Pd',
      '{nama_ketua}': 'Febriady',
      '{organisasi}': 'PIK-R MANSEKU',
      '{sekolah}': 'MAN 1 Muara Enim',
      '{hari}': 'Hari ini',
      '{tanggal}': 'Tanggal ini',
      '{jam}': 'WIB',
      '{link_web}': 'https://pikr-manseku.my.id',
      '{link_ruang_cerita}': 'https://pikr-manseku.my.id/ruang-cerita',
      '{link_kelulusan}': 'https://pikr-manseku.my.id/cek-kelulusan',
      '{link_daftar}': 'https://pikr-manseku.my.id/daftar'
    };
  }
}

/**
 * Mengganti variabel template {nama}, {kelas}, {nisn}, dan variabel global lainnya
 */
export function applyTemplateVariables(rawMessage, globalVars, recipient = {}) {
  let msg = rawMessage || '';
  msg = msg
    .replace(/\{nama\}/gi, recipient.name || '')
    .replace(/\{kelas\}/gi, recipient.className || '')
    .replace(/\{nisn\}/gi, recipient.nisn || '');

  for (const [key, val] of Object.entries(globalVars || {})) {
    const escaped = key.replace(/[{}]/g, '\\$&');
    msg = msg.replace(new RegExp(escaped, 'gi'), val);
  }
  return msg;
}

/**
 * Process pending scheduled announcements whose scheduledAt time has arrived.
 */
export async function processScheduledAnnouncements() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const now = new Date();

    // Find announcements that are SCHEDULED and scheduledAt <= now
    const pendingAnnouncements = await prisma.scheduledAnnouncement.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    if (pendingAnnouncements.length === 0) {
      isProcessing = false;
      return;
    }

    console.log(`[Scheduler] Memproses ${pendingAnnouncements.length} pengumuman terjadwal...`);
    const globalVars = await getGlobalTemplateVariables();

    for (const ann of pendingAnnouncements) {
      try {
        console.log(`[Scheduler] Mengirim pengumuman: "${ann.title}" (ID: ${ann.id})`);

        let successCount = 0;
        let totalTargetCount = 0;

        const mediaObj = ann.mediaUrl ? {
          url: ann.mediaUrl,
          type: ann.mediaType || 'DOCUMENT',
          name: ann.mediaName || path.basename(ann.mediaUrl)
        } : null;

        // Determine destination targets
        if (ann.targetJid) {
          // Direct Group JID / Custom Target
          totalTargetCount = 1;
          const finalMsg = applyTemplateVariables(ann.message, globalVars, { name: ann.targetName || 'Grup' });
          const ok = await sendWhatsAppGroupBroadcast(ann.targetJid, finalMsg, mediaObj);
          if (ok) successCount = 1;
        } else if (ann.targetGroup === 'GROUP_WA_CALON') {
          // Find candidates with valid WA number
          const candidates = await prisma.candidate.findMany({
            where: { whatsappNumber: { not: '' } },
            select: { id: true, name: true, className: true, whatsappNumber: true, nisn: true }
          });
          totalTargetCount = candidates.length;

          for (const c of candidates) {
            const personalizedMsg = applyTemplateVariables(ann.message, globalVars, c);

            const attachments = mediaObj ? [{ path: mediaObj.url, filename: mediaObj.name }] : [];
            const ok = attachments.length > 0
              ? await sendWhatsAppWithAttachments(c.whatsappNumber, personalizedMsg, attachments)
              : await sendWhatsApp(c.whatsappNumber, personalizedMsg);

            if (ok) successCount++;
            await new Promise(r => setTimeout(r, 800)); // Rate limiting delay
          }
        } else if (ann.targetGroup === 'GROUP_WA_PENGURUS') {
          // Send to Members / Pengurus
          const members = await prisma.member.findMany({
            where: { whatsappNumber: { not: '' }, status: 'ACTIVE' },
            select: { id: true, name: true, className: true, whatsappNumber: true }
          });
          totalTargetCount = members.length;

          for (const m of members) {
            const personalizedMsg = applyTemplateVariables(ann.message, globalVars, m);

            const attachments = mediaObj ? [{ path: mediaObj.url, filename: mediaObj.name }] : [];
            const ok = attachments.length > 0
              ? await sendWhatsAppWithAttachments(m.whatsappNumber, personalizedMsg, attachments)
              : await sendWhatsApp(m.whatsappNumber, personalizedMsg);

            if (ok) successCount++;
            await new Promise(r => setTimeout(r, 800));
          }
        }

        // Update announcement status
        await prisma.scheduledAnnouncement.update({
          where: { id: ann.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            totalTarget: totalTargetCount,
            totalSent: successCount
          }
        });

        // Log completion
        await prisma.announcementLog.create({
          data: {
            announcementId: ann.id,
            type: 'OUTGOING_BROADCAST',
            content: `Pengumuman "${ann.title}" terkirim ke ${successCount}/${totalTargetCount} target.`
          }
        });

        console.log(`[Scheduler] Pengumuman "${ann.title}" sukses terkirim ke ${successCount}/${totalTargetCount} target.`);
      } catch (err) {
        console.error(`[Scheduler] Error pengiriman pengumuman "${ann.title}":`, err);

        await prisma.scheduledAnnouncement.update({
          where: { id: ann.id },
          data: {
            status: 'FAILED',
            failureReason: err.message || 'Gagal eksekusi pengiriman'
          }
        });
      }
    }
    // Cek dan kirim pengingat kehadiran H-1 otomatis jika ada kegiatan besok
    await checkH1AttendanceReminder();
  } catch (error) {
    console.error('[Scheduler] Error global processing scheduled announcements:', error);
  } finally {
    isProcessing = false;
  }
}

let lastH1ReminderDate = null;

/**
 * Pengingat Kehadiran H-1:
 * Mengirim pesan pengingat ke grup WhatsApp H-1 sebelum kegiatan.
 * Pesan sengaja simpel: hanya mengingatkan membawa ID Card, tanpa info jam/kelas
 * (karena tim HUMAS yang akan mengirim reminder versi lengkap nanti).
 */
export async function checkH1AttendanceReminder() {
  try {
    // Tanggal besok dalam format YYYY-MM-DD (WIB, UTC+7)
    const nowWib = new Date(Date.now() + 7 * 3600 * 1000);
    const tomorrowWib = new Date(nowWib.getTime() + 24 * 3600 * 1000);
    const tomorrowStr = tomorrowWib.toISOString().slice(0, 10);

    if (lastH1ReminderDate === tomorrowStr) return;

    // Cek apakah ada jadwal sesi absensi / kegiatan besok
    const sessionTomorrow = await prisma.attendanceSession.findFirst({
      where: { date: tomorrowStr }
    });

    if (!sessionTomorrow) return;

    // Hanya kirim pada sore/malam hari sebelum kegiatan (antara pukul 15:00 - 21:00 WIB)
    const currentWibHour = nowWib.getUTCHours();
    if (currentWibHour < 15 || currentWibHour > 21) return;

    // Cek apakah pengingat untuk besok sudah pernah dikirim
    const alreadyLogged = await prisma.announcementLog.findFirst({
      where: {
        type: 'H1_REMINDER',
        content: { contains: tomorrowStr }
      }
    });
    if (alreadyLogged) {
      lastH1ReminderDate = tomorrowStr;
      return;
    }

    // Ambil daftar grup yang diizinkan dari kebijakan bot
    const policyRow = await prisma.setting.findUnique({ where: { key: 'wa_policy' } }).catch(() => null);
    let allowedGroups = [];
    try {
      if (policyRow?.value) allowedGroups = JSON.parse(policyRow.value)?.allowedGroups || [];
    } catch {}

    if (allowedGroups.length === 0) return;

    const reminderMsg = `📢 *PENGINGAT KEGIATAN PIK-R BESOK*\n\nHalo rekan-rekan PIK-R MANSEKU! 👋\n\nBesok ada kegiatan PIK-R ya. *Jangan lupa bawa ID Card kamu!* 🪪\n\n_(Informasi lengkap mengenai ruangan, jam kumpul, dan perlengkapan lainnya akan diumumkan oleh tim HUMAS)_\n\nSampai jumpa besok! ✨\n_PIK-R MANSEKU — Sehat, Cerdas, Berencana_ 💚`;

    let sent = 0;
    for (const jid of allowedGroups) {
      const ok = await sendWhatsAppGroupBroadcast(jid, reminderMsg);
      if (ok) sent++;
      await new Promise(r => setTimeout(r, 2000));
    }

    await prisma.announcementLog.create({
      data: {
        receiverJid: 'GROUPS',
        sender: 'BOT_SYSTEM',
        content: `[H1_REMINDER ${tomorrowStr}] Berhasil dikirim ke ${sent} grup`,
        type: 'H1_REMINDER'
      }
    });

    lastH1ReminderDate = tomorrowStr;
    console.log(`[Scheduler] Reminder H-1 untuk ${tomorrowStr} berhasil dikirim ke ${sent} grup.`);
  } catch (err) {
    console.error('[Scheduler] Gagal memproses reminder H-1:', err);
  }
}

/**
 * Start the background announcement scheduler runner (checks every 20 seconds).
 */
export function startAnnouncementScheduler() {
  if (schedulerInterval) return;

  console.log('[Scheduler] Announcement Scheduler Service diaktifkan (Interval 20 detik).');
  
  // Run once immediately on start
  processScheduledAnnouncements();

  // Set interval every 20s
  schedulerInterval = setInterval(() => {
    processScheduledAnnouncements();
  }, 20000);
}
