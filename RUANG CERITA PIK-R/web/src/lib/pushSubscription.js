/**
 * pushSubscription.js — Ruang Cerita Web Push Registration
 * Mendaftarkan perangkat ke server agar dapat menerima notifikasi siaran & pesan.
 */

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function initPushSubscription(token = null) {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    console.log('[WebPush] Browser tidak mendukung Web Push API.');
    return false;
  }

  try {
    // 1. Daftarkan Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    // 2. Minta izin notifikasi (Force prompt)
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.log('[WebPush] Izin notifikasi belum diberikan:', permission);
      return false;
    }

    // 3. Ambil VAPID Public Key dari backend
    const keyRes = await fetch('/api/push/public-key');
    if (!keyRes.ok) throw new Error('Gagal mengambil public key');
    const { publicKey } = await keyRes.json();
    if (!publicKey) throw new Error('Public key kosong');

    // 4. Periksa apakah sudah ada langganan aktif
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      console.log('[WebPush] Langganan baru berhasil dibuat di browser.');
    }

    // 5. Kirim langganan ke backend
    const subJson = subscription.toJSON();
    const payload = {
      endpoint: subJson.endpoint,
      keys: subJson.keys,
      userAgent: navigator.userAgent
    };

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const saveRes = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (saveRes.ok) {
      console.log('[WebPush] Perangkat berhasil didaftarkan ke server!');
      return true;
    }
  } catch (err) {
    console.error('[WebPush] Gagal mendaftarkan Web Push:', err);
  }

  return false;
}
