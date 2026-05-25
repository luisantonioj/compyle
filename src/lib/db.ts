// compyle — Firestore persistence layer
import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { TODAY_KEY } from './seed';
import type { Task, Habit, BankAccount, Transaction, Bill, Debt, PrivacySettings, UserData } from '../types';

// ── path helpers ────────────────────────────────────────────────────────────
const col = (uid: string, name: string) => collection(db!, 'users', uid, name);
const ref = (uid: string, name: string, id: string) => doc(db!, 'users', uid, name, id);

// ── Tasks ────────────────────────────────────────────────────────────────────
const stripUndefined = (obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

export const upsertTask = (uid: string, task: Task, dateKey: string) =>
  setDoc(ref(uid, 'tasks', task.id), stripUndefined({ ...task, date: dateKey }));

export const removeTask = (uid: string, id: string) =>
  deleteDoc(ref(uid, 'tasks', id));

// ── Habits ───────────────────────────────────────────────────────────────────
export const upsertHabit = (uid: string, habit: Habit) =>
  setDoc(ref(uid, 'habits', habit.id), habit);

export const removeHabit = (uid: string, id: string) =>
  deleteDoc(ref(uid, 'habits', id));

// ── Banks (categories stored as array within the bank doc) ───────────────────
export const upsertBank = (uid: string, bank: BankAccount) =>
  setDoc(ref(uid, 'bank_accounts', bank.id), bank);

export const removeBank = (uid: string, id: string) =>
  deleteDoc(ref(uid, 'bank_accounts', id));

// ── Transactions ─────────────────────────────────────────────────────────────
export const upsertTx = (uid: string, tx: Transaction) =>
  setDoc(ref(uid, 'transactions', tx.id), tx);

export const removeTx = (uid: string, id: string) =>
  deleteDoc(ref(uid, 'transactions', id));

// ── Bills ────────────────────────────────────────────────────────────────────
export const upsertBill = (uid: string, bill: Bill) =>
  setDoc(ref(uid, 'recurring_payments', bill.id), bill);

export const removeBill = (uid: string, id: string) =>
  deleteDoc(ref(uid, 'recurring_payments', id));

// ── Debts ────────────────────────────────────────────────────────────────────
export const upsertDebt = (uid: string, debt: Debt) =>
  setDoc(ref(uid, 'pending_payments', debt.id), debt);

export const removeDebt = (uid: string, id: string) =>
  deleteDoc(ref(uid, 'pending_payments', id));

// ── Privacy settings ─────────────────────────────────────────────────────────
export const savePrivacy = (uid: string, privacy: PrivacySettings) =>
  setDoc(doc(db!, 'users', uid, 'tracker_visibility', 'settings'), privacy);

// ── User profile (merge so it never overwrites existing fields) ───────────────
export const ensureProfile = (uid: string, displayName: string, email: string) =>
  setDoc(doc(db!, 'users', uid), { displayName, email, created_at: serverTimestamp() }, { merge: true });

// ── Push notification summary (written by the client for the Vercel cron to read) ──
// Stored in a top-level public collection so the cron can read it without admin auth.
export const savePushSummary = (uid: string, summary: string) =>
  setDoc(
    doc(db!, 'device_tokens', uid),
    { daily_summary: summary, summary_updated_at: serverTimestamp() },
    { merge: true },
  );

// ── Real-time subscription ────────────────────────────────────────────────────
// Calls onPartial whenever any subcollection changes.
// Calls onReady once all 7 listeners have fired at least once (initial load done).
export function subscribeUserData(
  uid: string,
  onPartial: (data: Partial<UserData>) => void,
  onReady: () => void,
): Unsubscribe {
  const fired = new Set<string>();
  const mark = (key: string) => {
    fired.add(key);
    if (fired.size === 7) onReady();
  };

  const unsubs: Unsubscribe[] = [];

  // tasks — each doc has a `date` field; group into Record<dateKey, Task[]>
  unsubs.push(onSnapshot(col(uid, 'tasks'), (snap) => {
    const tasks: Record<string, Task[]> = {};
    snap.docs.forEach((d) => {
      const { date, ...task } = d.data() as Task & { date: string };
      if (!tasks[date]) tasks[date] = [];
      tasks[date].push(task as Task);
    });
    onPartial({ tasks });
    mark('tasks');
  }));

  // habits — reset doneToday and shift rolling pattern window on a new day
  unsubs.push(onSnapshot(col(uid, 'habits'), (snap) => {
    const habits: Habit[] = snap.docs
      .map((d) => {
        const data = d.data() as Habit;
        if (data.doneDate === TODAY_KEY) return data;
        // New day: shift the 28-day pattern forward so index 27 always = today
        if (data.doneDate) {
          const msPerDay = 1000 * 60 * 60 * 24;
          const daysElapsed = Math.round(
            (new Date(TODAY_KEY).getTime() - new Date(data.doneDate).getTime()) / msPerDay
          );
          if (daysElapsed > 0) {
            const patArr = data.pattern.split(',');
            const count = Math.min(daysElapsed, patArr.length);
            for (let i = 0; i < count; i++) { patArr.shift(); patArr.push('off'); }
            return { ...data, doneToday: false, pattern: patArr.join(',') };
          }
        }
        return { ...data, doneToday: false };
      })
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    onPartial({ habits });
    mark('habits');
  }));

  // banks
  unsubs.push(onSnapshot(col(uid, 'bank_accounts'), (snap) => {
    onPartial({ banks: snap.docs.map((d) => d.data() as BankAccount) });
    mark('bank_accounts');
  }));

  // transactions — newest first
  unsubs.push(onSnapshot(col(uid, 'transactions'), (snap) => {
    const transactions = snap.docs
      .map((d) => d.data() as Transaction)
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
    onPartial({ transactions });
    mark('transactions');
  }));

  // bills
  unsubs.push(onSnapshot(col(uid, 'recurring_payments'), (snap) => {
    onPartial({ bills: snap.docs.map((d) => d.data() as Bill) });
    mark('recurring_payments');
  }));

  // debts
  unsubs.push(onSnapshot(col(uid, 'pending_payments'), (snap) => {
    onPartial({ debts: snap.docs.map((d) => d.data() as Debt) });
    mark('pending_payments');
  }));

  // privacy settings — doc may not exist yet for new users
  unsubs.push(onSnapshot(doc(db!, 'users', uid, 'tracker_visibility', 'settings'), (snap) => {
    if (snap.exists()) onPartial({ privacy: snap.data() as PrivacySettings });
    mark('privacy');
  }));

  return () => unsubs.forEach((u) => u());
}
