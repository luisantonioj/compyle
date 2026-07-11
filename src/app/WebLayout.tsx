import { Suspense, lazy } from 'react';
import { useAppStore } from '../store/appStore';
import { Sidebar } from '../components/layout/Sidebar';
import type { LayoutBaseProps } from './appTypes';

const WebTodayScreen = lazy(() => import('../screens/web/WebTodayScreen').then((module) => ({ default: module.WebTodayScreen })));
const WebPlanScreen = lazy(() => import('../screens/web/WebPlanScreen').then((module) => ({ default: module.WebPlanScreen })));
const WebHabitsScreen = lazy(() => import('../screens/web/WebHabitsScreen').then((module) => ({ default: module.WebHabitsScreen })));
const WebMoneyScreen = lazy(() => import('../screens/web/WebMoneyScreen').then((module) => ({ default: module.WebMoneyScreen })));
const WebLinksScreen = lazy(() => import('../screens/web/WebLinksScreen').then((module) => ({ default: module.WebLinksScreen })));
const WebNotesScreen = lazy(() => import('../screens/web/WebNotesScreen').then((module) => ({ default: module.WebNotesScreen })));
const WebFocusScreen = lazy(() => import('../screens/web/WebFocusScreen').then((module) => ({ default: module.WebFocusScreen })));

interface WebLayoutProps extends LayoutBaseProps {
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
  meInitial: string;
}

export function WebLayout({
  data,
  tab,
  viewMode,
  isPartner,
  partnerName,
  visibleTabs,
  overlays,
  taskHandlers,
  habitHandlers,
  moneyHandlers,
  linkHandlers,
  noteHandlers,
  sidebarCollapsed,
  onSidebarToggle,
  meInitial,
}: WebLayoutProps) {
  const store = useAppStore();

  return (
    <div className={`web-layout paper-grain${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar
        tab={tab}
        onTab={store.setTab}
        viewMode={viewMode}
        onProfile={() => store.setProfileOpen(true)}
        onSwitchView={store.switchView}
        collapsed={sidebarCollapsed}
        onToggle={onSidebarToggle}
        meInitial={meInitial}
        meName={store.meProfile.displayName || store.meProfile.email || 'Me'}
        meEmail={store.meProfile.email || ''}
        partnerName={partnerName}
        partnerLinked={!!store.meProfile.partnerId}
        visibleTabs={visibleTabs}
      />
      <main className="web-content">
        {isPartner && (
          <div className="partner-bar fade-in">
            <div>
              Viewing & editing <strong style={{ fontWeight: 600 }}>{partnerName}'s</strong> data
            </div>
            <button onClick={store.switchView}>Back to me</button>
          </div>
        )}
        <Suspense fallback={<div className="auth-loading" />}>
          <div key={tab + viewMode} className="fade-in">
            {tab === 'today' && (
              <WebTodayScreen
                data={data} isPartner={isPartner} viewMode={viewMode}
                onEdit={store.setEditing} onCheckTask={taskHandlers.checkTask}
                onTrackDate={habitHandlers.toggleTrackerDate} onMarkPaid={moneyHandlers.toggleBillPaid}
              />
            )}
            {tab === 'cal' && (
              <WebPlanScreen
                data={data} isPartner={isPartner}
                onEdit={store.setEditing} onCheckTask={taskHandlers.checkTask}
                onReorderTasks={taskHandlers.reorderTasks}
                onMoveTask={taskHandlers.moveTask}
              />
            )}
            {tab === 'habits' && (
              <WebHabitsScreen
                data={data} isPartner={isPartner}
                onEdit={store.setEditing} onTrackDate={habitHandlers.toggleTrackerDate}
                onReorderHabits={habitHandlers.reorderHabits}
              />
            )}
            {tab === 'money' && (
              <WebMoneyScreen
                data={data} isPartner={isPartner}
                onEdit={store.setEditing} onMarkPaid={moneyHandlers.toggleBillPaid}
              />
            )}
            {tab === 'links' && (
              <WebLinksScreen
                data={data} isPartner={isPartner}
                onEdit={store.setEditing}
                onReorder={linkHandlers.reorderLinkCategories}
                onReorderLinks={linkHandlers.reorderLinks}
              />
            )}
            {tab === 'notes' && (
              <WebNotesScreen
                data={data} isPartner={isPartner}
                onEdit={store.setEditing}
                onReorder={noteHandlers.reorderNotes}
                onUpdateNote={noteHandlers.updateNoteContent}
              />
            )}
            {tab === 'focus' && (
              <WebFocusScreen />
            )}
          </div>
        </Suspense>
      </main>
      {overlays}
    </div>
  );
}
