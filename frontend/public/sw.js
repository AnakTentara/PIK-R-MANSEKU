// Service Worker for PIK-R MANSEKU (pikr-manseku.my.id)
const CACHE_NAME = 'pikr-web-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ─── Web Push Notification Handlers ─────────────────────────────────────────

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'PIK-R MANSEKU', body: event.data.text() };
    }
  }

  const title = data.title || 'PIK-R MANSEKU';
  const options = {
    body: data.body || '',
    icon: data.icon || '/media/logos/logo_pik-r.png',
    badge: data.badge || '/media/logos/logo_pik-r.png',
    image: data.image || undefined,
    data: data.data || { url: '/' },
    actions: Array.isArray(data.actions) ? data.actions : [],
    vibrate: [150, 80, 150],
    requireInteraction: !!data.requireInteraction,
    tag: data.tag || 'pikr-broadcast-' + (data.data?.category || 'general') + '-' + Date.now()
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
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
