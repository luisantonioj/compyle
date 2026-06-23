import { useAppStore } from '../store/appStore';
import { Sidebar } from '../components/layout/Sidebar';
import { WebTodayScreen } from '../screens/web/WebTodayScreen';
import { WebPlanScreen } from '../screens/web/WebPlanScreen';
import { WebHabitsScreen } from '../screens/web/WebHabitsScreen';
import { WebMoneyScreen } from '../screens/web/WebMoneyScreen';
import { WebLinksScreen } from '../screens/web/WebLinksScreen';
import { WebNotesScreen } from '../screens/web/WebNotesScreen';
import { WebFocusScreen } from '../screens/web/WebFocusScreen';
import type { LayoutBaseProps } from './appTypes';

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
      </main>
      {overlays}
    </div>
  );
}

