// compyle — Zustand app store
import { create } from 'zustand';
import { SEED_YLE, SEED_LUIS, EMPTY_DATA } from '../lib/seed';
import { IS_CONFIGURED } from '../lib/firebase';
import type { TabId, ViewMode, EditingState, UserData, UserProfile, FocusSettings } from '../types';
import {
  DEFAULT_NAV_ORDER,
  DEFAULT_NAVIGATION_PREFERENCES,
  normalizeNavOrder,
  normalizeVisibleTabs,
  type CustomizableTabId,
  type NavOrderSettings,
  type NavigationPreferences,
  type VisibleTabSettings,
} from '../lib/navigation';

const defaultFocusSettings: FocusSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStartBreaks: false,
  autoStartFocus: false,
  longBreakInterval: 4,
  use24HourFormat: false,
};

const getInitialFocusSettings = (): FocusSettings => {
  try {
    const saved = localStorage.getItem('compyle_focus_settings');
    return saved ? JSON.parse(saved) : defaultFocusSettings;
  } catch {
    return defaultFocusSettings;
  }
};

const getInitialTab = (): TabId => {
  try {
    const saved = localStorage.getItem('compyle_active_tab') as TabId;
    const validTabs: TabId[] = ['today', 'cal', 'habits', 'money', 'links', 'notes', 'focus'];
    if (saved && validTabs.includes(saved)) {
      return saved;
    }
  } catch {}
  return 'cal';
};

const LOCAL_NAV_ACCOUNT_KEY = 'local';

const getNavPreferenceStorageKey = (accountKey: string, setting: 'visible_tabs' | 'nav_order') =>
  `compyle_${setting}:${encodeURIComponent(accountKey)}`;

const getInitialVisibleTabs = (accountKey = LOCAL_NAV_ACCOUNT_KEY): VisibleTabSettings => {
  try {
    const saved = JSON.parse(localStorage.getItem(getNavPreferenceStorageKey(accountKey, 'visible_tabs')) ?? '{}') as Partial<VisibleTabSettings>;
    return normalizeVisibleTabs(saved);
  } catch {
    return DEFAULT_NAVIGATION_PREFERENCES.visibleTabs;
  }
};

const getInitialNavOrder = (accountKey = LOCAL_NAV_ACCOUNT_KEY): NavOrderSettings => {
  try {
    return normalizeNavOrder(JSON.parse(localStorage.getItem(getNavPreferenceStorageKey(accountKey, 'nav_order')) ?? 'null'));
  } catch {
    return DEFAULT_NAVIGATION_PREFERENCES.navOrder;
  }
};

const getInitialNavigationPreferences = (accountKey = LOCAL_NAV_ACCOUNT_KEY): NavigationPreferences => ({
  visibleTabs: getInitialVisibleTabs(accountKey),
  navOrder: getInitialNavOrder(accountKey),
});

const persistNavigationPreferences = (accountKey: string, preferences: NavigationPreferences) => {
  localStorage.setItem(getNavPreferenceStorageKey(accountKey, 'visible_tabs'), JSON.stringify(preferences.visibleTabs));
  localStorage.setItem(getNavPreferenceStorageKey(accountKey, 'nav_order'), JSON.stringify(preferences.navOrder));
};

import { SEED_USER_ME, SEED_USER_PARTNER } from '../lib/seed';

interface ConfirmState {
  title: string;
  message: string;
  onConfirm: () => void;
}

interface ToastState {
  message: string;
  action?: string;
  onAction?: () => void;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

interface AppStore {
  // ui
  tab: TabId;
  viewMode: ViewMode;
  profileOpen: boolean;
  editing: EditingState;
  confirm: ConfirmState | null;
  toast: ToastState | null;
  confettiTrigger: number;
  crown: boolean;
  focusSettings: FocusSettings;
  navigationPreferencesAccountKey: string;
  navigationPreferencesByAccount: Record<string, NavigationPreferences>;
  visibleTabs: VisibleTabSettings;
  navOrder: NavOrderSettings;


  // data
  yleData: UserData;
  luisData: UserData;
  meProfile: UserProfile;
  partnerProfile: UserProfile;

  // ui actions
  setTab: (tab: TabId) => void;
  setViewMode: (mode: ViewMode) => void;
  switchView: () => void;
  setProfileOpen: (open: boolean) => void;
  setEditing: (e: EditingState) => void;
  setConfirm: (c: ConfirmState | null) => void;
  clearConfirm: () => void;
  setToast: (t: ToastState | null) => void;
  flash: (message: string, action?: string, onAction?: () => void) => void;
  triggerConfetti: () => void;
  triggerCrown: () => void;
  setFocusSettings: (s: FocusSettings) => void;
  setNavigationPreferencesAccount: (uid: string | null | undefined) => void;
  setNavigationPreferencesForAccount: (uid: string, preferences: NavigationPreferences) => void;
  toggleVisibleTab: (tab: CustomizableTabId) => void;
  saveNavigationPreferences: (visibleTabs: VisibleTabSettings, navOrder: NavOrderSettings) => void;


  // loading state for Firestore initial fetch
  dataLoading: boolean;
  setDataLoading: (v: boolean) => void;
  syncStatus: SyncStatus;
  pendingWrites: number;
  syncError: string | null;
  isOnline: boolean;
  beginSyncWrite: () => void;
  completeSyncWrite: () => void;
  reportSyncError: (message: string) => void;
  beginSyncRefresh: () => void;
  markServerSynced: () => void;
  setOnline: (online: boolean) => void;

  // data actions (own data only; partner data is read-only)
  setYleData: (updater: (d: UserData) => UserData) => void;
  setLuisData: (updater: (d: UserData) => UserData) => void;
  setMeProfile: (p: UserProfile) => void;
  setPartnerProfile: (p: UserProfile) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  tab: getInitialTab(),
  viewMode: 'me',
  profileOpen: false,
  editing: null,
  confirm: null,
  toast: null,
  confettiTrigger: 0,
  crown: false,
  focusSettings: getInitialFocusSettings(),
  navigationPreferencesAccountKey: LOCAL_NAV_ACCOUNT_KEY,
  navigationPreferencesByAccount: {
    [LOCAL_NAV_ACCOUNT_KEY]: getInitialNavigationPreferences(),
  },
  visibleTabs: getInitialVisibleTabs(),
  navOrder: getInitialNavOrder(),


  dataLoading: IS_CONFIGURED,
  syncStatus: IS_CONFIGURED ? 'idle' : 'synced',
  pendingWrites: 0,
  syncError: null,
  isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  yleData: IS_CONFIGURED ? { ...EMPTY_DATA } : structuredClone(SEED_YLE),
  luisData: IS_CONFIGURED ? { ...EMPTY_DATA } : structuredClone(SEED_LUIS),
  meProfile: IS_CONFIGURED
    ? { uid: '', displayName: '', email: '', partnerId: null }
    : SEED_USER_ME,
  partnerProfile: IS_CONFIGURED
    ? { uid: '', displayName: '', email: '', partnerId: null }
    : SEED_USER_PARTNER,

  setTab: (tab) => {
    localStorage.setItem('compyle_active_tab', tab);
    set({ tab });
  },
  setViewMode: (viewMode) => set({ viewMode }),
  switchView: () => set((s) => ({
    viewMode: s.viewMode === 'me' ? 'partner' : 'me',
    profileOpen: false,
    editing: null,
  })),
  setProfileOpen: (profileOpen) => set({ profileOpen }),
  setEditing: (editing) => set({ editing }),
  setConfirm: (confirm) => set({ confirm }),
  clearConfirm: () => set({ confirm: null }),
  setToast: (toast) => set({ toast }),
  flash: (message, action, onAction) => set({ toast: { message, action, onAction } }),
  triggerConfetti: () => set((s) => ({ confettiTrigger: s.confettiTrigger + 1 })),
  triggerCrown: () => {
    set({ crown: true });
    setTimeout(() => set({ crown: false }), 2200);
  },
  setFocusSettings: (focusSettings) => {
    localStorage.setItem('compyle_focus_settings', JSON.stringify(focusSettings));
    set({ focusSettings });
  },
  setNavigationPreferencesAccount: (uid) => set((s) => {
    const navigationPreferencesAccountKey = uid || LOCAL_NAV_ACCOUNT_KEY;
    if (s.navigationPreferencesAccountKey === navigationPreferencesAccountKey) return s;
    const preferences = s.navigationPreferencesByAccount[navigationPreferencesAccountKey]
      ?? getInitialNavigationPreferences(navigationPreferencesAccountKey);
    return {
      navigationPreferencesAccountKey,
      navigationPreferencesByAccount: {
        ...s.navigationPreferencesByAccount,
        [navigationPreferencesAccountKey]: preferences,
      },
      visibleTabs: preferences.visibleTabs,
      navOrder: preferences.navOrder,
    };
  }),
  setNavigationPreferencesForAccount: (uid, preferences) => set((s) => {
    const safePreferences = {
      visibleTabs: Object.values(preferences.visibleTabs).some(Boolean)
        ? preferences.visibleTabs
        : DEFAULT_NAVIGATION_PREFERENCES.visibleTabs,
      navOrder: normalizeNavOrder(preferences.navOrder),
    };
    persistNavigationPreferences(uid, safePreferences);
    const isActive = s.navigationPreferencesAccountKey === uid;
    return {
      navigationPreferencesByAccount: {
        ...s.navigationPreferencesByAccount,
        [uid]: safePreferences,
      },
      visibleTabs: isActive ? safePreferences.visibleTabs : s.visibleTabs,
      navOrder: isActive ? safePreferences.navOrder : s.navOrder,
    };
  }),
  toggleVisibleTab: (tab) => set((s) => {
    const visibleCount = Object.values(s.visibleTabs).filter(Boolean).length;
    if (s.visibleTabs[tab] && visibleCount <= 1) return s;
    const visibleTabs = { ...s.visibleTabs, [tab]: !s.visibleTabs[tab] };
    const preferences = { visibleTabs, navOrder: s.navOrder };
    persistNavigationPreferences(s.navigationPreferencesAccountKey, preferences);
    return {
      visibleTabs,
      navigationPreferencesByAccount: {
        ...s.navigationPreferencesByAccount,
        [s.navigationPreferencesAccountKey]: preferences,
      },
    };
  }),
  saveNavigationPreferences: (visibleTabs, navOrder) => set((s) => {
    const safeVisibleTabs = Object.values(visibleTabs).some(Boolean) ? visibleTabs : DEFAULT_NAVIGATION_PREFERENCES.visibleTabs;
    const safeNavOrder = normalizeNavOrder(navOrder);
    const preferences = { visibleTabs: safeVisibleTabs, navOrder: safeNavOrder };
    persistNavigationPreferences(s.navigationPreferencesAccountKey, preferences);
    return {
      visibleTabs: safeVisibleTabs,
      navOrder: safeNavOrder,
      navigationPreferencesByAccount: {
        ...s.navigationPreferencesByAccount,
        [s.navigationPreferencesAccountKey]: preferences,
      },
    };
  }),


  setDataLoading:    (dataLoading) => set({ dataLoading }),
  beginSyncWrite: () => set((s) => ({
    pendingWrites: s.pendingWrites + 1,
    syncStatus: s.isOnline ? 'syncing' : 'offline',
    syncError: null,
  })),
  completeSyncWrite: () => set((s) => {
    const pendingWrites = Math.max(0, s.pendingWrites - 1);
    return {
      pendingWrites,
      syncStatus: pendingWrites > 0 ? (s.isOnline ? 'syncing' : 'offline') : (s.isOnline ? 'synced' : 'offline'),
    };
  }),
  reportSyncError: (syncError) => set({ syncError, syncStatus: 'error' }),
  beginSyncRefresh: () => set((s) => ({
    syncError: null,
    syncStatus: s.isOnline ? (s.pendingWrites > 0 ? 'syncing' : 'idle') : 'offline',
  })),
  markServerSynced: () => set((s) => ({
    syncStatus: s.syncStatus === 'error' ? 'error' : s.pendingWrites > 0 ? 'syncing' : 'synced',
    syncError: s.syncStatus === 'error' ? s.syncError : null,
  })),
  setOnline: (isOnline) => set((s) => ({
    isOnline,
    syncStatus: !isOnline ? 'offline' : s.pendingWrites > 0 ? 'syncing' : s.syncStatus === 'offline' ? 'idle' : s.syncStatus,
  })),
  setYleData:        (updater) => set((s) => ({ yleData: updater(s.yleData) })),
  setLuisData:       (updater) => set((s) => ({ luisData: updater(s.luisData) })),
  setMeProfile:      (meProfile) => set({ meProfile }),
  setPartnerProfile: (partnerProfile) => set({ partnerProfile }),
}));

// Convenience selectors
export const selectData = (s: AppStore): UserData =>
  s.viewMode === 'partner' ? s.luisData : s.yleData;
export const selectIsPartner = (s: AppStore) => s.viewMode === 'partner';
export const selectPartnerName = (s: AppStore) => {
  const name = s.partnerProfile.displayName;
  return name ? name.split(' ')[0] : 'Partner';
};
