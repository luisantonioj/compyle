import { Suspense, lazy } from 'react';
import { TODAY_KEY } from '../lib/seed';
import { Icons } from '../components/Icons';
import { BottomNav } from '../components/layout/BottomNav';
import { PartnerBanner } from '../components/ui/shared';
import { useAppStore } from '../store/appStore';
import type { EditingState, TabId } from '../types';
import type { ConfirmState, LayoutBaseProps } from './appTypes';

const TodayScreen = lazy(() => import('../screens/TodayScreen').then((module) => ({ default: module.TodayScreen })));
const CalendarScreen = lazy(() => import('../screens/CalendarScreen').then((module) => ({ default: module.CalendarScreen })));
const HabitsScreen = lazy(() => import('../screens/HabitsScreen').then((module) => ({ default: module.HabitsScreen })));
const MoneyScreen = lazy(() => import('../screens/MoneyScreen').then((module) => ({ default: module.MoneyScreen })));
const LinksScreen = lazy(() => import('../screens/LinksScreen').then((module) => ({ default: module.LinksScreen })));
const NotesScreen = lazy(() => import('../screens/NotesScreen').then((module) => ({ default: module.NotesScreen })));
const FocusScreen = lazy(() => import('../screens/FocusScreen').then((module) => ({ default: module.FocusScreen })));

interface MobileLayoutProps extends LayoutBaseProps {
  calDate: string;
  onCalendarDateChange: (dateKey: string) => void;
  profileOpen: boolean;
  editing: EditingState;
  confirm: ConfirmState | null;
}

export function MobileLayout({
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
  calDate,
  onCalendarDateChange,
  profileOpen,
  editing,
  confirm,
}: MobileLayoutProps) {
  const store = useAppStore();

  const sharedScreenProps = {
    data,
    viewMode,
    isPartner,
    profileInitial,
    onProfile: () => store.setProfileOpen(true),
    onEdit: store.setEditing,
    onReorderTasks: taskHandlers.reorderTasks,
    onMoveTask: taskHandlers.moveTask,
  };

  const fabAction = getFabAction(tab);

  return (
    <div className={`mobile-shell${isPartner ? ' partner-mode' : ''}`}>
      {isPartner && (
        <PartnerBanner name={partnerName} onReturn={store.switchView} />
      )}

      <div
        key={tab + viewMode}
        className="fade-in screen-wrapper"
      >
        <Suspense fallback={<div className="auth-loading" />}>
          {tab === 'today' && (
            <TodayScreen {...sharedScreenProps} partnerName={partnerName} onCheck={taskHandlers.checkTask} />
          )}
          {tab === 'cal' && (
            <CalendarScreen {...sharedScreenProps} onCheck={taskHandlers.checkTask} onSelectedChange={onCalendarDateChange} />
          )}
          {tab === 'habits' && (
            <HabitsScreen
              {...sharedScreenProps}
              onTrackDate={habitHandlers.toggleTrackerDate}
              onReorderHabits={habitHandlers.reorderHabits}
            />
          )}
          {tab === 'money' && (
            <MoneyScreen {...sharedScreenProps} onMarkPaid={moneyHandlers.toggleBillPaid} onPayDebt={moneyHandlers.recordDebtPayment} />
          )}
          {tab === 'links' && (
            <LinksScreen {...sharedScreenProps} onReorder={linkHandlers.reorderLinkCategories} onReorderLinks={linkHandlers.reorderLinks} />
          )}
          {tab === 'notes' && (
            <NotesScreen {...sharedScreenProps} />
          )}
          {tab === 'focus' && (
            <FocusScreen viewMode={viewMode} isPartner={isPartner} profileInitial={profileInitial} onProfile={() => store.setProfileOpen(true)} />
          )}
        </Suspense>
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

      <BottomNav tab={tab} onTab={store.setTab} partner={isPartner} visibleTabs={visibleTabs} />

      {overlays}
    </div>
  );
}

function getFabAction(tab: TabId) {
  if (tab === 'today' || tab === 'cal') return 'task';
  if (tab === 'habits') return 'habit';
  if (tab === 'money') return 'tx';
  if (tab === 'links') return 'link-category';
  if (tab === 'notes') return 'note';
  return null;
}
