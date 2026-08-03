import { useAppStore } from '../../store/appStore';
import { removeHabit, removeHabitCategory, upsertHabit, upsertHabitCategory } from './habitRepository';
import type { DataSetter } from '../actionTypes';
import type { Habit, HabitCategory, UserData } from '../../types';

interface HabitActionOptions {
  data: UserData;
  fs: boolean;
  activeUid: string;
  setActiveData: DataSetter;
  onComplete: (probability?: number) => void;
}

export function useHabitActions({ data, fs, activeUid, setActiveData, onComplete }: HabitActionOptions) {
  const store = useAppStore();

  const reorderHabits = (reorderedHabits: Habit[]) => {
    const ordered = reorderedHabits.map((habit, index) => ({ ...habit, sort_order: index }));
    if (fs) {
      ordered.forEach((habit) => void upsertHabit(activeUid, habit));
    } else {
      setActiveData((d) => ({ ...d, habits: ordered }));
    }
  };

  const saveHabitCategory = (category: HabitCategory) => {
    if (fs) {
      void upsertHabitCategory(activeUid, category);
    } else {
      setActiveData((d) => {
        const categories = d.habitCategories ?? [];
        const exists = categories.some((item) => item.id === category.id);
        return {
          ...d,
          habitCategories: exists
            ? categories.map((item) => item.id === category.id ? category : item)
            : [...categories, category],
        };
      });
    }
  };

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

  const deleteHabitCategory = (id: string) => {
    const category = (data.habitCategories ?? []).find((item) => item.id === id);
    if (!category) return;
    if (fs) {
      void upsertHabitCategory(activeUid, { ...category, deleted: true });
      data.habits.filter((habit) => habit.categoryId === id).forEach((habit) => void upsertHabit(activeUid, { ...habit, categoryId: undefined }));
    } else {
      setActiveData((d) => ({
        ...d,
        habitCategories: (d.habitCategories ?? []).map((item) => item.id === id ? { ...item, deleted: true } : item),
        habits: d.habits.map((habit) => habit.categoryId === id ? { ...habit, categoryId: undefined } : habit),
      }));
    }
    store.flash('Category deleted');
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

  return { reorderHabits, saveHabit, saveHabitCategory, deleteHabitCategory, deleteHabit, archiveHabit, restoreHabit, toggleTrackerDate };
}
