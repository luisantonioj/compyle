// compyle — Habits screen
import React from 'react';
import { Icons } from '../components/Icons';
import { HeatGrid } from '../components/ui/shared';
import type { UserData, ViewMode, Habit, EditingState } from '../types';

interface HabitsProps {
  data: UserData;
  viewMode: ViewMode;
  isPartner: boolean;
  onProfile: () => void;
  onHabitCheck: (id: string) => void;
  onEdit: (e: EditingState) => void;
}

export function HabitsScreen({ data, viewMode, isPartner, onProfile, onHabitCheck, onEdit }: HabitsProps) {
  const habits = data.habits;
  const completedToday = habits.filter((h) => h.doneToday).length;
  const longest = habits.length > 0
    ? habits.reduce((a, h) => (h.streak > a.streak ? h : a), habits[0])
    : null;

  return (
    <div className="screen">
      <div className="top-bar">
        <div>
          <div className="kicker">Habit tracker</div>
          <h1>Tiny <em>rituals</em></h1>
        </div>
        <button className={`profile-pill${viewMode === 'partner' ? ' partner' : ''}`} onClick={onProfile}>
          {viewMode === 'partner' ? 'L' : 'y'}
          <span className="dot" />
        </button>
      </div>

      {/* summary card */}
      <div className="pad-x">
        <div className="card" style={{ padding: '18px 20px', background: 'var(--ink)', color: 'var(--cream)' }}>
          <div className="label" style={{ color: 'rgba(244,239,228,0.6)' }}>Today's progress</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
            <div>
              <div className="amount" style={{ fontSize: 48, lineHeight: 0.9, color: 'var(--cream)' }}>
                {completedToday}
                <span style={{ fontSize: 22, color: 'rgba(244,239,228,0.6)' }}>/{habits.length}</span>
              </div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(244,239,228,0.5)', marginTop: 6 }}>
                done today
              </div>
            </div>
            {longest && longest.streak > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 18 }}>🔥</span>
                  <div className="amount" style={{ fontSize: 32, color: 'var(--cream)' }}>{longest.streak}</div>
                </div>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(244,239,228,0.5)', marginTop: 2 }}>
                  {longest.name.split(' ')[0]} streak
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* habit list */}
      <div className="pad-x" style={{ marginTop: 22 }}>
        {habits.length === 0 ? (
          <div className="card white" style={{ padding: '28px 18px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 16 }}>
              No habits yet. Add one to start.
            </div>
          </div>
        ) : (
          <div className="card white" style={{ padding: '4px 18px' }}>
            {habits.map((h: Habit) => (
              <div key={h.id} className="habit-row">
                <button
                  className={`check-circle${h.doneToday ? ' checked' : ''}`}
                  disabled={isPartner}
                  onClick={() => !isPartner && onHabitCheck(h.id)}
                >
                  {Icons.check({ size: 16 })}
                </button>
                <div
                  style={{ flex: 1, minWidth: 0, cursor: isPartner ? 'default' : 'pointer' }}
                  onClick={() => !isPartner && onEdit({ type: 'habit', item: h })}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <div style={{ fontSize: 16, color: 'var(--ink)' }}>{h.name}</div>
                    {h.streak > 0 && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--clay)', letterSpacing: '0.05em' }}>
                        🔥 {h.streak}d
                      </div>
                    )}
                  </div>
                  {h.note && (
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4, marginBottom: 8 }}>
                      {h.note}
                    </div>
                  )}
                  <HeatGrid pattern={h.pattern} />
                </div>
                {!isPartner && Icons.chevR({ stroke: 'var(--ink-faint)' })}
              </div>
            ))}
          </div>
        )}
      </div>

      {!isPartner && (
        <div className="pad-x" style={{ marginTop: 16 }}>
          <button
            onClick={() => onEdit({ type: 'habit' })}
            style={{
              width: '100%', padding: '13px', borderRadius: 14,
              border: '1.5px dashed var(--hair-strong)', background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              color: 'var(--ink-soft)', fontFamily: 'var(--mono)', fontSize: 11,
              letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
            }}
          >
            + Add habit
          </button>
        </div>
      )}

      <div style={{ height: 40 }} />
    </div>
  );
}
