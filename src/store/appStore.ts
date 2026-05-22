// compyle — Zustand app store
import { create } from 'zustand';
import { SEED_YLE, SEED_LUIS, EMPTY_DATA } from '../lib/seed';
import { IS_CONFIGURED } from '../lib/firebase';
import type { TabId, ViewMode, EditingState, UserData, UserProfile } from '../types';
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

  // loading state for Firestore initial fetch
  dataLoading: boolean;
  setDataLoading: (v: boolean) => void;

  // data actions (own data only; partner data is read-only)
  setYleData: (updater: (d: UserData) => UserData) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  tab: 'today',
  viewMode: 'me',
  profileOpen: false,
  editing: null,
  confirm: null,
  toast: null,
  confettiTrigger: 0,
  crown: false,

  dataLoading: IS_CONFIGURED,
  yleData: IS_CONFIGURED ? { ...EMPTY_DATA } : structuredClone(SEED_YLE),
  luisData: IS_CONFIGURED ? { ...EMPTY_DATA } : structuredClone(SEED_LUIS),
  meProfile: SEED_USER_ME,
  partnerProfile: SEED_USER_PARTNER,

  setTab: (tab) => set({ tab }),
  setViewMode: (viewMode) => set({ viewMode }),
  switchView: () => set((s) => ({
    viewMode: s.viewMode === 'me' ? 'partner' : 'me',
    profileOpen: false,
    editing: null,
    tab: 'today',
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

  setDataLoading: (dataLoading) => set({ dataLoading }),
  setYleData: (updater) => set((s) => ({ yleData: updater(s.yleData) })),
}));

// Convenience selectors
export const selectData = (s: AppStore): UserData =>
  s.viewMode === 'partner' ? s.luisData : s.yleData;
export const selectIsPartner = (s: AppStore) => s.viewMode === 'partner';
export const selectPartnerName = (s: AppStore) =>
  s.viewMode === 'partner' ? s.meProfile.displayName : s.partnerProfile.displayName;
