import { useState } from 'react';
import { FormSheet, FormHead, FormFoot, Field, HABIT_FREQS_DAYS, HABIT_FREQS_TIME } from '../../components/forms/FormPrimitives';
import { TODAY_KEY } from '../../lib/seed';
import { createId } from '../../lib/ids';
import type { Habit } from '../../types';

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
  const [freqType, setFreqType] = useState<'days' | 'time'>(
    habit?.freqType ?? (HABIT_FREQS_TIME.includes(habit?.note ?? '') ? 'time' : 'days')
  );
  const [note, setNote] = useState(habit?.note ?? 'Daily');
  const [startDate, setStartDate] = useState(habit?.startDate ?? TODAY_KEY);
  const editing = !!habit?.id;

  const freqList = freqType === 'days' ? HABIT_FREQS_DAYS : HABIT_FREQS_TIME;

  const handleFreqType = (t: 'days' | 'time') => {
    setFreqType(t);
    const list = t === 'days' ? HABIT_FREQS_DAYS : HABIT_FREQS_TIME;
    if (!list.includes(note)) setNote(list[0]);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const saved: Habit = {
      id: habit?.id ?? createId('h'),
      name: name.trim(),
      note: repeating ? note : note.trim(),
      startDate,
      repeating,
      completedDates: habit?.completedDates ?? [],
    };
    if (repeating) saved.freqType = freqType;
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
          <Field label="Frequency">
            <div className="type-toggle" style={{ marginBottom: 10 }}>
              <button className={freqType === 'days' ? 'active' : ''} onClick={() => handleFreqType('days')}>By days</button>
              <button className={freqType === 'time' ? 'active' : ''} onClick={() => handleFreqType('time')}>By time</button>
            </div>
            <div className="chips">
              {freqList.map((f) => (
                <button key={f} type="button" className={note === f ? 'selected' : ''} onClick={() => setNote(f)}>{f}</button>
              ))}
            </div>
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
        canSave={!!name.trim()} saveLabel={editing ? 'Save' : 'Create tracker'}
      />
    </FormSheet>
  );
}

// Transaction form

