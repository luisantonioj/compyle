// compyle — Firestore persistence layer
import {
  collection, doc, setDoc, deleteDoc, getDoc, writeBatch,
  onSnapshot, serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { TODAY_KEY } from './seed';
import type { Task, Habit, BankAccount, Transaction, Bill, Debt, PrivacySettings, UserData, UserProfile, LinkCategory, LinkItem, Note } from '../types';

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
  setDoc(ref(uid, 'habits', habit.id), stripUndefined(habit as unknown as Record<string, unknown>));

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

// ── Link Categories ──────────────────────────────────────────────────────────
export const upsertLinkCategory = (uid: string, cat: LinkCategory) =>
  setDoc(ref(uid, 'link_categories', cat.id), stripUndefined(cat as unknown as Record<string, unknown>));

export const removeLinkCategory = (uid: string, id: string) =>
  deleteDoc(ref(uid, 'link_categories', id));

// ── Links ────────────────────────────────────────────────────────────────────
export const upsertLink = (uid: string, link: LinkItem) =>
  setDoc(ref(uid, 'links', link.id), stripUndefined(link as unknown as Record<string, unknown>));

export const removeLink = (uid: string, id: string) =>
  deleteDoc(ref(uid, 'links', id));

// ── Notes ────────────────────────────────────────────────────────────────────
export const upsertNote = (uid: string, note: Note) =>
  setDoc(ref(uid, 'notes', note.id), stripUndefined(note as unknown as Record<string, unknown>));

export const removeNote = (uid: string, id: string) =>
  deleteDoc(ref(uid, 'notes', id));

// ── Privacy settings ─────────────────────────────────────────────────────────
export const savePrivacy = (uid: string, privacy: PrivacySettings) =>
  setDoc(doc(db!, 'users', uid, 'tracker_visibility', 'settings'), privacy);

// ── User profile (merge so it never overwrites existing fields) ───────────────
export const ensureProfile = (uid: string, displayName: string, email: string) =>
  setDoc(doc(db!, 'users', uid), { displayName, email, created_at: serverTimestamp() }, { merge: true });

// Listen to /users/{uid} root profile doc in real time
export function subscribeProfile(uid: string, cb: (p: UserProfile) => void): Unsubscribe {
  return onSnapshot(doc(db!, 'users', uid), (snap) => {
    if (snap.exists()) cb({ uid, ...snap.data() } as UserProfile);
  });
}

// Write /partner_invites/{code} and return the 6-char code
export async function createInvite(myUid: string): Promise<string> {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  await setDoc(doc(db!, 'partner_invites', code), { inviterId: myUid, createdAt: serverTimestamp() });
  return code;
}

// Accept invite — batch-writes partnerId on both profile docs + deletes invite
export async function acceptInvite(code: string, myUid: string): Promise<void> {
  const inviteRef = doc(db!, 'partner_invites', code.trim().toUpperCase());
  const snap = await getDoc(inviteRef);
  if (!snap.exists()) throw new Error('Invalid or expired code');
  const { inviterId } = snap.data() as { inviterId: string };
  if (inviterId === myUid) throw new Error('You cannot link with yourself');
  const batch = writeBatch(db!);
  batch.set(doc(db!, 'users', myUid),     { partnerId: inviterId }, { merge: true });
  batch.set(doc(db!, 'users', inviterId), { partnerId: myUid },     { merge: true });
  batch.delete(inviteRef);
  await batch.commit();
}

// Unlink — clears partnerId on both profiles
export async function unlinkPartner(myUid: string, partnerUid: string): Promise<void> {
  const batch = writeBatch(db!);
  batch.set(doc(db!, 'users', myUid),      { partnerId: null }, { merge: true });
  batch.set(doc(db!, 'users', partnerUid), { partnerId: null }, { merge: true });
  await batch.commit();
}

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
// Calls onReady once all 10 listeners have fired at least once (initial load done).
export function subscribeUserData(
  uid: string,
  onPartial: (data: Partial<UserData>) => void,
  onReady: () => void,
): Unsubscribe {
  const fired = new Set<string>();
  const mark = (key: string) => {
    fired.add(key);
    if (fired.size === 10) onReady();
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

  // habits — migrate old schema (pattern/doneToday) to new completedDates/repeating
  unsubs.push(onSnapshot(col(uid, 'habits'), (snap) => {
    const habits: Habit[] = snap.docs
      .map((d) => {
        const habit = d.data() as unknown as Habit;
        // Migrate old-format docs that still use pattern/doneToday
        if (!Array.isArray(habit.completedDates)) {
          return {
            ...habit,
            completedDates: [],
            repeating: habit.repeating ?? true,
          } as Habit;
        }
        return { ...habit, repeating: habit.repeating ?? true } as Habit;
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

  // link categories
  unsubs.push(onSnapshot(col(uid, 'link_categories'), (snap) => {
    const linkCategories = snap.docs
      .map((d) => d.data() as LinkCategory)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    onPartial({ linkCategories });
    mark('link_categories');
  }));

  // links
  unsubs.push(onSnapshot(col(uid, 'links'), (snap) => {
    const links = snap.docs
      .map((d) => d.data() as LinkItem)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    onPartial({ links });
    mark('links');
  }));

  // notes — sorted by sort_order if set, otherwise by updated_at desc
  unsubs.push(onSnapshot(col(uid, 'notes'), (snap) => {
    const notes = snap.docs
      .map((d) => d.data() as Note)
      .sort((a, b) => {
        if (a.sort_order !== undefined && b.sort_order !== undefined) return a.sort_order - b.sort_order;
        if (a.sort_order !== undefined) return -1;
        if (b.sort_order !== undefined) return 1;
        return b.updated_at - a.updated_at;
      });
    onPartial({ notes });
    mark('notes');
  }));

  return () => unsubs.forEach((u) => u());
}
