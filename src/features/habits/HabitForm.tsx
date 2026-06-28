import { useState } from 'react';
import { FormSheet, FormHead, FormFoot, Field } from '../../components/forms/FormPrimitives';
import { TODAY_KEY } from '../../lib/seed';
import { createId } from '../../lib/ids';
import type { Habit, HabitFrequency, HabitScheduleMode } from '../../types';
import { HABIT_FREQUENCIES, WEEKDAYS, legacyHabitSchedule, scheduleNote } from './habitSchedule';

export function HabitForm({ habit, onSave, onDelete, onArchive, archiveLabel, onClose }: {
  habit?: Habit;
  onSave: (h: Habit) => void;
  onDelete?: (id: string) => void;
  onArchive?: () => void;
  archiveLabel?: 'Archive' | 'Restore';
  onClose: () => void;
}) {
  const [name, setName] = useState(habit?.name ?? '');
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

  const toggleScheduleDay = (day: number) => {
    setScheduleDays((days) => days.includes(day)
      ? days.filter((value) => value !== day)
      : [...days, day].sort());
  };

  const handleSave = () => {
    if (!name.trim() || !customScheduleValid) return;
    const saved: Habit = {
      id: habit?.id ?? createId('h'),
      name: name.trim(),
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

  return (
    <FormSheet onClose={onClose}>
      <FormHead kicker={editing ? 'Edit tracker' : 'New tracker'} title={editing ? 'Update' : 'Create a'} accent={editing ? '' : 'tracker'} onClose={onClose}/>
      <div className="form-body">
        <Field label="Tracker name">
          <input className="field-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Floss, Gym, Read"/>
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
        canSave={!!name.trim() && customScheduleValid} saveLabel={editing ? 'Save' : 'Create tracker'}
      />
    </FormSheet>
  );
}
