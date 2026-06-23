import { deleteDoc, setDoc } from 'firebase/firestore';
import { stripUndefined, userDoc } from '../../services/firebase/client';
import type { Task } from '../../types';

export const upsertTask = (uid: string, task: Task, dateKey: string) =>
  setDoc(userDoc(uid, 'tasks', task.id), stripUndefined({ ...task, date: dateKey }));

export const removeTask = (uid: string, id: string) =>
  deleteDoc(userDoc(uid, 'tasks', id));

export function normalizeTaskDoc(data: Record<string, unknown>): (Task & { date: string }) | null {
  if (typeof data.id !== 'string' || typeof data.title !== 'string') return null;

  return {
    id: data.id,
    title: data.title,
    emoji: typeof data.emoji === 'string' ? data.emoji : '',
    description: typeof data.description === 'string' ? data.description : undefined,
    time: typeof data.time === 'string' ? data.time : null,
    done: data.done === true,
    recurrence: isRecurrence(data.recurrence) ? data.recurrence : null,
    recurrenceEnd: typeof data.recurrenceEnd === 'string' ? data.recurrenceEnd : null,
    reminder_time: typeof data.reminder_time === 'string' ? data.reminder_time : null,
    created_at: typeof data.created_at === 'number' ? data.created_at : undefined,
    sort_order: typeof data.sort_order === 'number' ? data.sort_order : undefined,
    date: typeof data.date === 'string' ? data.date : '',
  };
}

function isRecurrence(value: unknown): value is Task['recurrence'] {
  return value === 'daily' || value === 'weekly' || value === 'monthly' || value === 'yearly';
}

