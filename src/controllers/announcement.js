import prisma from '../config/db.js';
import path from 'path';
import fs from 'fs';
import { processScheduledAnnouncements } from '../services/announcementScheduler.js';
import { sendWhatsAppGroupBroadcast } from '../services/whatsapp.js';

// 1. Get All Announcements & Stats
export async function getAnnouncements(req, res) {
  try {
    const list = await prisma.scheduledAnnouncement.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const scheduledCount = list.filter(a => a.status === 'SCHEDULED').length;
    const sentCount = list.filter(a => a.status === 'SENT').length;
    const failedCount = list.filter(a => a.status === 'FAILED').length;

    res.json({
      success: true,
      announcements: list,
      stats: {
        total: list.length,
        scheduled: scheduledCount,
        sent: sentCount,
        failed: failedCount
      }
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data pengumuman.' });
  }
}

// 2. Create New Announcement (Instant or Scheduled)
export async function createAnnouncement(req, res) {
  try {
    const {
      title,
      targetGroup,
      targetJid,
      targetName,
      message,
      scheduledAt,
      sendNow
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Judul dan pesan wajib diisi.' });
    }

    let mediaUrl = null;
    let mediaType = 'NONE';
    let mediaName = null;

    if (req.file) {
      mediaUrl = req.file.path.replace(/\\/g, '/');
      mediaName = req.file.originalname;

      const mime = req.file.mimetype || '';
      if (mime.startsWith('image/')) mediaType = 'IMAGE';
      else if (mime.startsWith('video/')) mediaType = 'VIDEO';
      else mediaType = 'DOCUMENT';
    }

    const isSendInstant = String(sendNow) === 'true';
    const scheduleDate = isSendInstant || !scheduledAt ? new Date() : new Date(scheduledAt);

    const announcement = await prisma.scheduledAnnouncement.create({
      data: {
        title: title.trim(),
        targetGroup: targetGroup || 'CUSTOM_JID',
        targetJid: targetJid ? targetJid.trim() : null,
        targetName: targetName ? targetName.trim() : null,
        message: message.trim(),
        mediaUrl,
        mediaType,
        mediaName,
        scheduledAt: scheduleDate,
        status: 'SCHEDULED'
      }
    });

    // If instant send is checked, process immediately
    if (isSendInstant) {
      processScheduledAnnouncements();
    }

    res.status(201).json({
      success: true,
      message: isSendInstant ? 'Pengumuman dikirim sekarang!' : 'Pengumuman berhasil dijadwalkan.',
      announcement
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat pengumuman.' });
  }
}

// 3. Update Announcement
export async function updateAnnouncement(req, res) {
  try {
    const { id } = req.params;
    const { title, targetGroup, targetJid, targetName, message, scheduledAt } = req.body;

    const existing = await prisma.scheduledAnnouncement.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan.' });
    }

    let mediaUrl = existing.mediaUrl;
    let mediaType = existing.mediaType;
    let mediaName = existing.mediaName;

    if (req.file) {
      mediaUrl = req.file.path.replace(/\\/g, '/');
      mediaName = req.file.originalname;
      const mime = req.file.mimetype || '';
      if (mime.startsWith('image/')) mediaType = 'IMAGE';
      else if (mime.startsWith('video/')) mediaType = 'VIDEO';
      else mediaType = 'DOCUMENT';
    }

    const updated = await prisma.scheduledAnnouncement.update({
      where: { id },
      data: {
        title: title ? title.trim() : existing.title,
        targetGroup: targetGroup || existing.targetGroup,
        targetJid: targetJid !== undefined ? targetJid.trim() : existing.targetJid,
        targetName: targetName !== undefined ? targetName.trim() : existing.targetName,
        message: message ? message.trim() : existing.message,
        mediaUrl,
        mediaType,
        mediaName,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : existing.scheduledAt,
        status: 'SCHEDULED'
      }
    });

    res.json({ success: true, message: 'Pengumuman berhasil diperbarui.', announcement: updated });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui pengumuman.' });
  }
}

// 4. Delete Announcement
export async function deleteAnnouncement(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.scheduledAnnouncement.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan.' });
    }

    if (existing.mediaUrl && fs.existsSync(existing.mediaUrl)) {
      try { fs.unlinkSync(existing.mediaUrl); } catch (e) {}
    }

    await prisma.scheduledAnnouncement.delete({ where: { id } });
    res.json({ success: true, message: 'Pengumuman berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus pengumuman.' });
  }
}

// 5. Trigger Instant Send
export async function sendNowAnnouncement(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.scheduledAnnouncement.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan.' });
    }

    await prisma.scheduledAnnouncement.update({
      where: { id },
      data: {
        scheduledAt: new Date(),
        status: 'SCHEDULED'
      }
    });

    // Run scheduler immediately
    processScheduledAnnouncements();

    res.json({ success: true, message: 'Pengumuman dipicu untuk dikirim sekarang!' });
  } catch (error) {
    console.error('Error triggering send-now:', error);
    res.status(500).json({ success: false, message: 'Gagal memicu pengiriman pengumuman.' });
  }
}

// 6. Debug: Get Detected WhatsApp Groups
export async function getDebugGroups(req, res) {
  try {
    const groups = await prisma.whatsAppGroup.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    res.json({ success: true, groups });
  } catch (error) {
    console.error('Error fetching debug groups:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar grup.' });
  }
}

// 7. Debug: Add / Update Manual Group JID
export async function addDebugGroup(req, res) {
  try {
    const { jid, name } = req.body;
    if (!jid || !name) {
      return res.status(400).json({ success: false, message: 'JID dan Nama Grup wajib diisi.' });
    }

    const group = await prisma.whatsAppGroup.upsert({
      where: { jid: jid.trim() },
      create: { jid: jid.trim(), name: name.trim() },
      update: { name: name.trim() }
    });

    res.json({ success: true, message: 'Grup berhasil disimpan.', group });
  } catch (error) {
    console.error('Error adding debug group:', error);
    res.status(500).json({ success: false, message: 'Gagal menyimpan grup.' });
  }
}

// 8. Debug: Get Recent Live Message Logs
export async function getDebugLogs(req, res) {
  try {
    const logs = await prisma.announcementLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching debug logs:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil log debug.' });
  }
}

// 9. Debug: Simulate Incoming Message (Test Listener & !id command)
export async function simulateIncomingMessage(req, res) {
  try {
    const { groupJid, groupName, sender, text } = req.body;

    const jid = groupJid ? groupJid.trim() : '120363987654321@g.us';
    const gName = groupName ? groupName.trim() : 'Grup Simulasi Debug PIK-R';
    const sName = sender ? sender.trim() : 'Haikal (Admin Test)';
    const msgText = text ? text.trim() : '!id';

    // Upsert Group
    await prisma.whatsAppGroup.upsert({
      where: { jid },
      create: { jid, name: gName, lastMsgAt: new Date() },
      update: { name: gName, lastMsgAt: new Date() }
    });

    // Create Log
    const log = await prisma.announcementLog.create({
      data: {
        receiverJid: jid,
        sender: sName,
        content: msgText,
        type: 'INCOMING_MSG'
      }
    });

    res.json({
      success: true,
      message: `Simulasi pesan "${msgText}" dari ${sName} di ${gName} (${jid}) berhasil!`,
      log
    });
  } catch (error) {
    console.error('Error simulating incoming message:', error);
    res.status(500).json({ success: false, message: 'Gagal mensimulasikan pesan.' });
  }
}
