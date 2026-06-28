import { describe, expect, it } from 'vitest';
import { normalizeHabitDoc } from './habitRepository';

describe('habit repository normalization', () => {
  it('normalizes the custom schedule fields stored in Firestore', () => {
    expect(normalizeHabitDoc({
      id: 'h1',
      name: 'Read',
      note: 'Mon, Wed, Fri',
      frequency: 'custom',
      scheduleMode: 'days',
      scheduleDays: [5, 3, 3, 1, 9],
      completedDates: [],
      repeating: true,
    })).toEqual(expect.objectContaining({
      frequency: 'custom',
      scheduleMode: 'days',
      scheduleDays: [1, 3, 5],
      timesPerWeek: undefined,
    }));
  });

  it('maps legacy frequency labels to the new backend model', () => {
    expect(normalizeHabitDoc({
      id: 'h2',
      name: 'Laundry',
      note: 'Wed + Sat',
      completedDates: [],
      repeating: true,
    })).toEqual(expect.objectContaining({
      frequency: 'custom',
      scheduleMode: 'days',
      scheduleDays: [3, 6],
    }));
  });
});
