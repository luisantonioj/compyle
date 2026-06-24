// compyle — syncs Firestore real-time data into the Zustand store
import { useEffect } from 'react';
import type { User } from 'firebase/auth';
import { useAppStore } from '../store/appStore';
import { ensureProfile, subscribeProfile } from '../features/profile/profileRepository';
import { subscribeUserData } from '../services/firebase/userDataRepository';
import { IS_CONFIGURED } from '../lib/firebase';

export function useFirestoreSync(user: User | null) {
  const store = useAppStore();
  const partnerId = store.meProfile.partnerId ?? null;

  // Own data + own profile doc
  useEffect(() => {
    if (!IS_CONFIGURED || !user) {
      store.setDataLoading(false);
      return;
    }
    store.setDataLoading(true);
    void ensureProfile(user.uid, user.displayName ?? '', user.email ?? '');
    const unsubData    = subscribeUserData(
      user.uid,
      (p) => store.setYleData((prev) => ({ ...prev, ...p })),
      () => store.setDataLoading(false),
    );
    const unsubProfile = subscribeProfile(user.uid, (p) => store.setMeProfile(p));
    return () => { unsubData(); unsubProfile(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Partner data — re-subscribes whenever partnerId changes
  useEffect(() => {
    if (!IS_CONFIGURED || !partnerId) return;
    const unsubData    = subscribeUserData(
      partnerId,
      (p) => store.setLuisData((prev) => ({ ...prev, ...p })),
      () => {},
    );
    const unsubProfile = subscribeProfile(partnerId, (p) => store.setPartnerProfile(p));
    return () => { unsubData(); unsubProfile(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId]);
}
