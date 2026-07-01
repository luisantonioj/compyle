import { useMemo, useState } from 'react';
import { FormSheet, FormHead, FormFoot, Field } from '../../components/forms/FormPrimitives';
import { TODAY_KEY } from '../../lib/seed';
import { createId } from '../../lib/ids';
import type { Habit, HabitCategory, HabitFrequency, HabitScheduleMode } from '../../types';
import { HABIT_FREQUENCIES, WEEKDAYS, legacyHabitSchedule, scheduleNote } from './habitSchedule';

const DEFAULT_CATEGORIES: HabitCategory[] = [
  { id: 'skin-care', name: 'Skin Care', sort_order: 0 },
  { id: 'body-care', name: 'Body Care', sort_order: 1 },
];
const ADD_CATEGORY_VALUE = '__add_new__';

export function HabitForm({
  habit,
  categories = [],
  onSave,
  onSaveCategory,
  onDelete,
  onArchive,
  archiveLabel,
  onClose,
}: {
  habit?: Habit;
  categories?: HabitCategory[];
  onSave: (h: Habit) => void;
  onSaveCategory?: (category: HabitCategory) => void;
  onDelete?: (id: string) => void;
  onArchive?: () => void;
  archiveLabel?: 'Archive' | 'Restore';
  onClose: () => void;
}) {
  const [name, setName] = useState(habit?.name ?? '');
  const mergedCategories = useMemo(() => {
    const byId = new Map(DEFAULT_CATEGORIES.map((category) => [category.id, category]));
    categories.forEach((category) => byId.set(category.id, category));
    return [...byId.values()].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [categories]);
  const [addedCategories, setAddedCategories] = useState<HabitCategory[]>([]);
  const allCategories = useMemo(() => {
    const byId = new Map(mergedCategories.map((category) => [category.id, category]));
    addedCategories.forEach((category) => byId.set(category.id, category));
    return [...byId.values()].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [addedCategories, mergedCategories]);
  const [categoryId, setCategoryId] = useState(habit?.categoryId ?? mergedCategories[0].id);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [repeating, setRepeating] = useState(habit?.repeating ?? true);
  const initialSchedule = habit?.frequency
    ? {
        frequency: habit.frequency,
        scheduleMode: habit.scheduleMode,
        scheduleDays: habit.scheduleDays,
        timesPerWeek: habit.timesPerWeek,
      }
    : legacyHabitSchedule(habit?.note ?? 'Daily');
  const [frequency, setFrequency] = useState<HabitFrequency>(initialSchedule.frequency);
  const [scheduleMode, setScheduleMode] = useState<HabitScheduleMode>(initialSchedule.scheduleMode ?? 'days');
  const [scheduleDays, setScheduleDays] = useState<number[]>(initialSchedule.scheduleDays ?? []);
  const [timesPerWeek, setTimesPerWeek] = useState(initialSchedule.timesPerWeek ?? 3);
  const [note, setNote] = useState(habit?.note ?? '');
  const [startDate, setStartDate] = useState(habit?.startDate ?? TODAY_KEY);
  const editing = !!habit?.id;
  const customScheduleValid = frequency !== 'custom' || scheduleMode !== 'days' || scheduleDays.length > 0;
  const selectedCategory = allCategories.find((category) => category.id === categoryId);

  const toggleScheduleDay = (day: number) => {
    setScheduleDays((days) => days.includes(day)
      ? days.filter((value) => value !== day)
      : [...days, day].sort());
  };

  const handleSave = () => {
    if (!name.trim() || !customScheduleValid || !selectedCategory) return;
    onSaveCategory?.(selectedCategory);
    const saved: Habit = {
      id: habit?.id ?? createId('h'),
      name: name.trim(),
      categoryId,
      note: repeating ? scheduleNote(frequency, scheduleMode, scheduleDays, timesPerWeek) : note.trim(),
      startDate,
      repeating,
      completedDates: habit?.completedDates ?? [],
    };
    if (repeating) {
      saved.frequency = frequency;
      if (frequency === 'custom') {
        saved.scheduleMode = scheduleMode;
        if (scheduleMode === 'days') saved.scheduleDays = scheduleDays;
        else saved.timesPerWeek = timesPerWeek;
      }
    }
    onSave(saved);
  };

  const addCategory = () => {
    const categoryName = newCategoryName.trim();
    if (!categoryName) return;
    const existing = allCategories.find(
      (category) => category.name.localeCompare(categoryName, undefined, { sensitivity: 'accent' }) === 0,
    );
    if (existing) {
      setCategoryId(existing.id);
    } else {
      const category: HabitCategory = {
        id: createId('hc'),
        name: categoryName,
        sort_order: allCategories.length,
      };
      setAddedCategories((current) => [...current, category]);
      setCategoryId(category.id);
      onSaveCategory?.(category);
    }
    setNewCategoryName('');
    setAddingCategory(false);
  };

  return (
    <FormSheet onClose={onClose}>
      <FormHead kicker={editing ? 'Edit tracker' : 'New tracker'} title={editing ? 'Update' : 'Create a'} accent={editing ? '' : 'tracker'} onClose={onClose}/>
      <div className="form-body">
        <Field label="Tracker name">
          <input className="field-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Floss, Gym, Read"/>
        </Field>
        <Field label="Category">
          <select
            className="field-input"
            value={addingCategory ? ADD_CATEGORY_VALUE : categoryId}
            onChange={(event) => {
              if (event.target.value === ADD_CATEGORY_VALUE) {
                setAddingCategory(true);
                return;
              }
              setAddingCategory(false);
              setCategoryId(event.target.value);
            }}
            aria-label="Category"
          >
            {allCategories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
            <option value={ADD_CATEGORY_VALUE}>Add New Category</option>
          </select>
          {addingCategory && (
            <div className="new-category-field">
              <input
                className="field-input"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addCategory();
                  }
                }}
                placeholder="Enter a new category"
                aria-label="New category name"
                autoFocus
              />
              <button type="button" onClick={addCategory} disabled={!newCategoryName.trim()}>
                Add
              </button>
            </div>
          )}
        </Field>
        <Field label="Repetition">
          <div className="type-toggle">
            <button className={repeating ? 'active' : ''} onClick={() => setRepeating(true)}>Repeating</button>
            <button className={!repeating ? 'active' : ''} onClick={() => setRepeating(false)}>No repetition</button>
          </div>
        </Field>
        {repeating && (
          <Field label="How often?">
            <div className="chips frequency-chips">
              {HABIT_FREQUENCIES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={frequency === option.value ? 'selected' : ''}
                  onClick={() => setFrequency(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {frequency === 'custom' && (
              <div className="custom-schedule">
                <div className="custom-schedule-title">What schedule works best?</div>
                <div className="type-toggle custom-schedule-toggle">
                  <button className={scheduleMode === 'days' ? 'active' : ''} onClick={() => setScheduleMode('days')}>
                    Pick days
                  </button>
                  <button className={scheduleMode === 'times_per_week' ? 'active' : ''} onClick={() => setScheduleMode('times_per_week')}>
                    Set times per week
                  </button>
                </div>
                {scheduleMode === 'days' ? (
                  <>
                    <div className="weekday-picker" aria-label="Days of the week">
                      {WEEKDAYS.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          className={scheduleDays.includes(day.value) ? 'selected' : ''}
                          aria-label={day.label}
                          aria-pressed={scheduleDays.includes(day.value)}
                          onClick={() => toggleScheduleDay(day.value)}
                        >
                          {day.short}
                        </button>
                      ))}
                    </div>
                    {!scheduleDays.length && <div className="schedule-hint">Choose at least one day.</div>}
                  </>
                ) : (
                  <div className="times-per-week" aria-label="Times per week">
                    {[1, 2, 3, 4, 5, 6, 7].map((count) => (
                      <button
                        key={count}
                        type="button"
                        className={timesPerWeek === count ? 'selected' : ''}
                        aria-label={`${count} ${count === 1 ? 'time' : 'times'} per week`}
                        onClick={() => setTimesPerWeek(count)}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Field>
        )}
        {!repeating && (
          <Field label="Note (optional)">
            <input className="field-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. One-time goal"/>
          </Field>
        )}
        <Field label="Start date">
          <input type="date" className="field-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} max={TODAY_KEY}/>
        </Field>
      </div>
      <FormFoot
        onSave={handleSave} onCancel={onClose}
        onDelete={editing && onDelete ? () => onDelete(habit!.id) : undefined}
        onArchive={editing ? onArchive : undefined}
        archiveLabel={archiveLabel}
        canSave={!!name.trim() && customScheduleValid && !!selectedCategory} saveLabel={editing ? 'Save' : 'Create tracker'}
      />
    </FormSheet>
  );
}
