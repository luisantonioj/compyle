import React, { useEffect, useRef, useState } from 'react';
import { useAppStore, selectData, selectIsPartner, selectPartnerName } from '../store/appStore';
import { TODAY_KEY } from '../lib/seed';
import { Icons } from '../components/Icons';
import { BottomNav } from '../components/layout/BottomNav';
import { Sidebar } from '../components/layout/Sidebar';
import { Confetti, Toast, ConfirmDialog, PartnerBanner } from '../components/ui/shared';
import { TodayScreen } from '../screens/TodayScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { HabitsScreen } from '../screens/HabitsScreen';
import { MoneyScreen } from '../screens/MoneyScreen';
import { LinksScreen } from '../screens/LinksScreen';
import { NotesScreen } from '../screens/NotesScreen';
import { FocusScreen } from '../screens/FocusScreen';
import { WebTodayScreen } from '../screens/web/WebTodayScreen';
import { WebPlanScreen } from '../screens/web/WebPlanScreen';
import { WebHabitsScreen } from '../screens/web/WebHabitsScreen';
import { WebMoneyScreen } from '../screens/web/WebMoneyScreen';
import { WebLinksScreen } from '../screens/web/WebLinksScreen';
import { WebNotesScreen } from '../screens/web/WebNotesScreen';
import { WebFocusScreen } from '../screens/web/WebFocusScreen';
import { ProfileSheet } from '../screens/ProfileSheet';
import { FocusTimerManager } from '../components/FocusTimerManager';
import {
  TaskForm, TaskViewModal, HabitForm, TransactionForm,
  AccountForm, CategoryForm, BillForm, DebtForm,
  LinkCategoryForm, LinkItemForm,
} from '../components/forms/Forms';
import { NoteForm } from '../components/forms/NoteForm';
import { useIsWeb } from '../hooks/useIsWeb';
import { useFirestoreSync } from '../hooks/useFirestoreSync';
import { IS_CONFIGURED } from '../lib/firebase';
import { listenForegroundMessages } from '../lib/messaging';
import { savePushSummary } from '../lib/db';
import { useTaskActions } from '../features/tasks/useTaskActions';
import { useHabitActions } from '../features/habits/useHabitActions';
import { useMoneyActions } from '../features/money/useMoneyActions';
import { useLinkActions } from '../features/links/useLinkActions';
import { useNoteActions } from '../features/notes/useNoteActions';
import { useProfileActions } from '../features/profile/useProfileActions';

export function AppShell({ user }: { user: import('firebase/auth').User | null }) {
  const store = useAppStore();
  const data = useAppStore(selectData);
  const isPartner = useAppStore(selectIsPartner);
  const partnerName = useAppStore(selectPartnerName);
  const { tab, viewMode, profileOpen, editing, confirm, toast, confettiTrigger, crown, dataLoading } = store;
  const isWeb = useIsWeb();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [calDate, setCalDate] = useState(TODAY_KEY);
  useFirestoreSync(user);

  // true when we should write to Firestore instead of in-memory store
  const fs = IS_CONFIGURED && !!user;

  // When viewing partner, writes target the partner's Firestore collection and local store slice.
  const activeUid = isPartner ? store.partnerProfile.uid : (user?.uid ?? '');
  const setActiveData = isPartner ? store.setLuisData : store.setYleData;

  const tapRef = useRef({ count: 0, timer: 0 as unknown as ReturnType<typeof setTimeout> });

  // easter egg: triple-tap the h1 title
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

  // Push notification state — track whether permission is granted and a token is saved
  const [pushEnabled, setPushEnabled] = useState(
    IS_CONFIGURED && typeof Notification !== 'undefined' && Notification.permission === 'granted',
  );

  // Show foreground push notifications as in-app toasts
  useEffect(() => {
    if (!fs) return;
    return listenForegroundMessages(({ title, body }) => {
      store.flash(body ? `${title}: ${body}` : title);
    });
  }, [fs]);

  // Keep today's summary fresh in Firestore so the morning cron can send dynamic content.
  useEffect(() => {
    if (dataLoading || !fs || !user) return;
    const own = store.yleData;
    const openTasks     = (own.tasks[TODAY_KEY] ?? []).filter((t) => !t.done).length;
    const pendingHabits = own.habits.filter((h) => !(h.completedDates ?? []).includes(TODAY_KEY)).length;
    const dueBills      = own.bills.filter((b) => b.status !== 'paid').length;
    const parts: string[] = [];
    if (openTasks     > 0) parts.push(`${openTasks} task${openTasks > 1 ? 's' : ''}`);
    if (pendingHabits > 0) parts.push(`${pendingHabits} habit${pendingHabits > 1 ? 's' : ''}`);
    if (dueBills      > 0) parts.push(`${dueBills} bill${dueBills > 1 ? 's' : ''} due`);
    void savePushSummary(user.uid, parts.length > 0 ? parts.join(' · ') : 'Everything is on track ?');
  }, [dataLoading, store.yleData, fs, user]);

  // --- Push notifications ---
  // --- helpers ---
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

  const {
    reorderTasks,
    moveTask,
    saveTask,
    deleteTask,
    checkTask,
  } = useTaskActions({ data, fs, activeUid, setActiveData, onComplete: maybe });

  const {
    saveHabit,
    deleteHabit,
    archiveHabit,
    restoreHabit,
    toggleTrackerDate,
  } = useHabitActions({ data, fs, activeUid, setActiveData, onComplete: maybe });

  const {
    saveTx,
    deleteTx,
    saveAccount,
    deleteAccount,
    saveCategory,
    deleteCategory,
    saveBill,
    deleteBill,
    toggleBillPaid,
    saveDebt,
    deleteDebt,
    recordDebtPayment,
  } = useMoneyActions({ data, fs, activeUid, setActiveData, onComplete: maybe });

  const {
    reorderLinkCategories,
    saveLinkCategory,
    deleteLinkCategory,
    archiveLinkCategory,
    restoreLinkCategory,
    reorderLinks,
    saveLink,
    deleteLink,
    archiveLink,
    restoreLink,
  } = useLinkActions({ data, fs, activeUid, setActiveData });

  const {
    reorderNotes,
    updateNoteContent,
    saveNote,
    deleteNote,
    archiveNote,
    restoreNote,
  } = useNoteActions({ fs, activeUid, setActiveData });

  const {
    handleSignOut,
    handleEnableNotifications,
    togglePrivacy,
    createPartnerInvite,
    acceptPartnerInvite,
    unlinkCurrentPartner,
  } = useProfileActions({ user, fs, onPushEnabled: () => setPushEnabled(true) });

  // Show loading screen while Firestore fetches initial data
  if (dataLoading) return <div className="auth-loading paper-grain" />;

  // --- FAB action ---
  const fabAction = (() => {
    if (tab === 'today' || tab === 'cal') return 'task';
    if (tab === 'habits') return 'habit';
    if (tab === 'money') return 'tx';
    if (tab === 'links') return 'link-category';
    if (tab === 'notes') return 'note';
    return null;
  })();

  const meInitial = (store.meProfile.displayName || store.meProfile.email || '?').charAt(0).toUpperCase();
  const profileInitial = isPartner
    ? partnerName.charAt(0).toUpperCase()
    : meInitial;

  const sharedScreenProps = {
    data,
    viewMode,
    isPartner,
    profileInitial,
    onProfile: () => store.setProfileOpen(true),
    onEdit: store.setEditing,
    onReorderTasks: reorderTasks,
    onMoveTask: moveTask,
  };

  // --- shared overlays (forms, profile, toast, confirm, confetti) ---
  const overlays = (
    <>
      <FocusTimerManager />
      <Confetti trigger={confettiTrigger} />

      {crown && (
        <div className="crown fade-in">
          <div style={{
            fontFamily: 'var(--serif)', fontStyle: 'italic',
            fontSize: 64, color: 'var(--clay)', textAlign: 'center',
            textShadow: '0 4px 24px rgba(143, 29, 43, 0.4)',
          }}>
            ?<br />
            <span style={{ fontSize: 18, color: 'var(--ink)' }}>for yle</span>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          action={toast.action}
          onAction={toast.onAction}
          onDismiss={() => store.setToast(null)}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={store.clearConfirm}
        />
      )}

      {profileOpen && (
        <ProfileSheet
          onClose={() => store.setProfileOpen(false)}
          viewMode={viewMode}
          onSwitchView={store.switchView}
          privacy={store.yleData.privacy}
          onPrivacyToggle={togglePrivacy}
          partnerLinked={!!store.meProfile.partnerId}
          partnerName={partnerName}
          user={user}
          onSignOut={handleSignOut}
          onEnableNotifications={handleEnableNotifications}
          pushEnabled={pushEnabled}
          onCreateInvite={createPartnerInvite}
          onAcceptInvite={acceptPartnerInvite}
          onUnlink={unlinkCurrentPartner}
        />
      )}

      {editing?.type === 'task-view' && (
        <TaskViewModal
          task={editing.item}
          dateKey={editing.dateKey}
          onEdit={() => store.setEditing({ type: 'task', item: editing.item, dateKey: editing.dateKey })}
          onDelete={() => confirmDelete('this task', () => deleteTask(editing.item.id, editing.dateKey))}
          onCheck={() => checkTask(editing.item.id, editing.dateKey)}
          onClose={() => store.setEditing(null)}
        />
      )}
      {editing?.type === 'task' && (
        <TaskForm
          task={editing.item}
          dateKey={editing.dateKey ?? TODAY_KEY}
          onSave={saveTask}
          onDelete={(id, dk) => confirmDelete('this task', () => deleteTask(id, dk))}
          onClose={() => store.setEditing(null)}
        />
      )}
      {editing?.type === 'habit' && (
        <HabitForm
          habit={editing.item}
          onSave={saveHabit}
          onDelete={(id) => confirmDelete('this tracker', () => deleteHabit(id))}
          onArchive={editing.item ? () => (editing.item!.archived ? restoreHabit(editing.item!) : archiveHabit(editing.item!)) : undefined}
          archiveLabel={editing.item?.archived ? 'Restore' : 'Archive'}
          onClose={() => store.setEditing(null)}
        />
      )}
      {editing?.type === 'tx' && (
        <TransactionForm
          tx={editing.item}
          banks={data.banks}
          onSave={saveTx}
          onDelete={(id) => confirmDelete('this entry', () => deleteTx(id))}
          onClose={() => store.setEditing(null)}
        />
      )}
      {editing?.type === 'account' && (
        <AccountForm
          acct={editing.item}
          onSave={saveAccount}
          onDelete={(id) => confirmDelete('this account', () => deleteAccount(id))}
          onClose={() => store.setEditing(null)}
        />
      )}
      {editing?.type === 'category' && (
        <CategoryForm
          cat={editing.item}
          banks={data.banks}
          onSave={saveCategory}
          onDelete={(id) => confirmDelete('this category', () => deleteCategory(id))}
          onClose={() => store.setEditing(null)}
        />
      )}
      {editing?.type === 'bill' && (
        <BillForm
          bill={editing.item}
          onSave={saveBill}
          onDelete={(id) => confirmDelete('this bill', () => deleteBill(id))}
          onClose={() => store.setEditing(null)}
        />
      )}
      {editing?.type === 'debt' && (
        <DebtForm
          debt={editing.item}
          onSave={saveDebt}
          onDelete={(id) => confirmDelete('this debt', () => deleteDebt(id))}
          onClose={() => store.setEditing(null)}
        />
      )}
      {editing?.type === 'link-category' && (
        <LinkCategoryForm
          cat={editing.item}
          onSave={saveLinkCategory}
          onDelete={(id) => confirmDelete('this category', () => deleteLinkCategory(id))}
          onArchive={editing.item ? () => (editing.item!.archived ? restoreLinkCategory(editing.item!) : archiveLinkCategory(editing.item!)) : undefined}
          archiveLabel={editing.item?.archived ? 'Restore' : 'Archive'}
          onClose={() => store.setEditing(null)}
        />
      )}
      {editing?.type === 'link-item' && (
        <LinkItemForm
          link={editing.item}
          categoryId={editing.categoryId ?? ''}
          onSave={saveLink}
          onDelete={(id) => confirmDelete('this link', () => deleteLink(id))}
          onArchive={editing.item ? () => (editing.item!.archived ? restoreLink(editing.item!) : archiveLink(editing.item!)) : undefined}
          archiveLabel={editing.item?.archived ? 'Restore' : 'Archive'}
          onClose={() => store.setEditing(null)}
        />
      )}
      {editing?.type === 'note' && (
        <NoteForm
          note={editing.item}
          onSave={saveNote}
          onDelete={(id) => confirmDelete('this note', () => deleteNote(id))}
          onArchive={editing.item ? () => (editing.item!.archived ? restoreNote(editing.item!) : archiveNote(editing.item!)) : undefined}
          archiveLabel={editing.item?.archived ? 'Restore' : 'Archive'}
          onClose={() => store.setEditing(null)}
        />
      )}
    </>
  );

  // --- web layout (= 1024px) ---
  if (isWeb) {
    return (
      <div className={`web-layout paper-grain${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <Sidebar
          tab={tab}
          onTab={store.setTab}
          viewMode={viewMode}
          onProfile={() => store.setProfileOpen(true)}
          onSwitchView={store.switchView}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
          meInitial={meInitial}
          meName={store.meProfile.displayName || store.meProfile.email || 'Me'}
          meEmail={store.meProfile.email || ''}
          partnerName={partnerName}
          partnerLinked={!!store.meProfile.partnerId}
        />
        <main className="web-content">
          {isPartner && (
            <div className="partner-bar fade-in">
              <div>
                Viewing & editing <strong style={{ fontWeight: 600 }}>{partnerName}'s</strong> data
              </div>
              <button onClick={store.switchView}>? Back to me</button>
            </div>
          )}
          <div key={tab + viewMode} className="fade-in">
            {tab === 'today' && (
              <WebTodayScreen
                data={data} isPartner={isPartner} viewMode={viewMode}
                onEdit={store.setEditing} onCheckTask={checkTask} onTrackDate={toggleTrackerDate} onMarkPaid={toggleBillPaid}
              />
            )}
            {tab === 'cal' && (
              <WebPlanScreen
                data={data} isPartner={isPartner}
                onEdit={store.setEditing} onCheckTask={checkTask}
                onReorderTasks={reorderTasks}
                onMoveTask={moveTask}
              />
            )}{tab === 'habits' && (
              <WebHabitsScreen
                data={data} isPartner={isPartner}
                onEdit={store.setEditing} onTrackDate={toggleTrackerDate}
              />
            )}
            {tab === 'money' && (
              <WebMoneyScreen
                data={data} isPartner={isPartner}
                onEdit={store.setEditing} onMarkPaid={toggleBillPaid}
              />
            )}
            {tab === 'links' && (
              <WebLinksScreen
                data={data} isPartner={isPartner}
                onEdit={store.setEditing}
                onReorder={reorderLinkCategories}
                onReorderLinks={reorderLinks}
              />
            )}
            {tab === 'notes' && (
              <WebNotesScreen
                data={data} isPartner={isPartner}
                onEdit={store.setEditing}
                onReorder={reorderNotes}
                onUpdateNote={updateNoteContent}
              />
            )}
            {tab === 'focus' && (
              <WebFocusScreen />
            )}
          </div>
        </main>
        {overlays}
      </div>
    );
  }

  // --- mobile layout (< 1024px) ---
  return (
    <div className="mobile-shell">
      {isPartner && (
        <PartnerBanner name={partnerName} onReturn={store.switchView} />
      )}

      <div
        key={tab + viewMode}
        className="fade-in"
        style={{
          position: 'absolute',
          inset: 0,
          top: isPartner ? 48 : 0,
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        {tab === 'today' && (
          <TodayScreen {...sharedScreenProps} partnerName={partnerName} onCheck={checkTask} />
        )}
        {tab === 'cal' && (
          <CalendarScreen {...sharedScreenProps} onCheck={checkTask} onSelectedChange={setCalDate} />
        )}
        {tab === 'habits' && (
          <HabitsScreen {...sharedScreenProps} onTrackDate={toggleTrackerDate} />
        )}
        {tab === 'money' && (
          <MoneyScreen {...sharedScreenProps} onMarkPaid={toggleBillPaid} onPayDebt={recordDebtPayment} />
        )}
        {tab === 'links' && (
          <LinksScreen {...sharedScreenProps} onReorder={reorderLinkCategories} onReorderLinks={reorderLinks} />
        )}
        {tab === 'notes' && (
          <NotesScreen {...sharedScreenProps} />
        )}
        {tab === 'focus' && (
          <FocusScreen viewMode={viewMode} isPartner={isPartner} profileInitial={profileInitial} onProfile={() => store.setProfileOpen(true)} />
        )}
      </div>

      {fabAction && !editing && !profileOpen && !confirm && (
        <button
          className="fab fade-in"
          onClick={() => store.setEditing(
            fabAction === 'task'
              ? { type: 'task', dateKey: tab === 'cal' ? calDate : TODAY_KEY }
              : fabAction === 'note'
              ? { type: 'note' }
              : { type: fabAction as 'habit' | 'tx' | 'link-category' }
          )}
          title={fabAction === 'task' ? 'New task' : fabAction === 'habit' ? 'New tracker' : fabAction === 'note' ? 'New note' : 'Log spend'}
        >
          {Icons.plus({ stroke: 'var(--cream)' })}
        </button>
      )}

      <BottomNav tab={tab} onTab={store.setTab} partner={isPartner} />

      {overlays}
    </div>
  );
}
