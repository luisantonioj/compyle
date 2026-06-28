import { FormSheet, FormHead } from '../../components/forms/FormPrimitives';
import { Icons } from '../../components/Icons';
import { parseKey } from '../../lib/seed';
import type { Task } from '../../types';

export function TaskViewModal({ task, dateKey, onEdit, onDelete, onCheck, onClose }: {
  task: Task; dateKey: string;
  onEdit: () => void;
  onDelete: () => void;
  onCheck: () => void;
  onClose: () => void;
}) {
  const d = parseKey(dateKey);
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <FormSheet onClose={onClose}>
      <FormHead kicker="Task" title={task.emoji ? `${task.emoji}  ${task.title}` : task.title} onClose={onClose}/>
      <div className="form-body">
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.08em', marginTop: -8 }}>
          {dateLabel}
        </div>

        {task.description ? (
          <div style={{
            background: 'var(--cream-deep)', borderRadius: 12,
            padding: '14px 16px', fontFamily: 'var(--sans)',
            fontSize: 15, color: 'var(--ink-soft)',
            display: 'flex', flexDirection: 'column', gap: '4px',
          }}>
            {task.description.split(/\r?\n|\||;|•/).map((line) => line.trim()).filter(Boolean).map((line, idx) => (
              <div key={idx} style={{ lineHeight: 1.5 }}>{line}</div>
            ))}
          </div>
        ) : (
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-faint)' }}>
            No description.
          </div>
        )}

        {(task.time || task.recurrence) && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {task.time && (
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.08em' }}>
                Time: {task.time}
              </span>
            )}
            {task.recurrence && (
              <span className="mono" style={{ fontSize: 11, color: 'var(--clay)', letterSpacing: '0.08em' }}>
                Repeats: {task.recurrence}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="form-foot">
        <button className="del" onClick={onDelete} title="Delete" aria-label="Delete task">
          {Icons.trash({ size: 18 })}
        </button>
        <button className="cancel" style={{ flex: '0 0 50px' }} onClick={onEdit} title="Edit" aria-label="Edit task">
          {Icons.pencil({ size: 18 })}
        </button>
        <button className="save" onClick={() => { onCheck(); onClose(); }}>
          {task.done ? 'Mark as undone' : 'Complete task'}
        </button>
      </div>
    </FormSheet>
  );
}

// Tracker form
