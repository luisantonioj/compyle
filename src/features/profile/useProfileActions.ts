import { signOut, type User } from 'firebase/auth';
import { useAppStore } from '../../store/appStore';
import { auth } from '../../lib/firebase';
import { acceptInvite, createInvite, savePrivacy, unlinkPartner } from '../../lib/db';
import { enablePushNotifications } from '../../lib/messaging';
import type { PrivacySettings } from '../../types';

interface ProfileActionOptions {
  user: User | null;
  fs: boolean;
  onPushEnabled: () => void;
}

export function useProfileActions({ user, fs, onPushEnabled }: ProfileActionOptions) {
  const store = useAppStore();

  const handleSignOut = async () => {
    if (auth) await signOut(auth);
    store.setProfileOpen(false);
  };

  const handleEnableNotifications = async () => {
    if (!user) return;
    const ok = await enablePushNotifications(user.uid);
    if (ok) {
      onPushEnabled();
      store.flash('Notifications enabled');
    } else if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      store.flash('Notifications blocked - enable in browser settings');
    }
  };

  const togglePrivacy = (key: keyof PrivacySettings) => {
    if (fs && user) {
      const next = { ...store.yleData.privacy, [key]: !store.yleData.privacy[key] };
      void savePrivacy(user.uid, next);
    } else {
      store.setYleData((d) => ({ ...d, privacy: { ...d.privacy, [key]: !d.privacy[key] } }));
    }
  };

  const createPartnerInvite = user ? () => createInvite(user.uid) : undefined;
  const acceptPartnerInvite = user ? (code: string) => acceptInvite(code, user.uid) : undefined;

  const unlinkCurrentPartner = user && store.meProfile.partnerId
    ? async () => {
        store.setConfirm({
          title: 'Unlink partner?',
          message: 'Are you sure you want to disconnect from your partner?',
          onConfirm: () => {
            void unlinkPartner(user.uid, store.meProfile.partnerId!);
            store.clearConfirm();
          },
        });
      }
    : undefined;

  return {
    handleSignOut,
    handleEnableNotifications,
    togglePrivacy,
    createPartnerInvite,
    acceptPartnerInvite,
    unlinkCurrentPartner,
  };
}

