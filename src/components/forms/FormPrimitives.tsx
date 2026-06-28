// compyle — reusable form building blocks
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChromePicker } from 'react-color';
import { Icons } from '../Icons';
import { createId } from '../../lib/ids';
import type { TaskType } from '../../types';

export const TASK_CATEGORIES: TaskType[] = [
  { id: 'none', emoji: '', label: 'None' },
  { id: 'reminder', emoji: '📌', label: 'Reminder' },
  { id: 'exam', emoji: '❗', label: 'Exam' },
  { id: 'deadline', emoji: '🔔', label: 'Deadline' },
  { id: 'event', emoji: '⭐', label: 'Event' },
];
export const CAT_COLORS = ['#8f1d2b','#c04059','#c08838','#9a6f48','#4a5c3f','#87976f','#5e131c','#3d6480','#9e3a4d','#5a544a'];
export const BANK_COLORS = ['#1b3a6e','#0066cc','#00d68f','#8f1d2b','#4a5c3f','#9e3a4d','#0a3d62','#5e131c','#c08838','#15130f'];

// ─── FormSheet wrapper ───
export function FormSheet({ children, onClose, className }: { children: React.ReactNode; onClose: () => void; className?: string }) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className={`form-sheet ${className || ''}`}>{children}</div>
    </>
  );
}

// ─── FormHead ───
export function FormHead({ kicker, title, accent, onClose }: { kicker: string; title: string; accent?: string; onClose: () => void }) {
  return (
    <div className="form-head">
      <div>
        <div className="kicker">{kicker}</div>
        <h2>{title}{accent && <em> {accent}</em>}</h2>
      </div>
      <button className="close" onClick={onClose}>×</button>
    </div>
  );
}

// ─── FormFoot ───
export function FormFoot({ onSave, onCancel, onDelete, onArchive, archiveLabel = 'Archive', saveLabel = 'Save', canSave = true }: {
  onSave: () => void; onCancel: () => void; onDelete?: () => void;
  onArchive?: () => void; archiveLabel?: 'Archive' | 'Restore';
  saveLabel?: string; canSave?: boolean;
}) {
  return (
    <div className="form-foot">
      {onDelete && <button className="del" onClick={onDelete} title="Delete">🗑</button>}
      {onArchive && (
        <button className="arch" onClick={onArchive} title={archiveLabel}>
          {archiveLabel === 'Restore' ? Icons.restore({ stroke: 'currentColor' }) : Icons.archive({ stroke: 'currentColor' })}
        </button>
      )}
      <button className="cancel" onClick={onCancel}>Cancel</button>
      <button className="save" onClick={onSave} disabled={!canSave}>{saveLabel}</button>
    </div>
  );
}

// ─── Field ───
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

const EMOJI_CHOICES = ['✨', '💼', '📚', '💡', '🛒', '🏥', '✈️', '🎯', '💬', '🧾', '🎂', '🏡'];

// ─── TaskTypePicker ───
export function TaskTypePicker({ value, customTypes, onChange, onCreate }: {
  value: string;
  customTypes: TaskType[];
  onChange: (type: TaskType) => void;
  onCreate: (type: TaskType) => void;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [emoji, setEmoji] = useState('✨');
  const [label, setLabel] = useState('');
  const [savedTypes, setSavedTypes] = useState(customTypes);
  const labelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSavedTypes((current) => {
      const localOnly = current.filter((type) => !customTypes.some((incoming) => incoming.id === type.id));
      return [...customTypes, ...localOnly];
    });
  }, [customTypes]);

  useEffect(() => {
    if (customOpen) labelRef.current?.focus();
  }, [customOpen]);

  const saveCustomType = () => {
    const cleanLabel = label.trim();
    const cleanEmoji = emoji.trim() || '✨';
    if (!cleanLabel) return;
    const existing = savedTypes.find(
      (type) => type.label.toLocaleLowerCase() === cleanLabel.toLocaleLowerCase() && type.emoji === cleanEmoji,
    );
    const type: TaskType = existing ?? {
      id: createId('tt'),
      emoji: cleanEmoji,
      label: cleanLabel,
      created_at: Date.now(),
    };
    if (!existing) {
      setSavedTypes((types) => [...types, type]);
      onCreate(type);
    }
    onChange(type);
    setCustomOpen(false);
    setEmoji('✨');
    setLabel('');
  };

  return (
    <>
      <div className="emoji-cats" aria-label="Task type">
        {[...TASK_CATEGORIES, ...savedTypes].map((type) => (
          <button key={type.id} type="button"
            className={`emoji-cat${value === type.id ? ' selected' : ''}`}
            onClick={() => onChange(type)}
            aria-label={type.label}
            aria-pressed={value === type.id}>
            <span className="emoji-cat-glyph">{type.emoji || '–'}</span>
            <span className="emoji-cat-label">{type.label}</span>
          </button>
        ))}
        <button type="button" className="emoji-cat custom" onClick={() => setCustomOpen(true)} aria-label="Custom">
          <span className="emoji-cat-glyph">＋</span>
          <span className="emoji-cat-label">Custom</span>
        </button>
      </div>
      {customOpen && createPortal((
        <>
          <div className="task-type-backdrop" onClick={() => setCustomOpen(false)} />
          <section className="task-type-dialog" role="dialog" aria-modal="true" aria-labelledby="task-type-title">
            <div className="task-type-dialog-handle" />
            <div className="task-type-dialog-head">
              <div>
                <div className="kicker">Reusable task type</div>
                <h3 id="task-type-title">Make it yours</h3>
              </div>
              <button type="button" className="close" onClick={() => setCustomOpen(false)} aria-label="Close custom task type">×</button>
            </div>
            <div className="task-type-dialog-body">
              <div className="field">
                <label className="field-label" htmlFor="custom-task-emoji">Emoji</label>
                <div className="task-type-emoji-input-wrap">
                  <input id="custom-task-emoji" className="task-type-emoji-input" value={emoji}
                    onChange={(event) => setEmoji(event.target.value)}
                    maxLength={12}
                    aria-label="Custom task type emoji" />
                  <div className="task-type-emoji-options">
                    {EMOJI_CHOICES.map((choice) => (
                      <button key={choice} type="button" className={emoji === choice ? 'selected' : ''}
                        onClick={() => setEmoji(choice)} aria-label={`Use ${choice}`}>{choice}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="custom-task-label">Label</label>
                <input ref={labelRef} id="custom-task-label" className="field-input" value={label}
                  onChange={(event) => setLabel(event.target.value.slice(0, 24))}
                  onKeyDown={(event) => { if (event.key === 'Enter') saveCustomType(); }}
                  placeholder="e.g. Errand" />
              </div>
            </div>
            <div className="task-type-dialog-foot">
              <button type="button" className="cancel" onClick={() => setCustomOpen(false)}>Cancel</button>
              <button type="button" className="save" onClick={saveCustomType} disabled={!label.trim()}>Save type</button>
            </div>
          </section>
        </>
      ), document.body)}
    </>
  );
}

// ─── ColorPicker ───
export function ColorPicker({ value, onChange, palette }: { value: string; onChange: (v: string) => void; palette: string[] }) {
  return (
    <div className="color-pick-wrapper" style={{ marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
      <ChromePicker color={value || '#000000'} onChange={(c: any) => onChange(c.hex)} disableAlpha={true} />
    </div>
  );
}
