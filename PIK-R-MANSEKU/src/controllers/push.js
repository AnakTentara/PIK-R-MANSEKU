import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { JWT_SECRET } from '../config/secret.js';
import {
  getVapidPublicKey,
  savePushSubscription,
  removePushSubscription,
  broadcastPushNotification,
  sendPush,
  getNotificationByCodeOrId,
  getMeetingSchedule,
  saveMeetingSchedule
} from '../services/webPush.js';
import {
  appPushBus,
  registerAppDevice,
  emitAppTest,
  getPendingAppNotifications,
  trackSseClient,
  getActiveSseCount,
  isFcmConfigured
} from '../services/nativePush.js';

/**
 * GET /api/push/public-key
 * Mengambil VAPID Public Key untuk pendaftaran di client browser.
 */
export async function getPublicKey(req, res) {
  try {
    return res.json({ publicKey: getVapidPublicKey() });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengambil public key' });
  }
}

/**
 * POST /api/push/subscribe
 * Mendaftarkan endpoint dan keys Web Push dari browser perangkat.
 */
export async function subscribe(req, res) {
  try {
    const { endpoint, keys, userAgent, memberId, role } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: 'Subscription data tidak valid' });
    }

    const sub = await savePushSubscription({
      endpoint,
      keys,
      userAgent: userAgent || req.headers['user-agent'],
      memberId: memberId || null,
      role: role || 'GUEST'
    });

    return res.json({ ok: true, message: 'Berhasil mendaftarkan notifikasi', id: sub.id });
  } catch (err) {
    console.error('Error in subscribe push:', err);
    return res.status(500).json({ message: 'Gagal menyimpan langganan notifikasi' });
  }
}

/**
 * POST /api/push/unsubscribe
 * Menghapus pendaftaran notifikasi.
 */
export async function unsubscribe(req, res) {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await removePushSubscription(endpoint);
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal berhenti berlangganan notifikasi' });
  }
}

/**
 * GET /api/admin/push/stats
 * Mengambil statistik perangkat terdaftar dan total pengiriman.
 */
export async function getStats(req, res) {
  try {
    const [webPushCount, appDeviceCount, broadcastCount] = await Promise.all([
      prisma.pushSubscription.count(),
      prisma.appDevice.count(),
      prisma.pushNotificationHistory.count()
    ]);

    return res.json({
      subscriberCount: webPushCount + appDeviceCount,
      webPushCount,
      appDeviceCount,
      activeAppOnline: getActiveSseCount(),
      fcmConfigured: isFcmConfigured(),
      broadcastCount
    });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat statistik notifikasi' });
  }
}

/**
 * GET /api/admin/push/history
 * Mengambil riwayat notifikasi massal yang pernah dikirim.
 */
export async function getHistory(req, res) {
  try {
    const history = await prisma.pushNotificationHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 60
    });

    return res.json({
      history: history.map((h) => ({
        ...h,
        actions: h.actions ? JSON.parse(h.actions) : []
      }))
    });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat riwayat notifikasi' });
  }
}

/**
 * DELETE /api/admin/push/history/:id
 * Menghapus satu entri riwayat notifikasi.
 */
export async function deleteHistory(req, res) {
  try {
    const { id } = req.params;
    await prisma.pushNotificationHistory.delete({ where: { id } });
    return res.json({ ok: true, message: 'Riwayat notifikasi berhasil dihapus' });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal menghapus riwayat notifikasi' });
  }
}

/**
 * POST /api/admin/push/broadcast
 * Mengirim notifikasi massal ke seluruh subscriber aktif.
 */
export async function sendBroadcast(req, res) {
  try {
    const { title, body, icon, image, badge, url, category, actions } = req.body;
    if (!title || !body) {
      return res.status(400).json({ message: 'Judul dan isi notifikasi wajib diisi' });
    }

    const adminUsername = req.admin?.username || 'Admin';
    const result = await broadcastPushNotification(
      { title, body, icon, image, badge, url, category, actions },
      adminUsername
    );

    return res.json({
      ok: true,
      message: `Notifikasi berhasil disiarkan ke ${result.sentCount} perangkat`,
      result
    });
  } catch (err) {
    console.error('Error sendBroadcast push:', err);
    return res.status(500).json({ message: err.message || 'Gagal mengirim notifikasi massal' });
  }
}

/**
 * POST /api/admin/push/test
 * Mengirim uji coba notifikasi ke satu subscription tertentu.
 */
export async function sendTest(req, res) {
  try {
    const { subscription, notification } = req.body;
    if (!subscription?.endpoint) {
      return res.status(400).json({ message: 'Perangkat belum mengizinkan notifikasi untuk uji coba' });
    }

    const payload = {
      title: notification?.title || '🔔 Uji Coba Notifikasi PIK-R MANSEKU',
      body: notification?.body || 'Notifikasi push bekerja dengan sempurna di perangkat ini!',
      icon: notification?.icon || '/media/logos/logo_pik-r.png',
      image: notification?.image || null,
      badge: notification?.badge || '/media/logos/logo_pik-r.png',
      data: {
        url: notification?.url || '/',
        category: 'TEST',
        timestamp: Date.now()
      },
      actions: notification?.actions || []
    };

    const success = await sendPush(subscription, payload);
    if (!success) {
      return res.status(500).json({ message: 'Gagal mengirim push uji coba ke perangkat ini' });
    }

    return res.json({ ok: true, message: 'Uji coba notifikasi berhasil dikirim' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Gagal mengirim uji coba notifikasi' });
  }
}

/**
 * GET /api/push/public/:id
 * Mengambil detail notifikasi spesifik berdasarkan code (DD-MM-YYYY_n) atau ID.
 */
export async function getPublicNotification(req, res) {
  try {
    const { id } = req.params;
    const notif = await getNotificationByCodeOrId(id);
    if (!notif) {
      return res.status(404).json({ message: 'Pengumuman / Notifikasi tidak ditemukan atau sudah kedaluwarsa.' });
    }
    return res.json({ notification: notif });
  } catch (err) {
    console.error('Error in getPublicNotification:', err);
    return res.status(500).json({ message: 'Gagal memuat notifikasi' });
  }
}

/**
 * GET /api/push/public/pertemuan
 * Mengambil jadwal pertemuan selanjutnya untuk /push/pertemuan (publik)
 */
export async function getPublicPertemuan(req, res) {
  try {
    const schedule = await getMeetingSchedule();
    return res.json({ schedule });
  } catch (err) {
    console.error('Error in getPublicPertemuan:', err);
    return res.status(500).json({ message: 'Gagal memuat jadwal pertemuan' });
  }
}

/**
 * GET /api/push/admin/pertemuan
 * Mengambil jadwal pertemuan (Admin)
 */
export async function getAdminPertemuan(req, res) {
  try {
    const schedule = await getMeetingSchedule();
    return res.json({ schedule });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat pengaturan jadwal pertemuan' });
  }
}

/**
 * PUT /api/push/admin/pertemuan
 * Memperbarui jadwal pertemuan (Admin)
 */
export async function saveAdminPertemuan(req, res) {
  try {
    const updated = await saveMeetingSchedule(req.body);
    return res.json({ ok: true, message: 'Jadwal pertemuan berhasil diperbarui', schedule: updated });
  } catch (err) {
    console.error('Error in saveAdminPertemuan:', err);
    return res.status(500).json({ message: 'Gagal menyimpan jadwal pertemuan' });
  }
}

// ─── Native Mobile App Push Endpoints (/api/push/app/*) ─────────────────────

function extractOptionalMemberId(authHeader, queryToken) {
  let rawToken = null;
  if (authHeader && String(authHeader).startsWith('Bearer ')) {
    rawToken = String(authHeader).slice(7).trim();
  } else if (queryToken) {
    rawToken = String(queryToken).trim();
  }
  if (!rawToken) return undefined;
  try {
    const d = jwt.verify(rawToken, JWT_SECRET);
    if (d?.role === 'candidate' && d?.id) return d.id;
  } catch { /* abaikan token invalid */ }
  return undefined;
}

/**
 * POST /api/push/app/register
 * Mendaftarkan perangkat Android/iOS aplikasi Ruang Cerita.
 */
export async function registerApp(req, res) {
  try {
    const { deviceId, platform, appVersion, deviceName, fcmToken, clearMember } = req.body || {};
    if (!deviceId) {
      return res.status(400).json({ message: 'deviceId wajib diisi' });
    }
    const tokenMemberId = extractOptionalMemberId(req.headers['authorization'], null);
    const memberId = clearMember ? null : tokenMemberId;

    const saved = await registerAppDevice({
      deviceId,
      platform,
      appVersion,
      deviceName,
      fcmToken,
      memberId
    });

    return res.json({
      ok: true,
      deviceId: saved.deviceId,
      memberId: saved.memberId,
      fcmConfigured: isFcmConfigured()
    });
  } catch (err) {
    console.error('Error registerApp:', err);
    return res.status(500).json({ message: 'Gagal mendaftarkan perangkat aplikasi' });
  }
}

/**
 * GET /api/push/app/stream?deviceId=...&token=...
 * Aliran SSE realtime untuk perangkat APK Ruang Cerita (broadcast & personal).
 */
export async function streamApp(req, res) {
  const deviceId = req.query.deviceId ? String(req.query.deviceId).slice(0, 128) : `sse_${Date.now()}`;
  let memberId = extractOptionalMemberId(req.headers['authorization'], req.query.token);

  if (!memberId && req.query.deviceId) {
    const dev = await prisma.appDevice.findUnique({
      where: { deviceId: String(req.query.deviceId).slice(0, 128) },
      select: { memberId: true }
    }).catch(() => null);
    if (dev?.memberId) memberId = dev.memberId;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  res.write(`event: hello\ndata: ${JSON.stringify({ ok: true, memberId: memberId || null, serverTime: new Date().toISOString() })}\n\n`);

  trackSseClient(deviceId, true);

  const onBroadcast = (payload) => {
    res.write(`event: broadcast\ndata: ${JSON.stringify(payload)}\n\n`);
  };
  const onMember = (payload) => {
    res.write(`event: rc\ndata: ${JSON.stringify(payload)}\n\n`);
  };

  appPushBus.on('broadcast', onBroadcast);
  if (memberId) appPushBus.on(`m:${memberId}`, onMember);

  const beat = setInterval(() => {
    res.write(': ping\n\n');
  }, 20000);

  req.on('close', () => {
    clearInterval(beat);
    trackSseClient(deviceId, false);
    appPushBus.off('broadcast', onBroadcast);
    if (memberId) appPushBus.off(`m:${memberId}`, onMember);
  });
}

/**
 * GET /api/push/app/pending?deviceId=...&since=...
 * Mengambil notifikasi terbaru yang terlewat (untuk Android WorkManager & app resume).
 */
export async function getPendingApp(req, res) {
  try {
    const result = await getPendingAppNotifications({
      deviceId: req.query.deviceId || null,
      since: req.query.since || null
    });
    return res.json(result);
  } catch (err) {
    console.error('Error getPendingApp:', err);
    return res.status(500).json({ message: 'Gagal memeriksa pembaruan notifikasi' });
  }
}

/**
 * POST /api/push/admin/test-app
 * Mengirim notifikasi uji coba langsung ke seluruh perangkat APK Ruang Cerita terdaftar.
 */
export async function sendTestApp(req, res) {
  try {
    const { notification } = req.body || {};
    const result = await emitAppTest({
      title: notification?.title || '🔔 Uji Coba Notifikasi Ruang Cerita',
      body: notification?.body || 'Notifikasi berhasil dikirim langsung ke aplikasi Ruang Cerita Android!',
      icon: notification?.icon || '/media/logos/logo_pik-r.png',
      image: notification?.image || null,
      url: notification?.url || '/',
      actions: notification?.actions || []
    });

    if (result.totalApps === 0) {
      return res.status(400).json({
        message: 'Belum ada perangkat APK Ruang Cerita yang terdaftar. Install & buka APK Ruang Cerita terbaru di HP terlebih dahulu.'
      });
    }

    return res.json({
      ok: true,
      message: `Notifikasi uji coba dikirim ke ${result.totalApps} perangkat Ruang Cerita (${result.sseConnected} aktif realtime).`,
      result
    });
  } catch (err) {
    console.error('Error sendTestApp:', err);
    return res.status(500).json({ message: err.message || 'Gagal mengirim uji coba ke aplikasi' });
  }
}

