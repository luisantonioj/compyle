// compyle — Firebase Cloud Messaging service worker
// This file is served at /firebase-messaging-sw.js for FCM background notifications.

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Firebase config is injected at runtime via a postMessage from the main app,
// or you can hardcode it here for simplicity (it's already public in the browser).
// See src/lib/messaging.ts for the token registration flow.
let app;

self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG') {
    if (app) return;
    app = firebase.initializeApp(event.data.config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const { title = 'compyle', body = '', icon = '/pwa-192.png' } = payload.notification ?? {};
      self.registration.showNotification(title, { body, icon, badge: '/pwa-192.png' });
    });
  }
});
