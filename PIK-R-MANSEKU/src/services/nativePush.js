/**
 * nativePush.js — Hybrid Native Push Engine untuk Ruang Cerita APK (org.pikrmanseku.app).
 *
 * Mendukung dua jalur pengiriman secara paralel:
 * 1. Self-Hosted Realtime SSE + Pending Sync (/api/push/app/stream & /api/push/app/pending)
 *    Bekerja langsung 100% mandiri tanpa ketergantungan Firebase saat app aktif/background/sync.
 * 2. Firebase Cloud Messaging HTTP v1 API (FCM Ready)
 *    Aktif otomatis bila `FIREBASE_SERVICE_ACCOUNT_JSON` atau file `firebase-service-account.json`
 *    tersedia di server — mengirim push instan bahkan saat aplikasi ditutup total.
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';
import prisma from '../config/db.js';
import { SITE_URL } from '../config/site.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

export const appPushBus = new EventEmitter();
appPushBus.setMaxListeners(2000);

// Penanda jumlah listener SSE yang sedang aktif per device
const activeAppClients = new Set();
// Antrean uji coba sementara (TTL 10 menit) agar /pending juga dapat mengambil hasil uji coba admin
const ephemeralQueue = [];
const EPHEMERAL_TTL_MS = 10 * 60 * 1000;

let cachedServiceAccount = undefined;
let cachedAccessToken = null;
let cachedTokenExp = 0;

function loadServiceAccount() {
  if (cachedServiceAccount !== undefined) return cachedServiceAccount;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      cachedServiceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      return cachedServiceAccount;
    }
    const candidatePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
      : path.join(ROOT_DIR, 'firebase-service-account.json');
    if (fs.existsSync(candidatePath)) {
      cachedServiceAccount = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
      console.log(`[NativePush] FCM HTTP v1 aktif untuk project: ${cachedServiceAccount.project_id}`);
      return cachedServiceAccount;
    }
  } catch (err) {
    console.warn('[NativePush] Gagal membaca konfigurasi FCM Service Account:', err.message);
  }
  cachedServiceAccount = null;
  return null;
}

export function isFcmConfigured() {
  const sa = loadServiceAccount();
  return !!(sa?.project_id && sa?.client_email && sa?.private_key);
}

/**
 * Membuat Google OAuth2 Access Token dari Firebase Service Account tanpa library tambahan.
 */
async function getFcmAccessToken() {
  const sa = loadServiceAccount();
  if (!sa?.client_email || !sa?.private_key) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && nowSec < cachedTokenExp - 60) {
    return { token: cachedAccessToken, projectId: sa.project_id };
  }

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: nowSec,
    exp: nowSec + 3600
  })).toString('base64url');

  const unsigned = `${header}.${payload}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsigned);
  const signature = sign.sign(sa.private_key).toString('base64url');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`
    })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OAuth2 token error ${res.status}: ${errText}`);
  }

  const json = await res.json();
  cachedAccessToken = json.access_token;
  cachedTokenExp = nowSec + (json.expires_in || 3600);
  return { token: cachedAccessToken, projectId: sa.project_id };
}

function resolveAbsoluteMediaUrl(u) {
  if (!u) return undefined;
  if (/^https?:\/\//i.test(u)) return u;
  return `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`;
}

async function sendFcmSingle(fcmToken, notif) {
  const auth = await getFcmAccessToken();
  if (!auth) return false;

  const imageUrl = resolveAbsoluteMediaUrl(notif.image);
  const body = {
    message: {
      token: fcmToken,
      notification: {
        title: String(notif.title || 'Ruang Cerita'),
        body: String(notif.body || ''),
        ...(imageUrl ? { image: imageUrl } : {})
      },
      data: {
        id: String(notif.id || ''),
        code: String(notif.code || ''),
        title: String(notif.title || 'Ruang Cerita'),
        body: String(notif.body || ''),
        url: String(notif.url || '/'),
        category: String(notif.category || 'UMUM'),
        image: imageUrl || '',
        createdAt: String(notif.createdAt || new Date().toISOString())
      },
      android: {
        priority: 'high',
        notification: {
          channel_id: notif.category === 'RUANG_CERITA' ? 'pikr_ruang_cerita_activity' : 'pikr_ruang_cerita_broadcast',
          color: '#f97316',
          sound: 'default'
        }
      }
    }
  };

  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${auth.projectId}/messages:send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    if (res.status === 404 || errText.includes('UNREGISTERED') || errText.includes('INVALID_ARGUMENT')) {
      await prisma.appDevice.updateMany({
        where: { fcmToken },
        data: { fcmToken: null }
      }).catch(() => {});
    }
    return false;
  }
  return true;
}

async function sendFcmBatch(devices, notif) {
  const withToken = devices.filter((d) => !!d.fcmToken);
  if (!withToken.length || !isFcmConfigured()) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  const CHUNK = 20;
  for (let i = 0; i < withToken.length; i += CHUNK) {
    const slice = withToken.slice(i, i + CHUNK);
    const results = await Promise.allSettled(slice.map((d) => sendFcmSingle(d.fcmToken, notif)));
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) sent++;
      else failed++;
    }
  }
  return { sent, failed };
}

function pruneEphemeralQueue() {
  const cutoff = Date.now() - EPHEMERAL_TTL_MS;
  while (ephemeralQueue.length > 0 && new Date(ephemeralQueue[0].createdAt).getTime() < cutoff) {
    ephemeralQueue.shift();
  }
  while (ephemeralQueue.length > 20) {
    ephemeralQueue.shift();
  }
}

export function trackSseClient(deviceId, add) {
  if (!deviceId) return;
  if (add) activeAppClients.add(deviceId);
  else activeAppClients.delete(deviceId);
}

export function getActiveSseCount() {
  return activeAppClients.size;
}

/**
 * Mendaftarkan atau memperbarui perangkat Android/iOS Ruang Cerita APK.
 */
export async function registerAppDevice({ deviceId, platform = 'android', appVersion = null, deviceName = null, fcmToken = null, memberId = null }) {
  if (!deviceId || typeof deviceId !== 'string') {
    throw new Error('deviceId wajib diisi');
  }
  const cleanId = deviceId.trim().slice(0, 128);
  const existing = await prisma.appDevice.findUnique({ where: { deviceId: cleanId } });

  const nextMemberId = memberId !== undefined ? memberId : (existing?.memberId || null);
  const nextFcmToken = fcmToken ? String(fcmToken).trim().slice(0, 512) : (existing?.fcmToken || null);
  const nextRole = nextMemberId ? 'MEMBER' : 'APP_USER';

  return prisma.appDevice.upsert({
    where: { deviceId: cleanId },
    update: {
      platform: String(platform || 'android').slice(0, 20),
      appVersion: appVersion ? String(appVersion).slice(0, 32) : existing?.appVersion || null,
      deviceName: deviceName ? String(deviceName).slice(0, 80) : existing?.deviceName || null,
      fcmToken: nextFcmToken,
      memberId: nextMemberId,
      role: nextRole,
      lastSeenAt: new Date()
    },
    create: {
      deviceId: cleanId,
      platform: String(platform || 'android').slice(0, 20),
      appVersion: appVersion ? String(appVersion).slice(0, 32) : null,
      deviceName: deviceName ? String(deviceName).slice(0, 80) : null,
      fcmToken: nextFcmToken,
      memberId: nextMemberId,
      role: nextRole,
      lastSeenAt: new Date()
    }
  });
}

function shapeAppPayload(raw) {
  return {
    id: String(raw.id || `app_${Date.now()}`),
    code: raw.code || null,
    title: String(raw.title || 'Ruang Cerita · PIK-R MANSEKU'),
    body: String(raw.body || ''),
    icon: raw.icon || '/media/logos/logo_pik-r.png',
    image: raw.image || null,
    url: raw.url || '/',
    category: raw.category || 'UMUM',
    actions: Array.isArray(raw.actions) ? raw.actions : [],
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString()
  };
}

/**
 * Menyiarkan pengumuman massal ke semua perangkat APK Ruang Cerita (SSE + FCM bila aktif).
 */
export async function emitAppBroadcast(raw) {
  const payload = shapeAppPayload(raw);
  appPushBus.emit('broadcast', payload);

  const allApps = await prisma.appDevice.findMany();
  const fcmRes = await sendFcmBatch(allApps, payload);
  const sseConnected = activeAppClients.size;

  return {
    totalApps: allApps.length,
    sseConnected,
    fcmSent: fcmRes.sent
  };
}

/**
 * Mengirim notifikasi uji coba khusus ke aplikasi Android/iOS Ruang Cerita (tidak masuk riwayat permanen).
 */
export async function emitAppTest(raw) {
  const payload = shapeAppPayload({
    ...raw,
    id: `test_${Date.now()}_${crypto.randomInt(100, 999)}`,
    category: raw.category || 'TEST'
  });

  pruneEphemeralQueue();
  ephemeralQueue.push(payload);
  appPushBus.emit('broadcast', payload);

  const allApps = await prisma.appDevice.findMany();
  const fcmRes = await sendFcmBatch(allApps, payload);

  return {
    payload,
    totalApps: allApps.length,
    sseConnected: activeAppClients.size,
    fcmSent: fcmRes.sent
  };
}

/**
 * Mengirim notifikasi personal Ruang Cerita (DM, Like, Komentar, Follow, Konseling) ke perangkat APK milik anggota.
 */
export async function emitAppMemberPush(memberId, raw) {
  if (!memberId) return { sent: 0 };
  const payload = shapeAppPayload({
    ...raw,
    id: raw.id || `rc_${Date.now()}_${crypto.randomInt(100, 999)}`,
    category: raw.category || 'RUANG_CERITA'
  });

  appPushBus.emit(`m:${memberId}`, payload);

  const devices = await prisma.appDevice.findMany({
    where: { memberId, fcmToken: { not: null } }
  });
  const fcmRes = await sendFcmBatch(devices, payload);
  return { sent: fcmRes.sent };
}

/**
 * Mengambil notifikasi terbaru yang belum diterima APK (dipakai saat reconnect, app dibuka ulang, atau WorkManager sync).
 */
export async function getPendingAppNotifications({ deviceId = null, since = null }) {
  if (deviceId) {
    await prisma.appDevice.updateMany({
      where: { deviceId: String(deviceId).slice(0, 128) },
      data: { lastSeenAt: new Date() }
    }).catch(() => {});
  }

  pruneEphemeralQueue();

  let sinceDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (since) {
    const parsed = new Date(since);
    if (!Number.isNaN(parsed.getTime())) {
      sinceDate = parsed;
    }
  }

  const rows = await prisma.pushNotificationHistory.findMany({
    where: {
      createdAt: { gt: sinceDate }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  const historyItems = rows.map((h) => shapeAppPayload({
    id: h.id,
    code: h.code,
    title: h.title,
    body: h.body,
    icon: h.icon,
    image: h.image,
    url: h.url || (h.code ? `/push/${h.code}` : '/'),
    category: h.category || 'UMUM',
    actions: h.actions ? (() => { try { return JSON.parse(h.actions); } catch { return []; } })() : [],
    createdAt: h.createdAt
  }));

  const testItems = ephemeralQueue.filter((item) => new Date(item.createdAt) > sinceDate);

  const merged = [...testItems, ...historyItems].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return {
    items: merged,
    fcmConfigured: isFcmConfigured(),
    serverTime: new Date().toISOString()
  };
}
