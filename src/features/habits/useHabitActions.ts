import { useAppStore } from '../../store/appStore';
import { removeHabit, upsertHabit } from './habitRepository';
import type { DataSetter } from '../actionTypes';
import type { Habit, UserData } from '../../types';

interface HabitActionOptions {
  data: UserData;
  fs: boolean;
  activeUid: string;
  setActiveData: DataSetter;
  onComplete: (probability?: number) => void;
}

export function useHabitActions({ data, fs, activeUid, setActiveData, onComplete }: HabitActionOptions) {
  const store = useAppStore();

  const saveHabit = (h: Habit) => {
    if (fs) {
      void upsertHabit(activeUid, h);
    } else {
      setActiveData((d) => {
        const existed = d.habits.find((x) => x.id === h.id);
        const habits = existed ? d.habits.map((x) => (x.id === h.id ? h : x)) : [...d.habits, h];
        return { ...d, habits };
      });
    }
    store.setEditing(null);
    store.flash(store.editing && 'item' in store.editing && store.editing.item ? 'Tracker updated' : 'New tracker created');
  };

  const deleteHabit = (id: string) => {
    const removed = data.habits.find((h) => h.id === id);
    store.setEditing(null);
    if (fs) {
      void removeHabit(activeUid, id);
    } else {
      setActiveData((d) => ({ ...d, habits: d.habits.filter((h) => h.id !== id) }));
    }
    store.flash('Tracker deleted', 'Undo', () => {
      if (removed) saveHabit(removed);
      store.setToast(null);
    });
  };

  const archiveHabit = (habit: Habit) => {
    const updated = { ...habit, archived: true };
    store.setEditing(null);
    if (fs) {
      void upsertHabit(activeUid, updated);
    } else {
      setActiveData((d) => ({ ...d, habits: d.habits.map((h) => h.id === habit.id ? updated : h) }));
    }
    store.flash('Tracker archived', 'Undo', () => {
      const restored = { ...habit, archived: false };
      if (fs) void upsertHabit(activeUid, restored);
      else setActiveData((d) => ({ ...d, habits: d.habits.map((h) => h.id === habit.id ? restored : h) }));
      store.setToast(null);
    });
  };

  const restoreHabit = (habit: Habit) => {
    const updated = { ...habit, archived: false };
    store.setEditing(null);
    if (fs) {
      void upsertHabit(activeUid, updated);
    } else {
      setActiveData((d) => ({ ...d, habits: d.habits.map((h) => h.id === habit.id ? updated : h) }));
    }
    store.flash('Tracker restored');
  };

  const toggleTrackerDate = (habitId: string, dk: string) => {
    if (fs) {
      const habit = data.habits.find((h) => h.id === habitId);
      if (!habit) return;
      const dates = habit.completedDates ?? [];
      const isOn = dates.includes(dk);
      const newDates = isOn ? dates.filter((d) => d !== dk) : [...dates, dk].sort();
      if (!isOn) onComplete(0.3);
      void upsertHabit(activeUid, { ...habit, completedDates: newDates });
    } else {
      setActiveData((d) => {
        const habits = d.habits.map((h) => {
          if (h.id !== habitId) return h;
          const dates = h.completedDates ?? [];
          const isOn = dates.includes(dk);
          const newDates = isOn ? dates.filter((x) => x !== dk) : [...dates, dk].sort();
          if (!isOn) onComplete(0.3);
          return { ...h, completedDates: newDates };
        });
        return { ...d, habits };
      });
    }
  };

  return { saveHabit, deleteHabit, archiveHabit, restoreHabit, toggleTrackerDate };
}
