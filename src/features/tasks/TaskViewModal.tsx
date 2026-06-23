import { FormSheet, FormHead } from '../../components/forms/FormPrimitives';
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
            fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.65,
            whiteSpace: 'pre-wrap',
          }}>
            {task.description}
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
                â° {task.time}
              </span>
            )}
            {task.recurrence && (
              <span className="mono" style={{ fontSize: 11, color: 'var(--clay)', letterSpacing: '0.08em' }}>
                â†» {task.recurrence}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="form-foot">
        <button className="del" onClick={onDelete} title="Delete">ðŸ—‘</button>
        <button className="cancel" style={{ flex: '0 0 50px' }} onClick={onEdit} title="Edit">âœï¸</button>
        <button className="save" onClick={() => { onCheck(); onClose(); }}>
          {task.done ? 'Mark as undone' : 'Complete task'}
        </button>
      </div>
    </FormSheet>
  );
}

// â”€â”€â”€ Tracker form â”€â”€â”€
