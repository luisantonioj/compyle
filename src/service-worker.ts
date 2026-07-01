/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

const APP_UPDATE_ACTIVATED = 'COMPYLE_APP_UPDATE_ACTIVATED';
const LEGACY_ASSET_CACHE = 'assets-cache';
const isServiceWorkerUpdate = Boolean(self.registration.active);

// A new build must not remain in the waiting state behind the old app shell.
self.addEventListener('install', () => {
  void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // This is the only legacy cache owned by the app outside Workbox's
    // revisioned precache. Firebase/Firestore data and web storage are untouched.
    await caches.delete(LEGACY_ASSET_CACHE);
    await self.clients.claim();

    if (!isServiceWorkerUpdate) return;

    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    await Promise.all(clients.map(async (client) => {
      if (!('navigate' in client)) return;

      // Current clients acknowledge this message and reload themselves. The
      // navigation fallback upgrades clients running a pre-fix app bundle.
      const acknowledged = await new Promise<boolean>((resolve) => {
        const channel = new MessageChannel();
        const finish = (result: boolean) => {
          channel.port1.close();
          resolve(result);
        };
        const timeout = setTimeout(() => finish(false), 1_000);

        channel.port1.onmessage = () => {
          clearTimeout(timeout);
          finish(true);
        };

        try {
          client.postMessage({ type: APP_UPDATE_ACTIVATED }, [channel.port2]);
        } catch {
          clearTimeout(timeout);
          finish(false);
        }
      });

      if (!acknowledged) {
        await (client as WindowClient).navigate(client.url).catch(() => undefined);
      }
    }));
  })());
});

cleanupOutdatedCaches();
precacheAndRoute((self as any).__WB_MANIFEST);

try {
  const handler = createHandlerBoundToURL('/index.html');
  const navigationRoute = new NavigationRoute(handler, {
    denylist: [
      /^\/_/,
      /\/[^/?]+\.[^/]+$/,
    ],
  });
  registerRoute(navigationRoute);
} catch (e) {
  console.warn('NavigationRoute fallback failed', e);
}

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
