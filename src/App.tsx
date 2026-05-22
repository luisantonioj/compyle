// compyle — root app component
import React, { useEffect, useRef } from 'react';
import { useAppStore, selectData, selectIsPartner, selectPartnerName } from './store/appStore';
import { TODAY_KEY } from './lib/seed';
import { Icons } from './components/Icons';
import { BottomNav } from './components/layout/BottomNav';
import { Confetti, Toast, ConfirmDialog, PartnerBanner } from './components/ui/shared';
import { TodayScreen } from './screens/TodayScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { HabitsScreen } from './screens/HabitsScreen';
import { MoneyScreen } from './screens/MoneyScreen';
import { ProfileSheet } from './screens/ProfileSheet';
import {
  TaskForm, HabitForm, TransactionForm,
  AccountForm, CategoryForm, BillForm, DebtForm,
} from './components/forms/Forms';
import type { Task, Habit, Transaction, BankAccount, Category, Bill, Debt, PrivacySettings } from './types';

export default function App() {
  const store = useAppStore();
  const data = useAppStore(selectData);
  const isPartner = useAppStore(selectIsPartner);
  const partnerName = useAppStore(selectPartnerName);
  const { tab, viewMode, profileOpen, editing, confirm, toast, confettiTrigger, crown } = store;

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
    store.setYleData((d) => {
      const day = d.tasks[dateKey] ?? [];
      const existed = day.find((t) => t.id === task.id);
      const newDay = existed ? day.map((t) => (t.id === task.id ? task : t)) : [...day, task];
      return { ...d, tasks: { ...d.tasks, [dateKey]: newDay } };
    });
    store.setEditing(null);
    store.flash(editing && 'item' in editing && editing.item ? 'Task updated' : 'Task added ✨');
  };

  const deleteTask = (taskId: string, dateKey: string) => {
    let removed: Task | undefined;
    store.setYleData((d) => {
      const day = d.tasks[dateKey] ?? [];
      removed = day.find((t) => t.id === taskId);
      return { ...d, tasks: { ...d.tasks, [dateKey]: day.filter((t) => t.id !== taskId) } };
    });
    store.setEditing(null);
    store.flash('Task deleted', 'Undo', () => {
      if (removed) saveTask(removed, dateKey);
      store.setToast(null);
    });
  };

  const checkTask = (taskId: string, dateKey = TODAY_KEY) => {
    store.setYleData((d) => {
      const dayTasks = (d.tasks[dateKey] ?? []).map((t) =>
        t.id === taskId ? { ...t, done: !t.done } : t
      );
      const nowDone = dayTasks.find((t) => t.id === taskId)?.done;
      if (nowDone) maybe();
      return { ...d, tasks: { ...d.tasks, [dateKey]: dayTasks } };
    });
  };

  // ─── Habit CRUD ───
  const saveHabit = (h: Habit) => {
    store.setYleData((d) => {
      const existed = d.habits.find((x) => x.id === h.id);
      const habits = existed ? d.habits.map((x) => (x.id === h.id ? h : x)) : [...d.habits, h];
      return { ...d, habits };
    });
    store.setEditing(null);
    store.flash(editing && 'item' in editing && editing.item ? 'Habit updated' : 'New habit started 🌱');
  };

  const deleteHabit = (id: string) => {
    let removed: Habit | undefined;
    store.setYleData((d) => {
      removed = d.habits.find((h) => h.id === id);
      return { ...d, habits: d.habits.filter((h) => h.id !== id) };
    });
    store.setEditing(null);
    store.flash('Habit deleted', 'Undo', () => {
      if (removed) saveHabit(removed);
      store.setToast(null);
    });
  };

  const checkHabit = (habitId: string) => {
    store.setYleData((d) => {
      const habits = d.habits.map((h) => {
        if (h.id !== habitId) return h;
        const flipped = !h.doneToday;
        const newStreak = flipped ? h.streak + 1 : Math.max(0, h.streak - 1);
        if (flipped && (newStreak % 7 === 0 || newStreak >= 30)) maybe();
        else if (flipped) maybe(0.3);
        return { ...h, doneToday: flipped, streak: newStreak };
      });
      return { ...d, habits };
    });
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
    store.setEditing(null);
    store.flash(editing && 'item' in editing && editing.item ? 'Updated' : tx.amt > 0 ? 'Money in 💰' : 'Logged');
  };

  const deleteTx = (id: string) => {
    let removed: Transaction | undefined;
    store.setYleData((d) => {
      removed = d.transactions.find((t) => t.id === id);
      let banks = d.banks;
      if (removed?.bank && removed?.cat) banks = applyTx(banks, removed.bank, removed.cat, -removed.amt);
      return { ...d, transactions: d.transactions.filter((t) => t.id !== id), banks };
    });
    store.setEditing(null);
    store.flash('Removed', 'Undo', () => { if (removed) saveTx(removed); store.setToast(null); });
  };

  // ─── Account CRUD ───
  const saveAccount = (acct: BankAccount) => {
    store.setYleData((d) => {
      const existed = d.banks.find((b) => b.id === acct.id);
      const banks = existed ? d.banks.map((b) => (b.id === acct.id ? acct : b)) : [...d.banks, acct];
      return { ...d, banks };
    });
    store.setEditing(null);
    store.flash(editing && 'item' in editing && editing.item ? 'Account updated' : 'Account added');
  };

  const deleteAccount = (id: string) => {
    let removed: BankAccount | undefined;
    store.setYleData((d) => {
      removed = d.banks.find((b) => b.id === id);
      return { ...d, banks: d.banks.filter((b) => b.id !== id) };
    });
    store.setEditing(null);
    store.flash('Account removed', 'Undo', () => { if (removed) saveAccount(removed); store.setToast(null); });
  };

  // ─── Category CRUD ───
  const saveCategory = (cat: Category & { bankId?: string }) => {
    store.setYleData((d) => {
      const { bankId, ...rest } = cat;
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
    store.setEditing(null);
    store.flash(editing && 'item' in editing && editing.item ? 'Category updated' : 'Category added');
  };

  const deleteCategory = (id: string) => {
    let removed: Category | undefined;
    let removedBankId: string | undefined;
    store.setYleData((d) => {
      const banks = d.banks.map((b) => {
        const found = (b.categories ?? []).find((c) => c.id === id);
        if (found) { removed = found; removedBankId = b.id; }
        return { ...b, categories: (b.categories ?? []).filter((c) => c.id !== id) };
      });
      return { ...d, banks };
    });
    store.setEditing(null);
    store.flash('Category removed', 'Undo', () => {
      if (removed) saveCategory({ ...removed, bankId: removedBankId });
      store.setToast(null);
    });
  };

  // ─── Bill CRUD ───
  const saveBill = (b: Bill) => {
    store.setYleData((d) => {
      const existed = d.bills.find((x) => x.id === b.id);
      return { ...d, bills: existed ? d.bills.map((x) => (x.id === b.id ? b : x)) : [...d.bills, b] };
    });
    store.setEditing(null);
    store.flash(editing && 'item' in editing && editing.item ? 'Bill updated' : 'Bill added');
  };

  const deleteBill = (id: string) => {
    let removed: Bill | undefined;
    store.setYleData((d) => {
      removed = d.bills.find((b) => b.id === id);
      return { ...d, bills: d.bills.filter((b) => b.id !== id) };
    });
    store.setEditing(null);
    store.flash('Bill removed', 'Undo', () => { if (removed) saveBill(removed); store.setToast(null); });
  };

  const toggleBillPaid = (id: string) => {
    store.setYleData((d) => {
      const bills = d.bills.map((b) => {
        if (b.id !== id) return b;
        const next = b.status === 'paid' ? 'due' : 'paid';
        if (next === 'paid') maybe(0.6);
        return { ...b, status: next } as Bill;
      });
      return { ...d, bills };
    });
  };

  // ─── Debt CRUD ───
  const saveDebt = (debt: Debt) => {
    store.setYleData((d) => {
      const existed = d.debts.find((x) => x.id === debt.id);
      const debts = existed ? d.debts.map((x) => (x.id === debt.id ? debt : x)) : [...d.debts, debt];
      return { ...d, debts };
    });
    store.setEditing(null);
    store.flash(editing && 'item' in editing && editing.item ? 'Debt updated' : 'Tracking 💪');
  };

  const deleteDebt = (id: string) => {
    let removed: Debt | undefined;
    store.setYleData((d) => {
      removed = d.debts.find((b) => b.id === id);
      return { ...d, debts: d.debts.filter((b) => b.id !== id) };
    });
    store.setEditing(null);
    store.flash('Debt removed', 'Undo', () => { if (removed) saveDebt(removed); store.setToast(null); });
  };

  const recordDebtPayment = (id: string) => {
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
    store.flash('Payment recorded ✓');
  };

  // ─── Privacy ───
  const togglePrivacy = (key: keyof PrivacySettings) => {
    store.setYleData((d) => ({ ...d, privacy: { ...d.privacy, [key]: !d.privacy[key] } }));
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

  return (
    <div className="mobile-shell">
      {/* partner banner */}
      {isPartner && (
        <PartnerBanner name={partnerName} onReturn={store.switchView} />
      )}

      {/* screens */}
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
          <TodayScreen
            {...sharedScreenProps}
            partnerName={partnerName}
            onCheck={checkTask}
          />
        )}
        {tab === 'cal' && (
          <CalendarScreen
            {...sharedScreenProps}
            onCheck={checkTask}
          />
        )}
        {tab === 'habits' && (
          <HabitsScreen
            {...sharedScreenProps}
            onHabitCheck={checkHabit}
          />
        )}
        {tab === 'money' && (
          <MoneyScreen
            {...sharedScreenProps}
            onMarkPaid={toggleBillPaid}
            onPayDebt={recordDebtPayment}
          />
        )}
      </div>

      {/* FAB */}
      {fabAction && !editing && !profileOpen && !confirm && (
        <button
          className="fab fade-in"
          onClick={() => store.setEditing({ type: fabAction as 'task' | 'habit' | 'tx' })}
          title={fabAction === 'task' ? 'New task' : fabAction === 'habit' ? 'New habit' : 'Log spend'}
        >
          {Icons.plus({ stroke: 'var(--cream)' })}
        </button>
      )}

      {/* bottom nav */}
      <BottomNav tab={tab} onTab={store.setTab} partner={isPartner} />

      {/* confetti */}
      <Confetti trigger={confettiTrigger} />

      {/* easter egg crown */}
      {crown && (
        <div className="crown fade-in">
          <div style={{
            fontFamily: 'var(--serif)', fontStyle: 'italic',
            fontSize: 64, color: 'var(--clay)', textAlign: 'center',
            textShadow: '0 4px 24px rgba(176, 74, 47, 0.4)',
          }}>
            ♥<br />
            <span style={{ fontSize: 18, color: 'var(--ink)' }}>for yle</span>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <Toast
          message={toast.message}
          action={toast.action}
          onAction={toast.onAction}
          onDismiss={() => store.setToast(null)}
        />
      )}

      {/* confirm dialog */}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={store.clearConfirm}
        />
      )}

      {/* profile sheet */}
      {profileOpen && (
        <ProfileSheet
          onClose={() => store.setProfileOpen(false)}
          viewMode={viewMode}
          onSwitchView={store.switchView}
          privacy={store.yleData.privacy}
          onPrivacyToggle={togglePrivacy}
          partnerLinked={true}
          partnerName={partnerName}
        />
      )}

      {/* edit forms */}
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
    </div>
  );
}
