import type { Habit, HabitFrequency, HabitScheduleMode } from '../../types';

export const HABIT_FREQUENCIES: Array<{ value: HabitFrequency; label: string }> = [
  { value: 'daily', label: 'Daily' },
  { value: 'every_other_day', label: 'Every other day' },
  { value: 'three_per_week', label: '3× a week' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom' },
];

export const WEEKDAYS = [
  { value: 1, short: 'M', label: 'Monday' },
  { value: 2, short: 'T', label: 'Tuesday' },
  { value: 3, short: 'W', label: 'Wednesday' },
  { value: 4, short: 'T', label: 'Thursday' },
  { value: 5, short: 'F', label: 'Friday' },
  { value: 6, short: 'S', label: 'Saturday' },
  { value: 7, short: 'S', label: 'Sunday' },
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function scheduleNote(
  frequency: HabitFrequency,
  scheduleMode: HabitScheduleMode,
  scheduleDays: number[],
  timesPerWeek: number,
): string {
  const preset = HABIT_FREQUENCIES.find((option) => option.value === frequency);
  if (frequency !== 'custom') return preset?.label ?? 'Daily';
  if (scheduleMode === 'times_per_week') return `${timesPerWeek}× a week`;
  return scheduleDays.map((day) => DAY_NAMES[day - 1]).filter(Boolean).join(', ');
}

export function legacyHabitSchedule(note: string): {
  frequency: HabitFrequency;
  scheduleMode?: HabitScheduleMode;
  scheduleDays?: number[];
  timesPerWeek?: number;
} {
  switch (note) {
    case 'Every 2 days':
    case 'Every other day':
      return { frequency: 'every_other_day' };
    case 'Every 3 days':
      return { frequency: 'custom', scheduleMode: 'times_per_week', timesPerWeek: 2 };
    case 'Weekly':
      return { frequency: 'weekly' };
    case 'Mon/Wed/Fri':
      return { frequency: 'custom', scheduleMode: 'days', scheduleDays: [1, 3, 5] };
    case 'Wed + Sat':
      return { frequency: 'custom', scheduleMode: 'days', scheduleDays: [3, 6] };
    case 'Bi-weekly':
      return { frequency: 'custom', scheduleMode: 'times_per_week', timesPerWeek: 1 };
    default:
      return { frequency: 'daily' };
  }
}

const DAY_MS = 86_400_000;

function keyDayNumber(key: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const [, year, month, day] = match;
  return Math.floor(Date.UTC(Number(year), Number(month) - 1, Number(day)) / DAY_MS);
}

function isoWeekday(key: string): number | null {
  const dayNumber = keyDayNumber(key);
  if (dayNumber === null) return null;
  const weekday = new Date(dayNumber * DAY_MS).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

function todayKey(): string {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
}

/**
 * Returns whether a date should receive the visual schedule guide.
 * Completions remain user-controlled; this function only derives UI hints.
 */
export function isHabitGuideDate(habit: Habit, dateKey: string): boolean {
  if (!habit.repeating) return false;

  const legacy = legacyHabitSchedule(habit.note);
  const frequency = habit.frequency ?? legacy.frequency;
  const scheduleMode = habit.scheduleMode ?? legacy.scheduleMode;
  const scheduleDays = habit.scheduleDays ?? legacy.scheduleDays ?? [];

  // Intentionally on standby until weekly-count scheduling is defined.
  if (frequency === 'custom' && scheduleMode === 'times_per_week') return false;

  const validCompletions = habit.completedDates.filter((key) => keyDayNumber(key) !== null);
  validCompletions.sort();
  const latestCompletion = validCompletions[validCompletions.length - 1];
  const anchorKey = latestCompletion ?? habit.startDate ?? todayKey();
  const anchorDay = keyDayNumber(anchorKey);
  const targetDay = keyDayNumber(dateKey);
  if (anchorDay === null || targetDay === null) return false;

  const difference = targetDay - anchorDay;
  const isAfterAnchor = latestCompletion ? difference > 0 : difference >= 0;
  if (!isAfterAnchor) return false;

  switch (frequency) {
    case 'daily':
      return true;
    case 'every_other_day':
      return difference % 2 === 0;
    case 'three_per_week': {
      const cycleDay = ((difference % 7) + 7) % 7;
      return cycleDay === 0 || cycleDay === 2 || cycleDay === 4;
    }
    case 'weekly':
      return difference % 7 === 0;
    case 'custom': {
      const weekday = isoWeekday(dateKey);
      return weekday !== null && scheduleDays.includes(weekday);
    }
    default:
      return false;
  }
}
