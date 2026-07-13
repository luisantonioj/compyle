import { Suspense, lazy } from 'react';
import { TODAY_KEY } from '../lib/seed';
import { useAppStore } from '../store/appStore';
import { Confetti, ConfirmDialog } from '../components/ui/shared';
import { FocusTimerManager } from '../components/FocusTimerManager';
import { ProfileSheet } from '../screens/ProfileSheet';
import type { OverlayProps } from './appTypes';

const TaskForm = lazy(() => import('../features/tasks/TaskForm').then((module) => ({ default: module.TaskForm })));
const TaskViewModal = lazy(() => import('../features/tasks/TaskViewModal').then((module) => ({ default: module.TaskViewModal })));
const HabitForm = lazy(() => import('../features/habits/HabitForm').then((module) => ({ default: module.HabitForm })));
const TransactionForm = lazy(() => import('../features/money/MoneyForms').then((module) => ({ default: module.TransactionForm })));
const AccountForm = lazy(() => import('../features/money/MoneyForms').then((module) => ({ default: module.AccountForm })));
const CategoryForm = lazy(() => import('../features/money/MoneyForms').then((module) => ({ default: module.CategoryForm })));
const BillForm = lazy(() => import('../features/money/MoneyForms').then((module) => ({ default: module.BillForm })));
const DebtForm = lazy(() => import('../features/money/MoneyForms').then((module) => ({ default: module.DebtForm })));
const LinkCategoryForm = lazy(() => import('../features/links/LinkForms').then((module) => ({ default: module.LinkCategoryForm })));
const LinkItemForm = lazy(() => import('../features/links/LinkForms').then((module) => ({ default: module.LinkItemForm })));
const NoteForm = lazy(() => import('../features/notes/NoteForm').then((module) => ({ default: module.NoteForm })));

export function Overlays({
  user,
  data,
  viewMode,
  profileOpen,
  editing,
  confirm,
  confettiTrigger,
  crown,
  pushEnabled,
  partnerName,
  confirmDelete,
  taskHandlers,
  habitHandlers,
  moneyHandlers,
  linkHandlers,
  noteHandlers,
  profileHandlers,
}: OverlayProps) {
  const store = useAppStore();

  return (
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
            *<br />
            <span style={{ fontSize: 18, color: 'var(--ink)' }}>for yle</span>
          </div>
        </div>
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
          visibleTabs={store.visibleTabs}
          onVisibleTabToggle={store.toggleVisibleTab}
          navOrder={store.navOrder}
          onSaveNavigationPreferences={profileHandlers.saveNavigationPreferences}
          partnerLinked={!!store.meProfile.partnerId}
          partnerName={partnerName}
          user={user}
          onSignOut={profileHandlers.handleSignOut}
          onEnableNotifications={profileHandlers.handleEnableNotifications}
          pushEnabled={pushEnabled}
          onCreateInvite={profileHandlers.createPartnerInvite}
          onAcceptInvite={profileHandlers.acceptPartnerInvite}
          onUnlink={profileHandlers.unlinkCurrentPartner}
        />
      )}

      <Suspense fallback={<div className="auth-loading" />}>
        {editing?.type === 'task-view' && (
          <TaskViewModal
            task={editing.item}
            dateKey={editing.dateKey}
            onEdit={() => store.setEditing({ type: 'task', item: editing.item, dateKey: editing.dateKey })}
            onDelete={() => confirmDelete('this task', () => taskHandlers.deleteTask(editing.item.id, editing.dateKey))}
            onCheck={() => taskHandlers.checkTask(editing.item.id, editing.dateKey)}
            onClose={() => store.setEditing(null)}
          />
        )}
        {editing?.type === 'task' && (
          <TaskForm
            task={editing.item}
            dateKey={editing.dateKey ?? TODAY_KEY}
            taskTypes={data.taskTypes}
            onSave={taskHandlers.saveTask}
            onSaveTaskType={taskHandlers.saveTaskType}
            onDelete={(id, dk) => confirmDelete('this task', () => taskHandlers.deleteTask(id, dk))}
            onClose={() => store.setEditing(null)}
          />
        )}
        {editing?.type === 'habit' && (
          <HabitForm
            habit={editing.item}
            categories={data.habitCategories ?? []}
            onSave={habitHandlers.saveHabit}
            onSaveCategory={habitHandlers.saveHabitCategory}
            onDelete={(id) => confirmDelete('this tracker', () => habitHandlers.deleteHabit(id))}
            onArchive={editing.item ? () => (editing.item!.archived ? habitHandlers.restoreHabit(editing.item!) : habitHandlers.archiveHabit(editing.item!)) : undefined}
            archiveLabel={editing.item?.archived ? 'Restore' : 'Archive'}
            onClose={() => store.setEditing(null)}
          />
        )}
        {editing?.type === 'tx' && (
          <TransactionForm
            tx={editing.item}
            banks={data.banks}
            onSave={moneyHandlers.saveTx}
            onDelete={(id) => confirmDelete('this entry', () => moneyHandlers.deleteTx(id))}
            onClose={() => store.setEditing(null)}
          />
        )}
        {editing?.type === 'account' && (
          <AccountForm
            acct={editing.item}
            onSave={moneyHandlers.saveAccount}
            onDelete={(id) => confirmDelete('this account', () => moneyHandlers.deleteAccount(id))}
            onClose={() => store.setEditing(null)}
          />
        )}
        {editing?.type === 'category' && (
          <CategoryForm
            cat={editing.item}
            banks={data.banks}
            onSave={moneyHandlers.saveCategory}
            onDelete={(id) => confirmDelete('this category', () => moneyHandlers.deleteCategory(id))}
            onClose={() => store.setEditing(null)}
          />
        )}
        {editing?.type === 'bill' && (
          <BillForm
            bill={editing.item}
            onSave={moneyHandlers.saveBill}
            onDelete={(id) => confirmDelete('this bill', () => moneyHandlers.deleteBill(id))}
            onClose={() => store.setEditing(null)}
          />
        )}
        {editing?.type === 'debt' && (
          <DebtForm
            debt={editing.item}
            onSave={moneyHandlers.saveDebt}
            onDelete={(id) => confirmDelete('this debt', () => moneyHandlers.deleteDebt(id))}
            onClose={() => store.setEditing(null)}
          />
        )}
        {editing?.type === 'link-category' && (
          <LinkCategoryForm
            cat={editing.item}
            onSave={linkHandlers.saveLinkCategory}
            onDelete={(id) => confirmDelete('this category', () => linkHandlers.deleteLinkCategory(id))}
            onArchive={editing.item ? () => (editing.item!.archived ? linkHandlers.restoreLinkCategory(editing.item!) : linkHandlers.archiveLinkCategory(editing.item!)) : undefined}
            archiveLabel={editing.item?.archived ? 'Restore' : 'Archive'}
            onClose={() => store.setEditing(null)}
          />
        )}
        {editing?.type === 'link-item' && (
          <LinkItemForm
            link={editing.item}
            categoryId={editing.categoryId ?? ''}
            onSave={linkHandlers.saveLink}
            onDelete={(id) => confirmDelete('this link', () => linkHandlers.deleteLink(id))}
            onArchive={editing.item ? () => (editing.item!.archived ? linkHandlers.restoreLink(editing.item!) : linkHandlers.archiveLink(editing.item!)) : undefined}
            archiveLabel={editing.item?.archived ? 'Restore' : 'Archive'}
            onClose={() => store.setEditing(null)}
          />
        )}
        {editing?.type === 'note' && (
          <NoteForm
            note={editing.item}
            onSave={noteHandlers.saveNote}
            onAutosave={noteHandlers.updateNoteContent}
            onDelete={(id) => confirmDelete('this note', () => noteHandlers.deleteNote(id))}
            onArchive={editing.item ? () => (editing.item!.archived ? noteHandlers.restoreNote(editing.item!) : noteHandlers.archiveNote(editing.item!)) : undefined}
            archiveLabel={editing.item?.archived ? 'Restore' : 'Archive'}
            onClose={() => store.setEditing(null)}
          />
        )}
      </Suspense>
    </>
  );
}
