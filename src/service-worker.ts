/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

cleanupOutdatedCaches();
precacheAndRoute((self as any).__WB_MANIFEST);

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
self.addEventListener('push', (event: any) => {
  const data  = event.data?.json() ?? {};
  const title = data.title ?? 'compyle';
  const body  = data.body  ?? '';

  event.waitUntil(
    (self as any).registration.showNotification(title, {
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

self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  event.waitUntil(
    (self as any).clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list: any[]) => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      if ((self as any).clients.openWindow) return (self as any).clients.openWindow('/');
    })
  );
});
