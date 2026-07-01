import { deleteDoc, setDoc } from 'firebase/firestore';
import { stripUndefined, userDoc } from '../../services/firebase/client';
import { trackFirestoreWrite } from '../../services/firebase/syncTracker';
import type { Habit, HabitCategory } from '../../types';
import { legacyHabitSchedule } from './habitSchedule';

export const upsertHabit = (uid: string, habit: Habit) =>
  trackFirestoreWrite(setDoc(userDoc(uid, 'habits', habit.id), stripUndefined(habit as unknown as Record<string, unknown>)));

export const removeHabit = (uid: string, id: string) =>
  trackFirestoreWrite(deleteDoc(userDoc(uid, 'habits', id)));

export const upsertHabitCategory = (uid: string, category: HabitCategory) =>
  trackFirestoreWrite(setDoc(
    userDoc(uid, 'habit_categories', category.id),
    stripUndefined(category as unknown as Record<string, unknown>),
  ));

export function normalizeHabitCategoryDoc(data: Record<string, unknown>): HabitCategory | null {
  if (typeof data.id !== 'string' || typeof data.name !== 'string' || !data.name.trim()) return null;
  return {
    id: data.id,
    name: data.name.trim(),
    sort_order: typeof data.sort_order === 'number' ? data.sort_order : undefined,
  };
}

export function normalizeHabitDoc(data: Record<string, unknown>): Habit | null {
  if (typeof data.id !== 'string' || typeof data.name !== 'string') return null;

  const note = typeof data.note === 'string' ? data.note : '';
  const legacySchedule = legacyHabitSchedule(note);
  const validFrequencies = ['daily', 'every_other_day', 'three_per_week', 'weekly', 'custom'];
  const frequency = typeof data.frequency === 'string' && validFrequencies.includes(data.frequency)
    ? data.frequency as Habit['frequency']
    : legacySchedule.frequency;
  const scheduleMode = data.scheduleMode === 'days' || data.scheduleMode === 'times_per_week'
    ? data.scheduleMode
    : legacySchedule.scheduleMode;
  const scheduleDays = Array.isArray(data.scheduleDays)
    ? [...new Set(data.scheduleDays.filter((day): day is number => Number.isInteger(day) && day >= 1 && day <= 7))].sort()
    : legacySchedule.scheduleDays;
  const timesPerWeek = typeof data.timesPerWeek === 'number'
    && Number.isInteger(data.timesPerWeek)
    && data.timesPerWeek >= 1
    && data.timesPerWeek <= 7
    ? data.timesPerWeek
    : legacySchedule.timesPerWeek;

  return {
    id: data.id,
    name: data.name,
    categoryId: typeof data.categoryId === 'string' ? data.categoryId : undefined,
    note,
    frequency,
    scheduleMode: frequency === 'custom' ? scheduleMode ?? 'days' : undefined,
    scheduleDays: frequency === 'custom' && (scheduleMode ?? 'days') === 'days' ? scheduleDays ?? [] : undefined,
    timesPerWeek: frequency === 'custom' && scheduleMode === 'times_per_week' ? timesPerWeek ?? 3 : undefined,
    startDate: typeof data.startDate === 'string' ? data.startDate : undefined,
    completedDates: Array.isArray(data.completedDates) ? data.completedDates.filter((d): d is string => typeof d === 'string') : [],
    repeating: typeof data.repeating === 'boolean' ? data.repeating : true,
    sort_order: typeof data.sort_order === 'number' ? data.sort_order : undefined,
    archived: typeof data.archived === 'boolean' ? data.archived : undefined,
  };
}

