import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { userCollection } from './client';
import { normalizeHabitDoc } from '../../features/habits/habitRepository';
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
import type { Task, UserData } from '../../types';

const isPresent = <T,>(value: T | null | undefined): value is T => value != null;

export function subscribeUserData(
  uid: string,
  onPartial: (data: Partial<UserData>) => void,
  onReady: () => void,
): Unsubscribe {
  let isReady = false;
  const fired = new Set<string>();
  const mark = (key: string) => {
    fired.add(key);
    if (!isReady && fired.size === 11) {
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

  unsubs.push(onSnapshot(userCollection(uid, 'tasks'), (snap) => {
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
    mark('tasks');
  }));

  unsubs.push(onSnapshot(userCollection(uid, 'task_types'), (snap) => {
    const taskTypes = snap.docs
      .map((d) => normalizeTaskTypeDoc(d.data()))
      .filter(isPresent)
      .sort((a, b) => (a.created_at ?? 0) - (b.created_at ?? 0));
    onPartial({ taskTypes });
    mark('task_types');
  }));

  unsubs.push(onSnapshot(userCollection(uid, 'habits'), (snap) => {
    const habits = snap.docs
      .map((d) => normalizeHabitDoc(d.data()))
      .filter(isPresent)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    onPartial({ habits });
    mark('habits');
  }));

  unsubs.push(onSnapshot(userCollection(uid, 'bank_accounts'), (snap) => {
    onPartial({ banks: snap.docs.map((d) => normalizeBankDoc(d.data())).filter(isPresent) });
    mark('bank_accounts');
  }));

  unsubs.push(onSnapshot(userCollection(uid, 'transactions'), (snap) => {
    const transactions = snap.docs
      .map((d) => normalizeTransactionDoc(d.data()))
      .filter(isPresent)
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
    onPartial({ transactions });
    mark('transactions');
  }));

  unsubs.push(onSnapshot(userCollection(uid, 'recurring_payments'), (snap) => {
    onPartial({ bills: snap.docs.map((d) => normalizeBillDoc(d.data())).filter(isPresent) });
    mark('recurring_payments');
  }));

  unsubs.push(onSnapshot(userCollection(uid, 'pending_payments'), (snap) => {
    onPartial({ debts: snap.docs.map((d) => normalizeDebtDoc(d.data())).filter(isPresent) });
    mark('pending_payments');
  }));

  unsubs.push(onSnapshot(doc(db!, 'users', uid, 'tracker_visibility', 'settings'), (snap) => {
    if (snap.exists()) onPartial({ privacy: normalizePrivacyDoc(snap.data()) });
    mark('privacy');
  }));

  unsubs.push(onSnapshot(userCollection(uid, 'link_categories'), (snap) => {
    const linkCategories = snap.docs
      .map((d) => normalizeLinkCategoryDoc(d.data()))
      .filter(isPresent)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    onPartial({ linkCategories });
    mark('link_categories');
  }));

  unsubs.push(onSnapshot(userCollection(uid, 'links'), (snap) => {
    const links = snap.docs
      .map((d) => normalizeLinkDoc(d.data()))
      .filter(isPresent)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    onPartial({ links });
    mark('links');
  }));

  unsubs.push(onSnapshot(userCollection(uid, 'notes'), (snap) => {
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
    mark('notes');
  }));

  return cleanup;
}
