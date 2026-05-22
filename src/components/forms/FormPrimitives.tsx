// compyle — reusable form building blocks
import React, { useRef, useEffect } from 'react';

export const TASK_CATEGORIES = [
  { emoji: '⭐', label: 'Event' },
  { emoji: '❗', label: 'Quiz/Exam' },
  { emoji: '🔔', label: 'Deadline' },
  { emoji: '📌', label: 'Reminder' },
];
export const HABIT_FREQS = ['Daily', 'AM + PM', 'Every 3 days', 'Weekly', 'Bi-weekly', 'Mon/Wed/Fri', 'Wed + Sat', 'Custom'];
export const CAT_COLORS = ['#b04a2f','#d68a72','#c08838','#9a6f48','#4a5c3f','#87976f','#6b5e8a','#3d6480','#9e3a4d','#5a544a'];
export const BANK_COLORS = ['#1b3a6e','#0066cc','#00d68f','#b04a2f','#4a5c3f','#9e3a4d','#0a3d62','#6b5e8a','#c08838','#15130f'];

// ─── FormSheet wrapper ───
export function FormSheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="form-sheet">{children}</div>
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
export function FormFoot({ onSave, onCancel, onDelete, saveLabel = 'Save', canSave = true }: {
  onSave: () => void; onCancel: () => void; onDelete?: () => void;
  saveLabel?: string; canSave?: boolean;
}) {
  return (
    <div className="form-foot">
      {onDelete && <button className="del" onClick={onDelete} title="Delete">🗑</button>}
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

// ─── EmojiPicker ───
export function EmojiPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isPreset = TASK_CATEGORIES.some((c) => c.emoji === value);
  const [customMode, setCustomMode] = React.useState(!isPreset && !!value);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (customMode) inputRef.current?.focus(); }, [customMode]);

  return (
    <div className="emoji-cats">
      {TASK_CATEGORIES.map((c) => (
        <button key={c.emoji} type="button"
          className={`emoji-cat${value === c.emoji && !customMode ? ' selected' : ''}`}
          onClick={() => { setCustomMode(false); onChange(c.emoji); }}>
          <span className="emoji-cat-glyph">{c.emoji}</span>
          <span className="emoji-cat-label">{c.label}</span>
        </button>
      ))}
      <button type="button" className={`emoji-cat custom${customMode ? ' selected' : ''}`}
        onClick={() => setCustomMode(true)}>
        {customMode ? (
          <input ref={inputRef} className="emoji-cat-input"
            value={!isPreset ? value : ''}
            onChange={(e) => { const v = e.target.value; const chars = Array.from(v); onChange(chars[chars.length - 1] || '✨'); }}
            placeholder="✏️" maxLength={4}/>
        ) : (
          <>
            <span className="emoji-cat-glyph">{!isPreset && value ? value : '✏️'}</span>
            <span className="emoji-cat-label">{!isPreset && value ? 'Custom' : 'Edit'}</span>
          </>
        )}
      </button>
    </div>
  );
}

// ─── ColorPicker ───
export function ColorPicker({ value, onChange, palette }: { value: string; onChange: (v: string) => void; palette: string[] }) {
  return (
    <div className="color-pick">
      {palette.map((c) => (
        <button key={c} type="button" className={value === c ? 'selected' : ''} style={{ background: c }} onClick={() => onChange(c)} />
      ))}
    </div>
  );
}
