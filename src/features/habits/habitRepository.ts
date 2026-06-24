import { deleteDoc, setDoc } from 'firebase/firestore';
import { stripUndefined, userDoc } from '../../services/firebase/client';
import type { Habit } from '../../types';

export const upsertHabit = (uid: string, habit: Habit) =>
  setDoc(userDoc(uid, 'habits', habit.id), stripUndefined(habit as unknown as Record<string, unknown>));

export const removeHabit = (uid: string, id: string) =>
  deleteDoc(userDoc(uid, 'habits', id));

export function normalizeHabitDoc(data: Record<string, unknown>): Habit | null {
  if (typeof data.id !== 'string' || typeof data.name !== 'string') return null;

  return {
    id: data.id,
    name: data.name,
    note: typeof data.note === 'string' ? data.note : '',
    freqType: data.freqType === 'days' || data.freqType === 'time' ? data.freqType : undefined,
    startDate: typeof data.startDate === 'string' ? data.startDate : undefined,
    completedDates: Array.isArray(data.completedDates) ? data.completedDates.filter((d): d is string => typeof d === 'string') : [],
    repeating: typeof data.repeating === 'boolean' ? data.repeating : true,
    sort_order: typeof data.sort_order === 'number' ? data.sort_order : undefined,
    archived: typeof data.archived === 'boolean' ? data.archived : undefined,
  };
}

