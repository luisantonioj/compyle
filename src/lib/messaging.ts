// compyle — FCM push notification client
// Only active when Firebase is configured and browser supports notifications.

import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { app, db, IS_CONFIGURED } from './firebase';

let messaging: Messaging | null = null;

export async function enablePushNotifications(uid: string): Promise<string | null> {
  if (!IS_CONFIGURED || !app || !db) return null;
  if (!('Notification' in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  try {
    messaging = messaging ?? getMessaging(app);
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });
    if (token && db) {
      await setDoc(
        doc(db, 'users', uid, 'push_subscriptions', token.slice(0, 20)),
        { token, created_at: serverTimestamp() },
      );
    }
    return token;
  } catch {
    return null;
  }
}

export function listenForegroundMessages(cb: (payload: { notification?: { title?: string; body?: string } }) => void) {
  if (!IS_CONFIGURED || !app) return () => {};
  if (!messaging) {
    try { messaging = getMessaging(app); } catch { return () => {}; }
  }
  return onMessage(messaging, cb);
}
