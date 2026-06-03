// compyle — Web Push client
// Uses the browser's native PushManager API with our own VAPID key pair.
// No Firebase Messaging SDK needed — push subscriptions are stored in Firestore
// and the Vercel cron sends notifications via the web-push npm package.

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, IS_CONFIGURED } from './firebase';

function urlBase64ToUint8Array(base64url: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64  = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(base64);
  const arr     = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export async function enablePushNotifications(uid: string): Promise<boolean> {
  if (!IS_CONFIGURED || !db) return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (!('Notification' in window)) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY as string),
    });

    await setDoc(
      doc(db, 'device_tokens', uid),
      { subscription: JSON.stringify(sub), uid, updated_at: serverTimestamp() },
      { merge: true },
    );

    return true;
  } catch {
    return false;
  }
}

export function listenForegroundMessages(
  cb: (payload: { title: string; body: string }) => void,
): () => void {
  if (!IS_CONFIGURED || !('BroadcastChannel' in window)) return () => {};
  const channel = new BroadcastChannel('compyle-push');
  const handler = (e: MessageEvent<{ title: string; body: string }>) => cb(e.data);
  channel.addEventListener('message', handler);
  return () => channel.close();
}
