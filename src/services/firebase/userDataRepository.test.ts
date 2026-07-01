import { describe, expect, it } from 'vitest';
import { EMPTY_DATA } from '../../lib/seed';
import { clearPrivatePartnerData } from './userDataRepository';
import type { UserData } from '../../types';

describe('clearPrivatePartnerData', () => {
  it('removes data from sections a partner has made private', () => {
    const data: UserData = {
      ...structuredClone(EMPTY_DATA),
      tasks: { '2026-07-01': [{ id: 'task-1', title: 'Private task', emoji: '', time: null, done: false, recurrence: null, recurrenceEnd: null }] },
      habits: [{ id: 'habit-1', name: 'Visible habit', note: '', completedDates: [], repeating: true }],
      notes: [{ id: 'note-1', title: 'Private note', content: '', updated_at: 1 }],
    };
    const privacy = { cal: false, habits: true, money: false, links: false, notes: false };

    const result = clearPrivatePartnerData(data, privacy);

    expect(result.tasks).toEqual({});
    expect(result.notes).toEqual([]);
    expect(result.habits).toEqual(data.habits);
    expect(result.privacy).toEqual(privacy);
  });
});
