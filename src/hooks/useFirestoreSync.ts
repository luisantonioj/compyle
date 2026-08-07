// compyle — syncs Firestore real-time data into the Zustand store
import { useCallback, useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';
import { useAppStore } from '../store/appStore';
import {
  ensureProfile,
  subscribeNavigationPreferences,
  subscribePrivacy,
  subscribeProfile,
} from '../features/profile/profileRepository';
import { clearPrivatePartnerData, subscribeUserData } from '../services/firebase/userDataRepository';
import { IS_CONFIGURED } from '../lib/firebase';

export function useFirestoreSync(user: User | null) {
  const store = useAppStore();
  const partnerId = store.meProfile.partnerId ?? null;
  const restart = useCallback(() => window.location.reload(), []);
  const hasLoadedRef = useRef(false);
  const friendlySyncError = (error: Error) => {
    const internalAssertion = error.message.includes('INTERNAL ASSERTION FAILED');
    const permissionDenied = (error as Error & { code?: string }).code === 'permission-denied'
      || error.message.toLowerCase().includes('insufficient permission');
    store.reportSyncError(
      internalAssertion
        ? 'Sync needs to restart.'
        : permissionDenied
        ? 'Some shared data is unavailable. Check sharing settings.'
        : error.message,
    );
  };

  useEffect(() => {
    if (!IS_CONFIGURED) return;

    const handleOnline = () => {
      store.setOnline(navigator.onLine);
      if (navigator.onLine) store.beginSyncRefresh();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') handleOnline();
    };
    const handleOffline = () => store.setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('pageshow', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pageshow', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  // Store methods are stable Zustand actions.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Own data + own profile doc
  useEffect(() => {
    if (!IS_CONFIGURED || !user) {
      store.setDataLoading(false);
      return;
    }
    if (!hasLoadedRef.current) store.setDataLoading(true);
    const startedAt = performance.now();
    console.info('[compyle] firestore_started', {
      online: navigator.onLine,
      standalone: window.matchMedia('(display-mode: standalone)').matches,
    });
    store.beginSyncRefresh();
    void ensureProfile(user.uid, user.displayName ?? '', user.email ?? '');
    const unsubData    = subscribeUserData(
      user.uid,
      (p) => store.setYleData((prev) => ({ ...prev, ...p })),
      () => {
        hasLoadedRef.current = true;
        store.setDataLoading(false);
        console.info('[compyle] firestore_ready', {
          elapsedMs: Math.round(performance.now() - startedAt),
          online: navigator.onLine,
        });
      },
      (error) => {
        console.warn('[compyle] firestore_error', {
          message: error.message,
          elapsedMs: Math.round(performance.now() - startedAt),
          online: navigator.onLine,
        });
        friendlySyncError(error);
      },
      () => store.markServerSynced(),
    );
    const unsubProfile = subscribeProfile(
      user.uid,
      (p) => store.setMeProfile(p),
      friendlySyncError,
    );
    const unsubNavigationPreferences = subscribeNavigationPreferences(
      user.uid,
      (preferences) => store.setNavigationPreferencesForAccount(user.uid, preferences),
      friendlySyncError,
    );
    return () => { unsubData(); unsubProfile(); unsubNavigationPreferences(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Partner data — re-subscribes whenever partnerId changes
  useEffect(() => {
    store.beginSyncRefresh();
    if (!IS_CONFIGURED || !partnerId) return;
    let isActive = true;
    let unsubData = () => {};
    let privacySignature = '';
    const handlePartnerError = (error: Error) => {
      if (!isActive || useAppStore.getState().meProfile.partnerId !== partnerId) return;
      friendlySyncError(error);
    };
    const unsubProfile = subscribeProfile(
      partnerId,
      (p) => store.setPartnerProfile(p),
      handlePartnerError,
    );
    const unsubPrivacy = subscribePrivacy(
      partnerId,
      (privacy) => {
        const nextSignature = JSON.stringify(privacy);
        store.setLuisData((prev) => clearPrivatePartnerData(prev, privacy));
        if (nextSignature === privacySignature) return;
        privacySignature = nextSignature;
        unsubData();
        unsubData = subscribeUserData(
          partnerId,
          (p) => store.setLuisData((prev) => ({ ...prev, ...p })),
          () => {},
          handlePartnerError,
          () => store.markServerSynced(),
          { privacy, includePrivacy: false },
        );
      },
      handlePartnerError,
    );
    const unsubNavigationPreferences = subscribeNavigationPreferences(
      partnerId,
      (preferences) => store.setNavigationPreferencesForAccount(partnerId, preferences),
      handlePartnerError,
    );
    return () => {
      isActive = false;
      unsubData();
      unsubProfile();
      unsubPrivacy();
      unsubNavigationPreferences();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId]);

  return { refresh: restart };
}
