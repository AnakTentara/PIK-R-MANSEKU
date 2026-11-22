const CACHE_NAME = 'pikr-cerita-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/logo-192.png',
  '/logo-96.png',
  '/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Jangan cache SSE streams atau mutasi non-GET
  if (req.method !== 'GET' || url.pathname.includes('/stream')) {
    return;
  }

  // API calls: Network first
  if (url.pathname.startsWith('/api/') || url.pathname === '/music/catalog.json') {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // Navigasi HTML: Network first, fallback to cached index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets (JS, CSS, fonts, images): Cache first, fallback to network
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      }).catch(() => {
        // Jika gagal muat navigasi/gambar saat offline
        if (req.destination === 'image') {
          return caches.match('/logo-192.png');
        }
      });
    })
  );
});

// ─── Web Push Notification Handlers ─────────────────────────────────────────

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Ruang Cerita PIK-R', body: event.data.text() };
    }
  }

  const title = data.title || 'Ruang Cerita PIK-R';
  const options = {
    body: data.body || '',
    icon: data.icon || '/logo-192.png',
    badge: data.badge || '/logo-96.png',
    image: data.image || undefined,
    data: data.data || { url: '/' },
    actions: Array.isArray(data.actions) ? data.actions : [],
    vibrate: [120, 60, 120],
    requireInteraction: !!data.requireInteraction,
    tag: data.tag || 'rc-push-' + (data.data?.category || 'general') + '-' + Date.now()
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  let targetUrl = event.notification.data?.url || '/';

  // Jika tombol aksi diklik
  if (event.action && Array.isArray(event.notification.actions)) {
    const actionObj = event.notification.actions.find((a) => a.action === event.action);
    if (actionObj && actionObj.url) {
      targetUrl = actionObj.url;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Jika tab sudah terbuka di origin yang sama, fokuskan dan navigasikan
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Jika belum ada tab yang terbuka, buka tab baru
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

