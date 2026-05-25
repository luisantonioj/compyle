// compyle — root app component
import React, { useEffect, useRef, useState } from 'react';
import { signOut } from 'firebase/auth';
import { useAppStore, selectData, selectIsPartner, selectPartnerName } from './store/appStore';
import { TODAY_KEY } from './lib/seed';
import { Icons } from './components/Icons';
import { BottomNav } from './components/layout/BottomNav';
import { Sidebar } from './components/layout/Sidebar';
import { Confetti, Toast, ConfirmDialog, PartnerBanner } from './components/ui/shared';
import { TodayScreen } from './screens/TodayScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { HabitsScreen } from './screens/HabitsScreen';
import { MoneyScreen } from './screens/MoneyScreen';
import { WebTodayScreen } from './screens/web/WebTodayScreen';
import { WebPlanScreen } from './screens/web/WebPlanScreen';
import { WebHabitsScreen } from './screens/web/WebHabitsScreen';
import { WebMoneyScreen } from './screens/web/WebMoneyScreen';
import { ProfileSheet } from './screens/ProfileSheet';
import { AuthScreen } from './screens/AuthScreen';
import {
  TaskForm, HabitForm, TransactionForm,
  AccountForm, CategoryForm, BillForm, DebtForm,
} from './components/forms/Forms';
import { useIsWeb } from './hooks/useIsWeb';
import { useAuth } from './hooks/useAuth';
import { useFirestoreSync } from './hooks/useFirestoreSync';
import { auth, IS_CONFIGURED } from './lib/firebase';
import { enablePushNotifications, listenForegroundMessages } from './lib/messaging';
import {
  upsertTask, removeTask,
  upsertHabit, removeHabit,
  upsertTx, removeTx,
  upsertBank, removeBank,
  upsertBill, removeBill,
  upsertDebt, removeDebt,
  savePrivacy,
  savePushSummary,
} from './lib/db';
import type { Task, Habit, Transaction, BankAccount, Category, Bill, Debt, PrivacySettings } from './types';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="auth-loading paper-grain" />;
  if (IS_CONFIGURED && !user) return <AuthScreen />;

  return <AppShell user={user} />;
}

function AppShell({ user }: { user: import('firebase/auth').User | null }) {
  const store = useAppStore();
  const data = useAppStore(selectData);
  const isPartner = useAppStore(selectIsPartner);
  const partnerName = useAppStore(selectPartnerName);
  const { tab, viewMode, profileOpen, editing, confirm, toast, confettiTrigger, crown, dataLoading } = store;
  const isWeb = useIsWeb();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [calDate, setCalDate] = useState(TODAY_KEY);
  useFirestoreSync(user);

  const handleSignOut = async () => {
    if (auth) await signOut(auth);
    store.setProfileOpen(false);
  };

  // true when we should write to Firestore instead of in-memory store
  const fs = IS_CONFIGURED && !!user;

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
    const pendingHabits = own.habits.filter((h) => !h.doneToday).length;
    const dueBills      = own.bills.filter((b) => b.status !== 'paid').length;
    const parts: string[] = [];
    if (openTasks     > 0) parts.push(`${openTasks} task${openTasks > 1 ? 's' : ''}`);
    if (pendingHabits > 0) parts.push(`${pendingHabits} habit${pendingHabits > 1 ? 's' : ''}`);
    if (dueBills      > 0) parts.push(`${dueBills} bill${dueBills > 1 ? 's' : ''} due`);
    void savePushSummary(user.uid, parts.length > 0 ? parts.join(' · ') : 'Everything is on track ✓');
  }, [dataLoading, store.yleData, fs, user]);

  // Show loading screen while Firestore fetches initial data
  if (dataLoading) return <div className="auth-loading paper-grain" />;

  // ─── Push notifications ───
  const handleEnableNotifications = async () => {
    if (!user) return;
    const ok = await enablePushNotifications(user.uid);
    if (ok) {
      setPushEnabled(true);
      store.flash('Notifications enabled ✓');
    } else if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      store.flash('Notifications blocked — enable in browser settings');
    }
  };

  // ─── helpers ───
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

  // ─── Task CRUD ───
  const saveTask = (task: Task, dateKey: string) => {
    if (fs) {
      void upsertTask(user!.uid, task, dateKey);
    } else {
      store.setYleData((d) => {
        const day = d.tasks[dateKey] ?? [];
        const existed = day.find((t) => t.id === task.id);
        const newDay = existed ? day.map((t) => (t.id === task.id ? task : t)) : [...day, task];
        return { ...d, tasks: { ...d.tasks, [dateKey]: newDay } };
      });
    }
    store.setEditing(null);
    store.flash(editing && 'item' in editing && editing.item ? 'Task updated' : 'Task added ✨');
  };

  const deleteTask = (taskId: string, dateKey: string) => {
    const removed = (store.yleData.tasks[dateKey] ?? []).find((t) => t.id === taskId);
    store.setEditing(null);
    if (fs) {
      void removeTask(user!.uid, taskId);
    } else {
      store.setYleData((d) => {
        const day = d.tasks[dateKey] ?? [];
        return { ...d, tasks: { ...d.tasks, [dateKey]: day.filter((t) => t.id !== taskId) } };
      });
    }
    store.flash('Task deleted', 'Undo', () => {
      if (removed) saveTask(removed, dateKey);
      store.setToast(null);
    });
  };

  const checkTask = (taskId: string, dateKey = TODAY_KEY) => {
    if (fs) {
      const task = (store.yleData.tasks[dateKey] ?? []).find((t) => t.id === taskId);
      if (!task) return;
      const nowDone = !task.done;
      if (nowDone) maybe();
      void upsertTask(user!.uid, { ...task, done: nowDone }, dateKey);
    } else {
      store.setYleData((d) => {
        const dayTasks = (d.tasks[dateKey] ?? []).map((t) =>
          t.id === taskId ? { ...t, done: !t.done } : t
        );
        const nowDone = dayTasks.find((t) => t.id === taskId)?.done;
        if (nowDone) maybe();
        return { ...d, tasks: { ...d.tasks, [dateKey]: dayTasks } };
      });
    }
  };

  // ─── Habit CRUD ───
  const saveHabit = (h: Habit) => {
    if (fs) {
      void upsertHabit(user!.uid, h);
    } else {
      store.setYleData((d) => {
        const existed = d.habits.find((x) => x.id === h.id);
        const habits = existed ? d.habits.map((x) => (x.id === h.id ? h : x)) : [...d.habits, h];
        return { ...d, habits };
      });
    }
    store.setEditing(null);
    store.flash(editing && 'item' in editing && editing.item ? 'Habit updated' : 'New habit started 🌱');
  };

  const deleteHabit = (id: string) => {
    const removed = store.yleData.habits.find((h) => h.id === id);
    store.setEditing(null);
    if (fs) {
      void removeHabit(user!.uid, id);
    } else {
      store.setYleData((d) => ({ ...d, habits: d.habits.filter((h) => h.id !== id) }));
    }
    store.flash('Habit deleted', 'Undo', () => {
      if (removed) saveHabit(removed);
      store.setToast(null);
    });
  };

  const checkHabit = (habitId: string) => {
    if (fs) {
      const habit = store.yleData.habits.find((h) => h.id === habitId);
      if (!habit) return;
      const flipped = !habit.doneToday;
      const newStreak = flipped ? habit.streak + 1 : Math.max(0, habit.streak - 1);
      if (flipped && (newStreak % 7 === 0 || newStreak >= 30)) maybe();
      else if (flipped) maybe(0.3);
      const patArr = habit.pattern.split(',');
      patArr[patArr.length - 1] = flipped ? 'on' : 'off';
      void upsertHabit(user!.uid, { ...habit, doneToday: flipped, streak: newStreak, doneDate: TODAY_KEY, pattern: patArr.join(',') });
    } else {
      store.setYleData((d) => {
        const habits = d.habits.map((h) => {
          if (h.id !== habitId) return h;
          const flipped = !h.doneToday;
          const newStreak = flipped ? h.streak + 1 : Math.max(0, h.streak - 1);
          if (flipped && (newStreak % 7 === 0 || newStreak >= 30)) maybe();
          else if (flipped) maybe(0.3);
          const patArr = h.pattern.split(',');
          patArr[patArr.length - 1] = flipped ? 'on' : 'off';
          return { ...h, doneToday: flipped, streak: newStreak, pattern: patArr.join(',') };
        });
        return { ...d, habits };
      });
    }
  };

  // ─── Transaction CRUD ───
  const applyTx = (banks: BankAccount[], bankId: string, catId: string, delta: number): BankAccount[] =>
    banks.map((b) => {
      if (b.id !== bankId) return b;
      const cats = (b.categories ?? []).map((c) =>
        c.id === catId ? { ...c, balance: (c.balance ?? 0) + delta } : c
      );
      return { ...b, balance: (b.balance ?? 0) + delta, categories: cats };
    });

  const saveTx = (tx: Transaction) => {
    if (fs) {
      const d = store.yleData;
      const existed = d.transactions.find((t) => t.id === tx.id);
      let banks = d.banks;
      if (existed) {
        if (existed.bank && existed.cat) banks = applyTx(banks, existed.bank, existed.cat, -existed.amt);
        if (tx.bank && tx.cat) banks = applyTx(banks, tx.bank, tx.cat, tx.amt);
      } else if (tx.bank && tx.cat) {
        banks = applyTx(banks, tx.bank, tx.cat, tx.amt);
      }
      void upsertTx(user!.uid, tx);
      const affectedIds = new Set([tx.bank, existed?.bank].filter(Boolean) as string[]);
      banks.filter((b) => affectedIds.has(b.id)).forEach((b) => void upsertBank(user!.uid, b));
    } else {
      store.setYleData((d) => {
        const existed = d.transactions.find((t) => t.id === tx.id);
        let banks = d.banks;
        if (existed) {
          if (existed.bank && existed.cat) banks = applyTx(banks, existed.bank, existed.cat, -existed.amt);
          if (tx.bank && tx.cat) banks = applyTx(banks, tx.bank, tx.cat, tx.amt);
          return { ...d, transactions: d.transactions.map((t) => (t.id === tx.id ? tx : t)), banks };
        }
        if (tx.bank && tx.cat) banks = applyTx(banks, tx.bank, tx.cat, tx.amt);
        return { ...d, transactions: [tx, ...d.transactions], banks };
      });
    }
    store.setEditing(null);
    store.flash(editing && 'item' in editing && editing.item ? 'Updated' : tx.amt > 0 ? 'Money in 💰' : 'Logged');
  };

  const deleteTx = (id: string) => {
    const removed = store.yleData.transactions.find((t) => t.id === id);
    store.setEditing(null);
    if (fs) {
      let banks = store.yleData.banks;
      if (removed?.bank && removed?.cat) banks = applyTx(banks, removed.bank, removed.cat, -removed.amt);
      void removeTx(user!.uid, id);
      if (removed?.bank) {
        const affected = banks.find((b) => b.id === removed!.bank);
        if (affected) void upsertBank(user!.uid, affected);
      }
    } else {
      store.setYleData((d) => {
        const rem = d.transactions.find((t) => t.id === id);
        let banks = d.banks;
        if (rem?.bank && rem?.cat) banks = applyTx(banks, rem.bank, rem.cat, -rem.amt);
        return { ...d, transactions: d.transactions.filter((t) => t.id !== id), banks };
      });
    }
    store.flash('Removed', 'Undo', () => { if (removed) saveTx(removed); store.setToast(null); });
  };

  // ─── Account CRUD ───
  const saveAccount = (acct: BankAccount) => {
    if (fs) {
      void upsertBank(user!.uid, acct);
    } else {
      store.setYleData((d) => {
        const existed = d.banks.find((b) => b.id === acct.id);
        const banks = existed ? d.banks.map((b) => (b.id === acct.id ? acct : b)) : [...d.banks, acct];
        return { ...d, banks };
      });
    }
    store.setEditing(null);
    store.flash(editing && 'item' in editing && editing.item ? 'Account updated' : 'Account added');
  };

  const deleteAccount = (id: string) => {
    const removed = store.yleData.banks.find((b) => b.id === id);
    store.setEditing(null);
    if (fs) {
      void removeBank(user!.uid, id);
    } else {
      store.setYleData((d) => ({ ...d, banks: d.banks.filter((b) => b.id !== id) }));
    }
    store.flash('Account removed', 'Undo', () => { if (removed) saveAccount(removed); store.setToast(null); });
  };

  // ─── Category CRUD ───
  const saveCategory = (cat: Category & { bankId?: string }) => {
    const { bankId, ...rest } = cat;
    if (fs) {
      let banks = store.yleData.banks.map((b) => {
        if ((b.categories ?? []).some((c) => c.id === cat.id)) {
          return { ...b, categories: (b.categories ?? []).filter((c) => c.id !== cat.id) };
        }
        return b;
      });
      if (bankId) {
        banks = banks.map((b) =>
          b.id === bankId ? { ...b, categories: [...(b.categories ?? []), rest] } : b
        );
      }
      void Promise.all(banks.map((b) => upsertBank(user!.uid, b)));
    } else {
      store.setYleData((d) => {
        let banks = d.banks.map((b) => {
          if ((b.categories ?? []).some((c) => c.id === cat.id)) {
            return { ...b, categories: (b.categories ?? []).filter((c) => c.id !== cat.id) };
          }
          return b;
        });
        if (bankId) {
          banks = banks.map((b) =>
            b.id === bankId ? { ...b, categories: [...(b.categories ?? []), rest] } : b
          );
        }
        return { ...d, banks };
      });
    }
    store.setEditing(null);
    store.flash(editing && 'item' in editing && editing.item ? 'Category updated' : 'Category added');
  };

  const deleteCategory = (id: string) => {
    let removed: Category | undefined;
    let removedBankId: string | undefined;
    store.yleData.banks.forEach((b) => {
      const found = (b.categories ?? []).find((c) => c.id === id);
      if (found) { removed = found; removedBankId = b.id; }
    });
    store.setEditing(null);
    if (fs) {
      const banks = store.yleData.banks.map((b) => ({
        ...b, categories: (b.categories ?? []).filter((c) => c.id !== id),
      }));
      void Promise.all(banks.map((b) => upsertBank(user!.uid, b)));
    } else {
      store.setYleData((d) => {
        const banks = d.banks.map((b) => ({
          ...b, categories: (b.categories ?? []).filter((c) => c.id !== id),
        }));
        return { ...d, banks };
      });
    }
    store.flash('Category removed', 'Undo', () => {
      if (removed) saveCategory({ ...removed, bankId: removedBankId });
      store.setToast(null);
    });
  };

  // ─── Bill CRUD ───
  const saveBill = (b: Bill) => {
    if (fs) {
      void upsertBill(user!.uid, b);
    } else {
      store.setYleData((d) => {
        const existed = d.bills.find((x) => x.id === b.id);
        return { ...d, bills: existed ? d.bills.map((x) => (x.id === b.id ? b : x)) : [...d.bills, b] };
      });
    }
    store.setEditing(null);
    store.flash(editing && 'item' in editing && editing.item ? 'Bill updated' : 'Bill added');
  };

  const deleteBill = (id: string) => {
    const removed = store.yleData.bills.find((b) => b.id === id);
    store.setEditing(null);
    if (fs) {
      void removeBill(user!.uid, id);
    } else {
      store.setYleData((d) => ({ ...d, bills: d.bills.filter((b) => b.id !== id) }));
    }
    store.flash('Bill removed', 'Undo', () => { if (removed) saveBill(removed); store.setToast(null); });
  };

  const toggleBillPaid = (id: string) => {
    if (fs) {
      const bill = store.yleData.bills.find((b) => b.id === id);
      if (!bill) return;
      const next = bill.status === 'paid' ? 'due' : 'paid';
      if (next === 'paid') maybe(0.6);
      void upsertBill(user!.uid, { ...bill, status: next });
    } else {
      store.setYleData((d) => {
        const bills = d.bills.map((b) => {
          if (b.id !== id) return b;
          const next = b.status === 'paid' ? 'due' : 'paid';
          if (next === 'paid') maybe(0.6);
          return { ...b, status: next } as Bill;
        });
        return { ...d, bills };
      });
    }
  };

  // ─── Debt CRUD ───
  const saveDebt = (debt: Debt) => {
    if (fs) {
      void upsertDebt(user!.uid, debt);
    } else {
      store.setYleData((d) => {
        const existed = d.debts.find((x) => x.id === debt.id);
        const debts = existed ? d.debts.map((x) => (x.id === debt.id ? debt : x)) : [...d.debts, debt];
        return { ...d, debts };
      });
    }
    store.setEditing(null);
    store.flash(editing && 'item' in editing && editing.item ? 'Debt updated' : 'Tracking 💪');
  };

  const deleteDebt = (id: string) => {
    const removed = store.yleData.debts.find((b) => b.id === id);
    store.setEditing(null);
    if (fs) {
      void removeDebt(user!.uid, id);
    } else {
      store.setYleData((d) => ({ ...d, debts: d.debts.filter((b) => b.id !== id) }));
    }
    store.flash('Debt removed', 'Undo', () => { if (removed) saveDebt(removed); store.setToast(null); });
  };

  const recordDebtPayment = (id: string) => {
    if (fs) {
      const debt = store.yleData.debts.find((d) => d.id === id);
      if (!debt) return;
      const monthlyAmt = debt.months > 0 ? debt.total / debt.months : 0;
      const newPaid = Math.min(debt.total, debt.paid + monthlyAmt);
      const newPaidMonths = Math.min(debt.months, debt.paidMonths + 1);
      if (newPaid >= debt.total) maybe();
      void upsertDebt(user!.uid, { ...debt, paid: newPaid, paidMonths: newPaidMonths });
    } else {
      store.setYleData((d) => {
        const debts = d.debts.map((deb) => {
          if (deb.id !== id) return deb;
          const monthlyAmt = deb.months > 0 ? deb.total / deb.months : 0;
          const newPaid = Math.min(deb.total, deb.paid + monthlyAmt);
          const newPaidMonths = Math.min(deb.months, deb.paidMonths + 1);
          if (newPaid >= deb.total) maybe();
          return { ...deb, paid: newPaid, paidMonths: newPaidMonths };
        });
        return { ...d, debts };
      });
    }
    store.flash('Payment recorded ✓');
  };

  // ─── Privacy ───
  const togglePrivacy = (key: keyof PrivacySettings) => {
    if (fs) {
      const next = { ...store.yleData.privacy, [key]: !store.yleData.privacy[key] };
      void savePrivacy(user!.uid, next);
    } else {
      store.setYleData((d) => ({ ...d, privacy: { ...d.privacy, [key]: !d.privacy[key] } }));
    }
  };

  // ─── FAB action ───
  const fabAction = (() => {
    if (isPartner) return null;
    if (tab === 'today' || tab === 'cal') return 'task';
    if (tab === 'habits') return 'habit';
    if (tab === 'money') return 'tx';
    return null;
  })();

  const sharedScreenProps = {
    data,
    viewMode,
    isPartner,
    onProfile: () => store.setProfileOpen(true),
    onEdit: store.setEditing,
  };

  // ─── shared overlays (forms, profile, toast, confirm, confetti) ───
  const overlays = (
    <>
      <Confetti trigger={confettiTrigger} />

      {crown && (
        <div className="crown fade-in">
          <div style={{
            fontFamily: 'var(--serif)', fontStyle: 'italic',
            fontSize: 64, color: 'var(--clay)', textAlign: 'center',
            textShadow: '0 4px 24px rgba(143, 29, 43, 0.4)',
          }}>
            ♥<br />
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
          partnerLinked={true}
          partnerName={partnerName}
          user={user}
          onSignOut={handleSignOut}
          onEnableNotifications={handleEnableNotifications}
          pushEnabled={pushEnabled}
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
          onDelete={(id) => confirmDelete('this habit', () => deleteHabit(id))}
          onClose={() => store.setEditing(null)}
        />
      )}
      {editing?.type === 'tx' && (
        <TransactionForm
          tx={editing.item}
          banks={store.yleData.banks}
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
          banks={store.yleData.banks}
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
    </>
  );

  // ─── web layout (≥ 1024px) ───
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
        />
        <main className="web-content">
          {isPartner && (
            <div className="partner-bar fade-in">
              <div className="lock">{Icons.lock({ size: 13, stroke: '#fff' })}</div>
              <div>
                Viewing <strong style={{ fontWeight: 600 }}>{partnerName}'s</strong> trackers — read only. Nothing here can be edited.
              </div>
              <button onClick={store.switchView}>↩ Back to me</button>
            </div>
          )}
          <div key={tab + viewMode} className="fade-in">
            {tab === 'today' && (
              <WebTodayScreen
                data={data} isPartner={isPartner} viewMode={viewMode}
                onEdit={store.setEditing} onCheckTask={checkTask} onCheckHabit={checkHabit} onMarkPaid={toggleBillPaid}
              />
            )}
            {tab === 'cal' && (
              <WebPlanScreen
                data={data} isPartner={isPartner}
                onEdit={store.setEditing} onCheckTask={checkTask}
              />
            )}
            {tab === 'habits' && (
              <WebHabitsScreen
                data={data} isPartner={isPartner}
                onEdit={store.setEditing} onCheckHabit={checkHabit}
              />
            )}
            {tab === 'money' && (
              <WebMoneyScreen
                data={data} isPartner={isPartner}
                onEdit={store.setEditing} onMarkPaid={toggleBillPaid}
              />
            )}
          </div>
        </main>
        {overlays}
      </div>
    );
  }

  // ─── mobile layout (< 1024px) ───
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
          <HabitsScreen {...sharedScreenProps} onHabitCheck={checkHabit} />
        )}
        {tab === 'money' && (
          <MoneyScreen {...sharedScreenProps} onMarkPaid={toggleBillPaid} onPayDebt={recordDebtPayment} />
        )}
      </div>

      {fabAction && !editing && !profileOpen && !confirm && (
        <button
          className="fab fade-in"
          onClick={() => store.setEditing(
            fabAction === 'task'
              ? { type: 'task', dateKey: tab === 'cal' ? calDate : TODAY_KEY }
              : { type: fabAction as 'habit' | 'tx' }
          )}
          title={fabAction === 'task' ? 'New task' : fabAction === 'habit' ? 'New habit' : 'Log spend'}
        >
          {Icons.plus({ stroke: 'var(--cream)' })}
        </button>
      )}

      <BottomNav tab={tab} onTab={store.setTab} partner={isPartner} />

      {overlays}
    </div>
  );
}
