import { describe, expect, it } from 'vitest';
import type { Habit } from '../../types';
import { isHabitGuideDate } from './habitSchedule';

const habit = (overrides: Partial<Habit>): Habit => ({
  id: 'h1',
  name: 'Read',
  note: 'Daily',
  frequency: 'daily',
  startDate: '2026-06-01',
  completedDates: [],
  repeating: true,
  ...overrides,
});

describe('habit schedule guides', () => {
  it('continues every-other-day from the latest completion', () => {
    const tracker = habit({
      frequency: 'every_other_day',
      note: 'Every other day',
      completedDates: ['2026-06-20'],
    });

    expect(isHabitGuideDate(tracker, '2026-06-21')).toBe(false);
    expect(isHabitGuideDate(tracker, '2026-06-22')).toBe(true);
    expect(isHabitGuideDate(tracker, '2026-06-24')).toBe(true);
  });

  it('uses a two-two-three day rhythm for three times a week', () => {
    const tracker = habit({
      frequency: 'three_per_week',
      note: '3× a week',
      completedDates: ['2026-06-20'],
    });

    expect(isHabitGuideDate(tracker, '2026-06-22')).toBe(true);
    expect(isHabitGuideDate(tracker, '2026-06-24')).toBe(true);
    expect(isHabitGuideDate(tracker, '2026-06-27')).toBe(true);
    expect(isHabitGuideDate(tracker, '2026-06-26')).toBe(false);
  });

  it('guides selected custom weekdays after the latest completion', () => {
    const tracker = habit({
      frequency: 'custom',
      scheduleMode: 'days',
      scheduleDays: [1, 3, 5],
      note: 'Mon, Wed, Fri',
      completedDates: ['2026-06-24'],
    });

    expect(isHabitGuideDate(tracker, '2026-06-26')).toBe(true);
    expect(isHabitGuideDate(tracker, '2026-06-27')).toBe(false);
    expect(isHabitGuideDate(tracker, '2026-06-29')).toBe(true);
  });

  it('keeps custom times-per-week guides on standby', () => {
    const tracker = habit({
      frequency: 'custom',
      scheduleMode: 'times_per_week',
      timesPerWeek: 4,
      note: '4× a week',
      completedDates: ['2026-06-20'],
    });

    expect(isHabitGuideDate(tracker, '2026-06-21')).toBe(false);
    expect(isHabitGuideDate(tracker, '2026-06-22')).toBe(false);
  });
});
