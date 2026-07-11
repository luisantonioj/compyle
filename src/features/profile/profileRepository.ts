import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, writeBatch, type Unsubscribe } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { rootUserDoc, topLevelDoc, userSettingsDoc } from '../../services/firebase/client';
import type { PrivacySettings, UserProfile } from '../../types';
import { trackFirestoreWrite } from '../../services/firebase/syncTracker';
import {
  DEFAULT_NAVIGATION_PREFERENCES,
  normalizeNavOrder,
  normalizeVisibleTabs,
  type NavigationPreferences,
} from '../../lib/navigation';

export const savePrivacy = (uid: string, privacy: PrivacySettings) =>
  trackFirestoreWrite(setDoc(userSettingsDoc(uid, 'tracker_visibility', 'settings'), privacy));

export const saveNavigationPreferences = (uid: string, preferences: NavigationPreferences) =>
  trackFirestoreWrite(setDoc(userSettingsDoc(uid, 'navigation_preferences', 'settings'), preferences, { merge: true }));

export const ensureProfile = (uid: string, displayName: string, email: string) =>
  setDoc(rootUserDoc(uid), { displayName, email, created_at: serverTimestamp() }, { merge: true });

export function subscribeProfile(
  uid: string,
  cb: (p: UserProfile) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(rootUserDoc(uid), { includeMetadataChanges: true }, (snap) => {
    if (snap.exists()) cb(normalizeUserProfile(uid, snap.data()));
  }, onError);
}

export function subscribePrivacy(
  uid: string,
  cb: (privacy: PrivacySettings) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    userSettingsDoc(uid, 'tracker_visibility', 'settings'),
    { includeMetadataChanges: true },
    (snap) => cb(normalizePrivacyDoc(snap.exists() ? snap.data() : {})),
    onError,
  );
}

export function subscribeNavigationPreferences(
  uid: string,
  cb: (preferences: NavigationPreferences) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    userSettingsDoc(uid, 'navigation_preferences', 'settings'),
    { includeMetadataChanges: true },
    (snap) => cb(normalizeNavigationPreferencesDoc(snap.exists() ? snap.data() : {})),
    onError,
  );
}

export async function createInvite(myUid: string): Promise<string> {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  await setDoc(topLevelDoc('partner_invites', code), { inviterId: myUid, createdAt: serverTimestamp() });
  return code;
}

export async function acceptInvite(code: string, myUid: string): Promise<void> {
  const inviteRef = doc(db!, 'partner_invites', code.trim().toUpperCase());
  const snap = await getDoc(inviteRef);
  if (!snap.exists()) throw new Error('Invalid or expired code');
  const { inviterId } = snap.data() as { inviterId: string };
  if (inviterId === myUid) throw new Error('You cannot link with yourself');
  const batch = writeBatch(db!);
  batch.set(rootUserDoc(myUid), { partnerId: inviterId }, { merge: true });
  batch.set(rootUserDoc(inviterId), { partnerId: myUid }, { merge: true });
  batch.delete(inviteRef);
  await batch.commit();
}

export async function unlinkPartner(myUid: string, partnerUid: string): Promise<void> {
  const batch = writeBatch(db!);
  batch.set(rootUserDoc(myUid), { partnerId: null }, { merge: true });
  batch.set(rootUserDoc(partnerUid), { partnerId: null }, { merge: true });
  await batch.commit();
}

export const savePushSummary = (uid: string, summary: string) =>
  setDoc(
    topLevelDoc('device_tokens', uid),
    { daily_summary: summary, summary_updated_at: serverTimestamp() },
    { merge: true },
  );

export function normalizeUserProfile(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    uid,
    displayName: typeof data.displayName === 'string' ? data.displayName : '',
    email: typeof data.email === 'string' ? data.email : '',
    partnerId: typeof data.partnerId === 'string' || data.partnerId === null ? data.partnerId : undefined,
    initial: typeof data.initial === 'string' ? data.initial : undefined,
  };
}

export function normalizePrivacyDoc(data: Record<string, unknown>): PrivacySettings {
  return {
    cal: data.cal !== false,
    notes: data.notes !== false,
    links: data.links !== false,
    habits: data.habits !== false,
    money: data.money !== false,
  };
}

export function normalizeNavigationPreferencesDoc(data: Record<string, unknown>): NavigationPreferences {
  const visibleTabs = typeof data.visibleTabs === 'object' && data.visibleTabs !== null
    ? normalizeVisibleTabs(data.visibleTabs as Partial<NavigationPreferences['visibleTabs']>)
    : DEFAULT_NAVIGATION_PREFERENCES.visibleTabs;
  const navOrder = normalizeNavOrder(data.navOrder);
  return { visibleTabs, navOrder };
}

