import { useEffect, useRef, useState } from 'react';
import { useAppStore, selectData, selectIsPartner, selectPartnerName } from '../store/appStore';
import { TODAY_KEY } from '../lib/seed';
import { useIsWeb } from '../hooks/useIsWeb';
import { useFirestoreSync } from '../hooks/useFirestoreSync';
import { IS_CONFIGURED } from '../lib/firebase';
import { listenForegroundMessages } from '../lib/messaging';
import { savePushSummary } from '../features/profile/profileRepository';
import { useTaskActions } from '../features/tasks/useTaskActions';
import { useHabitActions } from '../features/habits/useHabitActions';
import { useMoneyActions } from '../features/money/useMoneyActions';
import { useLinkActions } from '../features/links/useLinkActions';
import { useNoteActions } from '../features/notes/useNoteActions';
import { useProfileActions } from '../features/profile/useProfileActions';
import { Overlays } from './Overlays';
import { WebLayout } from './WebLayout';
import { MobileLayout } from './MobileLayout';
import { NotificationCenter } from '../components/ui/NotificationCenter';
import { getFirstVisibleTab, getVisibleNavItems } from '../lib/navigation';

export function AppShell({ user }: { user: import('firebase/auth').User | null }) {
  const store = useAppStore();
  const data = useAppStore(selectData);
  const isPartner = useAppStore(selectIsPartner);
  const partnerName = useAppStore(selectPartnerName);
  const { tab, viewMode, profileOpen, editing, confirm, toast, confettiTrigger, crown, dataLoading } = store;
  const { visibleTabs, setTab } = store;
  const isWeb = useIsWeb();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [calDate, setCalDate] = useState(TODAY_KEY);
  const [pushEnabled, setPushEnabled] = useState(
    IS_CONFIGURED && typeof Notification !== 'undefined' && Notification.permission === 'granted',
  );

  const { refresh: refreshData } = useFirestoreSync(user);

  const fs = IS_CONFIGURED && !!user;
  const activeUid = isPartner ? store.partnerProfile.uid : (user?.uid ?? '');
  const setActiveData = isPartner ? store.setLuisData : store.setYleData;
  const tapRef = useRef({ count: 0, timer: 0 as unknown as ReturnType<typeof setTimeout> });

  useEffect(() => {
    const onTap = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('.top-bar h1');
      if (!el) return;
      const t = tapRef.current;
      t.count++;
      clearTimeout(t.timer);
      t.timer = setTimeout(() => { t.count = 0; }, 600);
      if (t.count >= 3) {
        t.count = 0;
        store.triggerCrown();
        store.triggerConfetti();
      }
    };
    window.addEventListener('click', onTap);
    return () => window.removeEventListener('click', onTap);
  }, []);

  useEffect(() => {
    if (!fs) return;
    return listenForegroundMessages(({ title, body }) => {
      store.flash(body ? `${title}: ${body}` : title);
    });
  }, [fs]);

  useEffect(() => {
    if (dataLoading || !fs || !user) return;
    const own = store.yleData;
    const openTasks = (own.tasks[TODAY_KEY] ?? []).filter((t) => !t.done).length;
    const pendingHabits = own.habits.filter((h) => !(h.completedDates ?? []).includes(TODAY_KEY)).length;
    const dueBills = own.bills.filter((b) => b.status !== 'paid').length;
    const parts: string[] = [];
    if (openTasks > 0) parts.push(`${openTasks} task${openTasks > 1 ? 's' : ''}`);
    if (pendingHabits > 0) parts.push(`${pendingHabits} habit${pendingHabits > 1 ? 's' : ''}`);
    if (dueBills > 0) parts.push(`${dueBills} bill${dueBills > 1 ? 's' : ''} due`);
    void savePushSummary(user.uid, parts.length > 0 ? parts.join(' - ') : 'Everything is on track');
  }, [dataLoading, store.yleData, fs, user]);

  const maybe = (prob = 1) => {
    if (Math.random() < prob) store.triggerConfetti();
  };

  const confirmDelete = (label: string, action: () => void) => {
    store.setConfirm({
      title: `Delete ${label}?`,
      message: 'This can be undone for a few seconds.',
      onConfirm: () => { action(); store.clearConfirm(); },
    });
  };

  const taskHandlers = useTaskActions({ data, fs, activeUid, setActiveData, onComplete: maybe });
  const habitHandlers = useHabitActions({ data, fs, activeUid, setActiveData, onComplete: maybe });
  const moneyHandlers = useMoneyActions({ data, fs, activeUid, setActiveData, onComplete: maybe });
  const linkHandlers = useLinkActions({ data, fs, activeUid, setActiveData });
  const noteHandlers = useNoteActions({ fs, activeUid, setActiveData });
  const profileHandlers = useProfileActions({ user, fs, onPushEnabled: () => setPushEnabled(true) });

  useEffect(() => {
    if (getVisibleNavItems(visibleTabs).some((item) => item.id === tab)) return;
    setTab(getFirstVisibleTab(visibleTabs));
  }, [visibleTabs, tab, setTab]);

  if (dataLoading) return <div className="auth-loading paper-grain" />;

  const meInitial = (store.meProfile.displayName || store.meProfile.email || '?').charAt(0).toUpperCase();
  const profileInitial = isPartner ? partnerName.charAt(0).toUpperCase() : meInitial;

  const overlays = (
    <>
      <NotificationCenter
        toast={toast}
        onToastDismiss={() => store.setToast(null)}
        onSyncRetry={refreshData}
      />
      <Overlays
        user={user}
        data={data}
        viewMode={viewMode}
        profileOpen={profileOpen}
        editing={editing}
        confirm={confirm}
        confettiTrigger={confettiTrigger}
        crown={crown}
        pushEnabled={pushEnabled}
        partnerName={partnerName}
        confirmDelete={confirmDelete}
        taskHandlers={taskHandlers}
        habitHandlers={habitHandlers}
        moneyHandlers={moneyHandlers}
        linkHandlers={linkHandlers}
        noteHandlers={noteHandlers}
        profileHandlers={profileHandlers}
      />
    </>
  );

  const layoutProps = {
    data,
    tab,
    viewMode,
    isPartner,
    partnerName,
    profileInitial,
    visibleTabs,
    overlays,
    taskHandlers,
    habitHandlers,
    moneyHandlers,
    linkHandlers,
    noteHandlers,
  };

  if (isWeb) {
    return (
      <WebLayout
        {...layoutProps}
        sidebarCollapsed={sidebarCollapsed}
        onSidebarToggle={() => setSidebarCollapsed((v) => !v)}
        meInitial={meInitial}
      />
    );
  }

  return (
    <MobileLayout
      {...layoutProps}
      calDate={calDate}
      onCalendarDateChange={setCalDate}
      profileOpen={profileOpen}
      editing={editing}
      confirm={confirm}
    />
  );
}
