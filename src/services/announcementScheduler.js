import prisma from '../config/db.js';
import { sendWhatsApp, sendWhatsAppWithAttachments, sendWhatsAppGroupBroadcast } from './whatsapp.js';
import path from 'path';

let schedulerInterval = null;
let isProcessing = false;

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
          const ok = await sendWhatsAppGroupBroadcast(ann.targetJid, ann.message, mediaObj);
          if (ok) successCount = 1;
        } else if (ann.targetGroup === 'GROUP_WA_CALON') {
          // Find candidates with valid WA number
          const candidates = await prisma.candidate.findMany({
            where: { whatsappNumber: { not: '' } },
            select: { id: true, name: true, className: true, whatsappNumber: true, nisn: true }
          });
          totalTargetCount = candidates.length;

          for (const c of candidates) {
            // Replace template variables
            let personalizedMsg = ann.message
              .replace(/\{nama\}/gi, c.name || '')
              .replace(/\{kelas\}/gi, c.className || '')
              .replace(/\{nisn\}/gi, c.nisn || '');

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
            let personalizedMsg = ann.message
              .replace(/\{nama\}/gi, m.name || '')
              .replace(/\{kelas\}/gi, m.className || '');

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
  } catch (error) {
    console.error('[Scheduler] Error global processing scheduled announcements:', error);
  } finally {
    isProcessing = false;
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
