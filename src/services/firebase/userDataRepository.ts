import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { userCollection } from './client';
import { normalizeHabitCategoryDoc, normalizeHabitDoc } from '../../features/habits/habitRepository';
import { normalizeLinkCategoryDoc, normalizeLinkDoc } from '../../features/links/linkRepository';
import {
  normalizeBankDoc,
  normalizeBillDoc,
  normalizeDebtDoc,
  normalizeTransactionDoc,
} from '../../features/money/moneyRepository';
import { normalizeNoteDoc } from '../../features/notes/noteRepository';
import { normalizePrivacyDoc } from '../../features/profile/profileRepository';
import { normalizeTaskDoc, normalizeTaskTypeDoc } from '../../features/tasks/taskRepository';
import type { PrivacySettings, Task, UserData } from '../../types';

const isPresent = <T,>(value: T | null | undefined): value is T => value != null;

interface UserDataSubscriptionOptions {
  privacy?: PrivacySettings;
  includePrivacy?: boolean;
}

export function subscribeUserData(
  uid: string,
  onPartial: (data: Partial<UserData>) => void,
  onReady: () => void,
  onError?: (error: Error) => void,
  onServerSync?: () => void,
  options: UserDataSubscriptionOptions = {},
): Unsubscribe {
  const { privacy, includePrivacy = true } = options;
  const canRead = (key: keyof PrivacySettings) => privacy?.[key] !== false;
  const expectedListeners =
    (canRead('cal') ? 2 : 0)
    + (canRead('habits') ? 2 : 0)
    + (canRead('money') ? 4 : 0)
    + (canRead('links') ? 2 : 0)
    + (canRead('notes') ? 1 : 0)
    + (includePrivacy ? 1 : 0);
  let isReady = false;
  const fired = new Set<string>();
  const mark = (key: string) => {
    fired.add(key);
    if (!isReady && fired.size === expectedListeners) {
      isReady = true;
      onReady();
    }
  };

  const timeout = setTimeout(() => {
    if (!isReady) {
      isReady = true;
      onReady();
    }
  }, 1500);

  const unsubs: Unsubscribe[] = [];
  const cleanup = () => {
    clearTimeout(timeout);
    unsubs.forEach((u) => u());
  };
  const listenOptions = { includeMetadataChanges: true } as const;
  const handleError = (error: Error) => {
    onError?.(error);
    if (!isReady) {
      isReady = true;
      onReady();
    }
  };
  const markServerSync = (fromCache: boolean) => {
    if (!fromCache) onServerSync?.();
  };

  if (canRead('cal')) unsubs.push(onSnapshot(userCollection(uid, 'tasks'), listenOptions, (snap) => {
    const tasks: Record<string, Task[]> = {};
    snap.docs.forEach((d) => {
      const task = normalizeTaskDoc(d.data());
      if (!task || !task.date) return;
      const { date, ...taskData } = task;
      if (!tasks[date]) tasks[date] = [];
      tasks[date].push(taskData);
    });
    for (const key in tasks) {
      tasks[key].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }
    onPartial({ tasks });
    markServerSync(snap.metadata.fromCache);
    mark('tasks');
  }, handleError));

  if (canRead('cal')) unsubs.push(onSnapshot(userCollection(uid, 'task_types'), listenOptions, (snap) => {
    const taskTypes = snap.docs
      .map((d) => normalizeTaskTypeDoc(d.data()))
      .filter(isPresent)
      .sort((a, b) => (a.created_at ?? 0) - (b.created_at ?? 0));
    onPartial({ taskTypes });
    markServerSync(snap.metadata.fromCache);
    mark('task_types');
  }, handleError));

  if (canRead('habits')) unsubs.push(onSnapshot(userCollection(uid, 'habits'), listenOptions, (snap) => {
    const habits = snap.docs
      .map((d) => normalizeHabitDoc(d.data()))
      .filter(isPresent)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    onPartial({ habits });
    markServerSync(snap.metadata.fromCache);
    mark('habits');
  }, handleError));

  if (canRead('habits')) unsubs.push(onSnapshot(userCollection(uid, 'habit_categories'), listenOptions, (snap) => {
    const habitCategories = snap.docs
      .map((d) => normalizeHabitCategoryDoc(d.data()))
      .filter(isPresent)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    onPartial({ habitCategories });
    markServerSync(snap.metadata.fromCache);
    mark('habit_categories');
  }, handleError));

  if (canRead('money')) unsubs.push(onSnapshot(userCollection(uid, 'bank_accounts'), listenOptions, (snap) => {
    onPartial({ banks: snap.docs.map((d) => normalizeBankDoc(d.data())).filter(isPresent) });
    markServerSync(snap.metadata.fromCache);
    mark('bank_accounts');
  }, handleError));

  if (canRead('money')) unsubs.push(onSnapshot(userCollection(uid, 'transactions'), listenOptions, (snap) => {
    const transactions = snap.docs
      .map((d) => normalizeTransactionDoc(d.data()))
      .filter(isPresent)
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
    onPartial({ transactions });
    markServerSync(snap.metadata.fromCache);
    mark('transactions');
  }, handleError));

  if (canRead('money')) unsubs.push(onSnapshot(userCollection(uid, 'recurring_payments'), listenOptions, (snap) => {
    onPartial({ bills: snap.docs.map((d) => normalizeBillDoc(d.data())).filter(isPresent) });
    markServerSync(snap.metadata.fromCache);
    mark('recurring_payments');
  }, handleError));

  if (canRead('money')) unsubs.push(onSnapshot(userCollection(uid, 'pending_payments'), listenOptions, (snap) => {
    onPartial({ debts: snap.docs.map((d) => normalizeDebtDoc(d.data())).filter(isPresent) });
    markServerSync(snap.metadata.fromCache);
    mark('pending_payments');
  }, handleError));

  if (includePrivacy) unsubs.push(onSnapshot(doc(db!, 'users', uid, 'tracker_visibility', 'settings'), listenOptions, (snap) => {
    if (snap.exists()) onPartial({ privacy: normalizePrivacyDoc(snap.data()) });
    markServerSync(snap.metadata.fromCache);
    mark('privacy');
  }, handleError));

  if (canRead('links')) unsubs.push(onSnapshot(userCollection(uid, 'link_categories'), listenOptions, (snap) => {
    const linkCategories = snap.docs
      .map((d) => normalizeLinkCategoryDoc(d.data()))
      .filter(isPresent)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    onPartial({ linkCategories });
    markServerSync(snap.metadata.fromCache);
    mark('link_categories');
  }, handleError));

  if (canRead('links')) unsubs.push(onSnapshot(userCollection(uid, 'links'), listenOptions, (snap) => {
    const links = snap.docs
      .map((d) => normalizeLinkDoc(d.data()))
      .filter(isPresent)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    onPartial({ links });
    markServerSync(snap.metadata.fromCache);
    mark('links');
  }, handleError));

  if (canRead('notes')) unsubs.push(onSnapshot(userCollection(uid, 'notes'), listenOptions, (snap) => {
    const notes = snap.docs
      .map((d) => normalizeNoteDoc(d.data()))
      .filter(isPresent)
      .sort((a, b) => {
        if (a.sort_order !== undefined && b.sort_order !== undefined) return a.sort_order - b.sort_order;
        if (a.sort_order !== undefined) return -1;
        if (b.sort_order !== undefined) return 1;
        return b.updated_at - a.updated_at;
    });
    onPartial({ notes });
    markServerSync(snap.metadata.fromCache);
    mark('notes');
  }, handleError));

  if (expectedListeners === 0) {
    isReady = true;
    queueMicrotask(onReady);
  }

  return cleanup;
}

export function clearPrivatePartnerData(data: UserData, privacy: PrivacySettings): UserData {
  return {
    ...data,
    privacy,
    tasks: privacy.cal ? data.tasks : {},
    taskTypes: privacy.cal ? data.taskTypes : [],
    habits: privacy.habits ? data.habits : [],
    habitCategories: privacy.habits ? data.habitCategories : [],
    banks: privacy.money ? data.banks : [],
    transactions: privacy.money ? data.transactions : [],
    bills: privacy.money ? data.bills : [],
    debts: privacy.money ? data.debts : [],
    linkCategories: privacy.links ? data.linkCategories : [],
    links: privacy.links ? data.links : [],
    notes: privacy.notes ? data.notes : [],
  };
}
