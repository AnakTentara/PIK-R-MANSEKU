import * as webpush from 'web-push';
import prisma from '../config/db.js';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BI3Pe23MSXLRxl8ejgnNNG7xUSjMhjPFxmFr0JHjYxtNu4NW4ERjibyM5MXKqGVtKnozblTMS3vXndNQNhd2grw';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'GqWNAb1zWIelBEUk4WS9V7zcrx4TVf5IFf_imNsY3fk';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@pikr-manseku.my.id';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (err) {
  console.error('[WebPush] Gagal menginisialisasi VAPID details:', err);
}

/**
 * Mengambil VAPID Public Key untuk client-side subscription.
 */
export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}

/**
 * Menyimpan / memperbarui langganan Web Push browser perangkat.
 */
export async function savePushSubscription({ endpoint, keys, userAgent, memberId, role }) {
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error('Subscription keys (p256dh & auth) tidak lengkap');
  }

  return await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: userAgent || null,
      memberId: memberId || null,
      role: role || (memberId ? 'MEMBER' : 'GUEST'),
      updatedAt: new Date()
    },
    create: {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: userAgent || null,
      memberId: memberId || null,
      role: role || (memberId ? 'MEMBER' : 'GUEST')
    }
  });
}

/**
 * Menghapus langganan (mis. saat user logout atau menonaktifkan notifikasi).
 */
export async function removePushSubscription(endpoint) {
  if (!endpoint) return;
  try {
    await prisma.pushSubscription.delete({ where: { endpoint } });
  } catch (err) {
    // Ignore jika sudah tidak ada
  }
}

/**
 * Mengirim notifikasi ke satu subscription tertentu.
 * Menghapus otomatis endpoint jika sudah kedaluwarsa (HTTP 404 / 410).
 */
export async function sendPush(sub, payload) {
  const pushConfig = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth
    }
  };

  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

  try {
    await webpush.sendNotification(pushConfig, payloadString);
    return true;
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      console.log(`[WebPush] Subscription expired (${err.statusCode}), menghapus endpoint.`);
      await removePushSubscription(sub.endpoint);
    } else {
      console.error(`[WebPush] Gagal mengirim push: ${err.message}`);
    }
    return false;
  }
}

/**
 * Mengirim notifikasi ke semua perangkat milik satu anggota tertentu (memberId).
 * Digunakan untuk notifikasi Ruang Cerita (DM, Like, Komentar, Follow, Story).
 */
export async function sendPushToMember(memberId, payload) {
  if (!memberId) return { sent: 0, failed: 0 };
  const subs = await prisma.pushSubscription.findMany({
    where: { memberId }
  });

  if (!subs.length) return { sent: 0, failed: 0 };

  const results = await Promise.allSettled(
    subs.map((s) => sendPush(s, payload))
  );

  const sent = results.filter((r) => r.status === 'fulfilled' && r.value === true).length;
  const failed = results.length - sent;
  return { sent, failed };
}

/**
 * Siaran Notifikasi Massal (Broadcast) dari Dashboard Admin.
 * Mengirim notifikasi ke seluruh perangkat yang terdaftar di database.
 */
export async function broadcastPushNotification(data, sentBy = 'Admin') {
  const {
    title,
    body,
    icon = '/media/logos/logo_pik-r.png',
    image = null,
    badge = '/media/logos/logo_pik-r.png',
    url = null,
    category = 'UMUM',
    actions = []
  } = data;

  if (!title || !body) {
    throw new Error('Judul dan pesan notifikasi wajib diisi');
  }

  // Generate kode publik notifikasi dengan format DD-MM-YYYY_n (contoh: 21-11-2026_1)
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const datePrefix = `${day}-${month}-${year}`;

  const startOfDay = new Date(year, now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(year, now.getMonth(), now.getDate() + 1, 0, 0, 0);

  const countToday = await prisma.pushNotificationHistory.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lt: endOfDay
      }
    }
  });

  const code = `${datePrefix}_${countToday + 1}`;
  const finalUrl = (url && url !== '/') ? url : `/push/${code}`;

  const payload = {
    title,
    body,
    icon: icon || '/media/logos/logo_pik-r.png',
    image: image || null,
    badge: badge || '/media/logos/logo_pik-r.png',
    data: {
      url: finalUrl,
      code,
      category,
      timestamp: Date.now()
    },
    actions: Array.isArray(actions) ? actions : []
  };

  // Simpan riwayat siaran dengan code unik
  const history = await prisma.pushNotificationHistory.create({
    data: {
      code,
      title,
      body,
      icon,
      image,
      badge,
      url: finalUrl,
      category,
      actions: JSON.stringify(actions),
      sentBy,
      sentCount: 0,
      failCount: 0
    }
  });

  // Ambil semua subscriber aktif
  const subs = await prisma.pushSubscription.findMany();
  console.log(`[WebPush] Memulai broadcast "${title}" (kode: ${code}) ke ${subs.length} perangkat.`);

  if (!subs.length) {
    return { ok: true, code, total: 0, sentCount: 0, failCount: 0, historyId: history.id };
  }

  // Kirim secara paralel dalam batch untuk stabilitas
  const BATCH_SIZE = 25;
  let sentCount = 0;
  let failCount = 0;

  for (let i = 0; i < subs.length; i += BATCH_SIZE) {
    const batch = subs.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map((s) => sendPush(s, payload)));

    results.forEach((r) => {
      if (r.status === 'fulfilled' && r.value === true) {
        sentCount++;
      } else {
        failCount++;
      }
    });
  }

  // Update statistik riwayat
  await prisma.pushNotificationHistory.update({
    where: { id: history.id },
    data: { sentCount, failCount }
  });

  console.log(`[WebPush] Broadcast ${code} selesai: ${sentCount} sukses, ${failCount} gagal.`);
  return { ok: true, code, url: finalUrl, total: subs.length, sentCount, failCount, historyId: history.id };
}

/**
 * Mengambil satu notifikasi berdasarkan kode unik (mis. 21-11-2026_1) atau ID UUID.
 */
export async function getNotificationByCodeOrId(identifier) {
  if (!identifier) return null;

  let notif = await prisma.pushNotificationHistory.findUnique({
    where: { code: identifier }
  });

  if (!notif) {
    notif = await prisma.pushNotificationHistory.findUnique({
      where: { id: identifier }
    }).catch(() => null);
  }

  if (!notif) return null;

  return {
    ...notif,
    actions: notif.actions ? JSON.parse(notif.actions) : []
  };
}

/**
 * Mengambil jadwal pertemuan selanjutnya untuk /push/pertemuan.
 * Secara bawaan mengikuti database sesi di aplikasi absensi (AttendanceSession),
 * kecuali bila admin secara khusus mengeset jadwal tersendiri.
 */
export async function getMeetingSchedule() {
  const s = await prisma.setting.findUnique({ where: { key: 'meeting_schedule' } });
  let manual = null;
  if (s && s.value) {
    try { manual = JSON.parse(s.value); } catch {}
  }

  // Jika admin mengeset jadwal manual khusus dan memilih tidak mengikuti absensi
  if (manual && manual.datetime && manual.isActive && manual.customOverride) {
    return { ...manual, source: 'MANUAL' };
  }

  // Mengikuti sesi dari database aplikasi absensi
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    // Cari sesi yang tanggalnya hari ini atau ke depan
    const upcoming = await prisma.attendanceSession.findFirst({
      where: { date: { gte: todayStr } },
      orderBy: { date: 'asc' }
    });

    const session = upcoming || await prisma.attendanceSession.findFirst({
      orderBy: { date: 'desc' }
    });

    if (session) {
      const time = session.startTime || '14:00';
      const datetime = `${session.date}T${time}:00`;
      return {
        title: session.title || 'Pertemuan Rutin PIK-R MANSEKU',
        datetime,
        location: manual?.location || 'Ruang Sekretariat PIK-R MANSEKU',
        dresscode: manual?.dresscode || (session.type === 'WAJIB' ? 'Seragam PDH PIK-R / Rapih' : 'Bebas, Sopan & Rapih'),
        agenda: session.description || manual?.agenda || 'Pertemuan rutin anggota dan evaluasi program kerja.',
        notes: manual?.notes || 'Harap hadir tepat waktu dan mengisi presensi absensi.',
        contactPerson: session.openedBy || 'Admin Absensi PIK-R',
        isActive: true,
        source: 'DATABASE_ABSENSI'
      };
    }
  } catch (err) {
    console.error('[WebPush] Gagal membaca sesi absensi:', err);
  }

  if (manual) return { ...manual, source: 'MANUAL' };

  return {
    title: 'Pertemuan Rutin PIK-R MANSEKU',
    datetime: null,
    location: 'Ruang Sekretariat PIK-R MANSEKU',
    dresscode: 'Seragam PDH PIK-R / Rapih',
    agenda: 'Pembahasan program kerja dan sharing session.',
    notes: 'Harap hadir tepat waktu dan membawa catatan pribadi.',
    contactPerson: 'Admin PIK-R',
    isActive: false,
    source: 'DEFAULT'
  };
}

/**
 * Menyimpan jadwal pertemuan selanjutnya (oleh Admin)
 */
export async function saveMeetingSchedule(data) {
  const payload = {
    title: data.title || 'Pertemuan Rutin PIK-R MANSEKU',
    datetime: data.datetime || null,
    location: data.location || 'Ruang Sekretariat PIK-R MANSEKU',
    dresscode: data.dresscode || 'Seragam PDH PIK-R / Rapih',
    agenda: data.agenda || '',
    notes: data.notes || '',
    contactPerson: data.contactPerson || 'Admin PIK-R',
    isActive: data.isActive !== undefined ? !!data.isActive : true,
    updatedAt: new Date().toISOString()
  };

  await prisma.setting.upsert({
    where: { key: 'meeting_schedule' },
    update: { value: JSON.stringify(payload) },
    create: { key: 'meeting_schedule', value: JSON.stringify(payload) }
  });

  return payload;
}
