import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Google Fonts
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  })
);
registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  })
);

// General assets
registerRoute(
  /\.(?:js|css|html|ico|png|svg|woff2)$/,
  new StaleWhileRevalidate({ cacheName: 'assets-cache' })
);

// ─── Web Push logic (from firebase-messaging-sw.js) ───
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

  const ch = new BroadcastChannel('compyle-push');
  ch.postMessage({ title, body });
  ch.close();
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});
