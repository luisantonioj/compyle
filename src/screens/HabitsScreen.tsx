// compyle — Track screen (mobile)
import React, { useState } from 'react';
import { Icons } from '../components/Icons';

import { DayChecklist } from '../components/ui/shared';
import { TODAY_KEY, computeStreak } from '../lib/seed';
import type { UserData, ViewMode, Habit, EditingState } from '../types';

interface HabitsProps {
  data: UserData;
  viewMode: ViewMode;
  isPartner: boolean;
  profileInitial: string;
  onProfile: () => void;
  onTrackDate: (id: string, dk: string) => void;
  onEdit: (e: EditingState) => void;
}

export function HabitsScreen({ data, viewMode, isPartner, profileInitial, onProfile, onTrackDate, onEdit }: HabitsProps) {
  const trackers = data.habits.filter((h) => !h.archived);
  const archivedTrackers = data.habits.filter((h) => h.archived);
  const [showArchived, setShowArchived] = useState(false);
  const doneToday = trackers.filter((h) => h.completedDates?.includes(TODAY_KEY)).length;

  const longestStreak = trackers.length > 0
    ? trackers.reduce<{ name: string; streak: number }>((best, h) => {
        const s = computeStreak(h.completedDates ?? []);
        return s > best.streak ? { name: h.name, streak: s } : best;
      }, { name: '', streak: 0 })
    : null;

  return (
    <div className="screen">
      <div className="top-bar">
        <div>
          <div className="kicker">Daily tracker</div>
          <h1>Your <em>track</em></h1>
        </div>
        <button className={`profile-pill${viewMode === 'partner' ? ' partner' : ''}`} onClick={onProfile}>
          {profileInitial}
          <span className="dot" />
        </button>
      </div>

      {/* summary card — temporarily hidden */}
      {/* <div className="pad-x">
        <div className="card" style={{ padding: '18px 20px', background: 'var(--ink)', color: 'var(--cream)' }}>
          <div className="label" style={{ color: 'rgba(244,239,228,0.6)' }}>Today's progress</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
            <div>
              <div className="amount" style={{ fontSize: 48, lineHeight: 0.9, color: 'var(--cream)' }}>
                {doneToday}
                <span style={{ fontSize: 22, color: 'rgba(244,239,228,0.6)' }}>/{trackers.length}</span>
              </div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(244,239,228,0.5)', marginTop: 6 }}>
                ticked today
              </div>
            </div>
            {longestStreak && longestStreak.streak > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 18 }}>🔥</span>
                  <div className="amount" style={{ fontSize: 32, color: 'var(--cream)' }}>{longestStreak.streak}</div>
                </div>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(244,239,228,0.5)', marginTop: 2 }}>
                  {longestStreak.name.split(' ')[0]} streak
                </div>
              </div>
            )}
          </div>
        </div>
      </div> */}

      {/* tracker list */}
      <div className="pad-x" style={{ marginTop: 22 }}>
        {trackers.length === 0 ? (
          <div className="card white" style={{ padding: '28px 18px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 16 }}>
              No trackers yet. Add one to start.
            </div>
          </div>
        ) : (
          <div className="card white" style={{ padding: '4px 18px' }}>
            {trackers.map((h: Habit) => (
              <div key={h.id} className="habit-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                    onClick={() => onEdit({ type: 'habit', item: h })}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <div style={{ fontSize: 16, color: 'var(--ink)' }}>{h.name}</div>
                      {!h.repeating && (
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          once
                        </span>
                      )}
                    </div>
                    {h.note && (
                      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
                        {h.note}
                      </div>
                    )}
                  </div>
                  {Icons.chevR({ stroke: 'var(--ink-faint)' })}
                </div>
                <DayChecklist
                  completedDates={h.completedDates ?? []}
                  onToggle={(dk) => onTrackDate(h.id, dk)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

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
            + Add tracker
          </button>
        </div>

      {archivedTrackers.length > 0 && (
        <div className="pad-x" style={{ marginTop: 8 }}>
          <button
            onClick={() => setShowArchived((v) => !v)}
            style={{
              width: '100%', padding: '10px', borderRadius: 12,
              border: '1px dashed var(--hair-strong)', background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              color: 'var(--ink-mute)', fontFamily: 'var(--mono)', fontSize: 10,
              letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
            }}
          >
            {showArchived ? '↑ Hide archived' : <>{Icons.archive({ stroke: 'currentColor' })} {archivedTrackers.length} archived</>}
          </button>
          {showArchived && (
            <div className="card white" style={{ padding: '4px 18px', marginTop: 8, opacity: 0.6 }}>
              {archivedTrackers.map((h: Habit) => (
                <div key={h.id} className="habit-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div
                      style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                      onClick={() => onEdit({ type: 'habit', item: h })}
                    >
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <div style={{ fontSize: 16, color: 'var(--ink)' }}>{h.name}</div>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          archived
                        </span>
                      </div>
                      {h.note && (
                        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
                          {h.note}
                        </div>
                      )}
                    </div>
                    {Icons.chevR({ stroke: 'var(--ink-faint)' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ height: 40 }} />
    </div>
  );
}
