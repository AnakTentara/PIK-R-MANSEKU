/**
 * pushSubscription.js — Portal Web Push Registration
 * Mendaftarkan browser perangkat ke server untuk notifikasi pengumuman & jadwal.
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

export async function initPushSubscription() {
  if (typeof window === 'undefined') return false;
  // Jangan mendaftarkan Web Push browser saat web dibuka dari dalam WebView APK Ruang Cerita
  const isInsideNativeApp =
    window.isPIKRApp === true ||
    document.documentElement.getAttribute('data-in-app') === 'true' ||
    /PIKR-App\//i.test(navigator.userAgent);
  if (isInsideNativeApp) {
    console.log('[WebPush] Berjalan di APK Ruang Cerita; memakai notifikasi native aplikasi.');
    return false;
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    console.log('[WebPush] Browser tidak mendukung Web Push API.');
    return false;
  }

  try {
    // 1. Daftarkan Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    // 2. Minta izin notifikasi jika belum diputuskan
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.log('[WebPush] Izin notifikasi tidak diberikan:', permission);
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
      console.log('[WebPush] Langganan baru berhasil dibuat.');
    }

    // 5. Kirim langganan ke backend
    const subJson = subscription.toJSON();
    const payload = {
      endpoint: subJson.endpoint,
      keys: subJson.keys,
      userAgent: navigator.userAgent
    };

    const token = localStorage.getItem('token') || localStorage.getItem('candidate_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const saveRes = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (saveRes.ok) {
      console.log('[WebPush] Perangkat terdaftar sebagai penerima notifikasi!');
      return true;
    }
  } catch (err) {
    console.error('[WebPush] Gagal mendaftarkan perangkat:', err);
  }

  return false;
}
