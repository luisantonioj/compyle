import React, { useEffect, useRef, useState } from 'react';
import { FormSheet, FormHead, FormFoot, Field, TaskTypePicker, TASK_CATEGORIES } from '../../components/forms/FormPrimitives';
import { TODAY_KEY } from '../../lib/seed';
import { createId } from '../../lib/ids';
import type { Task, TaskType } from '../../types';

export function TaskForm({ task, dateKey, taskTypes = [], onSave, onSaveTaskType = () => {}, onDelete, onClose }: {
  task?: Task; dateKey: string;
  taskTypes?: TaskType[];
  onSave: (task: Task, dateKey: string) => void;
  onSaveTaskType?: (taskType: TaskType) => void;
  onDelete?: (id: string, dateKey: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const initialPreset = TASK_CATEGORIES.find((type) => type.emoji === (task?.emoji ?? ''));
  const [selectedType, setSelectedType] = useState<TaskType>(() => {
    if (task?.taskTypeId) {
      return taskTypes.find((type) => type.id === task.taskTypeId) ?? {
        id: task.taskTypeId,
        emoji: task.emoji,
        label: task.taskTypeLabel ?? 'Custom',
      };
    }
    return initialPreset ?? TASK_CATEGORIES[0];
  });
  const descRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [description]);
  const [time, setTime] = useState(task?.time ?? '');
  const [date, setDate] = useState(dateKey);
  const [recurrence, setRecurrence] = useState<string | null>(task?.recurrence ?? null);
  const [recurrenceEnd, setRecurrenceEnd] = useState<string | null>(task?.recurrenceEnd ?? null);
  const editing = !!task?.id;

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      id: task?.id ?? createId('t'),
      title: title.trim(),
      emoji: selectedType.emoji,
      taskTypeId: selectedType.id,
      taskTypeLabel: selectedType.label,
      description: description.trim() || undefined,
      time: time || null,
      done: task?.done ?? false,
      recurrence: recurrence ? recurrence as Task['recurrence'] : undefined,
      recurrenceEnd: (recurrence && recurrenceEnd) ? recurrenceEnd : undefined,
    }, date);
  };

  return (
    <FormSheet onClose={onClose}>
      <FormHead kicker={editing ? 'Edit task' : 'New task'} title={editing ? 'Update' : 'Add'} accent="task" onClose={onClose}/>
      <div className="form-body">
        <Field label="Title">
          <input className="field-input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's the task?"/>
        </Field>
        <Field label="Description (optional)">
          <textarea ref={descRef} className="field-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a note or details..." rows={1} style={{ resize: 'none', overflow: 'hidden', lineHeight: 1.5 }}/>
        </Field>
        <Field label="Type">
          <TaskTypePicker
            value={selectedType.id}
            customTypes={taskTypes}
            onChange={setSelectedType}
            onCreate={onSaveTaskType}
          />
        </Field>
        <div className="field-row">
          <Field label="Repeat">
            <select className="field-input" value={recurrence ?? ''}
              onChange={(e) => { setRecurrence(e.target.value || null); if (!e.target.value) setRecurrenceEnd(null); }}>
              <option value="">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </Field>
          {recurrence && (
            <Field label="Until (optional)">
              <input type="date" className="field-input"
                value={recurrenceEnd ?? ''}
                onChange={(e) => setRecurrenceEnd(e.target.value || null)}/>
            </Field>
          )}
        </div>
        <div className="field-row">
          <Field label="Date">
            <input type="date" className="field-input" value={date} onChange={(e) => setDate(e.target.value)}/>
          </Field>
          <Field label="Time (optional)">
            <input type="time" className="field-input" value={time} onChange={(e) => setTime(e.target.value)}/>
          </Field>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-mute)' }}>
          {time ? `Reminder set for ${time}` : 'No reminder set'}
        </div>
      </div>
      <FormFoot
        onSave={handleSave} onCancel={onClose}
        onDelete={editing && onDelete ? () => onDelete(task!.id, date) : undefined}
        canSave={!!title.trim()} saveLabel={editing ? 'Save' : 'Add task'}
      />
    </FormSheet>
  );
}

// Task view modal

