// compyle — Web Push service worker
// Handles background push notifications using the native Web Push API.
// No Firebase SDK needed here — the VAPID-signed push arrives directly from the browser's push service.

self.addEventListener('push', (event) => {
  const data  = event.data?.json() ?? {};
  const title = data.title ?? 'compyle';
  const body  = data.body  ?? '';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:  '/pwa-192.png',
      badge: '/pwa-192.png',
      tag:   'compyle-notification',
      data,
    })
  );

  // Relay to any open app tab so it shows as an in-app toast instead of an OS notification.
  const ch = new BroadcastChannel('compyle-push');
  ch.postMessage({ title, body });
  ch.close();
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
