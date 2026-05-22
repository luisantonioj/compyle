// compyle — syncs Firestore real-time data into the Zustand store
import { useEffect } from 'react';
import type { User } from 'firebase/auth';
import { useAppStore } from '../store/appStore';
import { subscribeUserData, ensureProfile } from '../lib/db';
import { IS_CONFIGURED } from '../lib/firebase';

export function useFirestoreSync(user: User | null) {
  const store = useAppStore();

  useEffect(() => {
    if (!IS_CONFIGURED || !user) {
      store.setDataLoading(false);
      return;
    }

    store.setDataLoading(true);

    // Write user profile doc if it doesn't exist yet (merge: true is safe)
    void ensureProfile(user.uid, user.displayName ?? '', user.email ?? '');

    const unsub = subscribeUserData(
      user.uid,
      (partial) => store.setYleData((prev) => ({ ...prev, ...partial })),
      () => store.setDataLoading(false),
    );

    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);
}
