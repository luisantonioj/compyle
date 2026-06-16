import React, { useState } from 'react';
import { Icons } from '../../components/Icons';
import { buildHabitMonth, TODAY, TODAY_KEY, computeStreak } from '../../lib/seed';
import type { UserData, EditingState } from '../../types';

interface WebHabitsProps {
  data: UserData;
  isPartner: boolean;
  onEdit: (e: EditingState) => void;
  onTrackDate: (id: string, dk: string) => void;
}

export function WebHabitsScreen({ data, isPartner, onEdit, onTrackDate }: WebHabitsProps) {
  const [viewYear, setViewYear] = useState(TODAY.getFullYear());
  const [viewMonth, setViewMonth] = useState(TODAY.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const trackers = data.habits;
  const y = viewYear;
  const m = viewMonth;
  const monthName = new Date(y, m, 1).toLocaleString('en-US', { month: 'long' });

  const doneToday = trackers.filter((h) => (h.completedDates ?? []).includes(TODAY_KEY)).length;

  const longest = trackers.length > 0
    ? trackers.reduce<{ name: string; streak: number }>((best, h) => {
        const s = computeStreak(h.completedDates ?? []);
        return s > best.streak ? { name: h.name, streak: s } : best;
      }, { name: '', streak: 0 })
    : null;

  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const daysSoFar = Math.min(TODAY.getDate(), daysInMonth);

  const monthlyPctTotal =
    trackers.reduce((a, h) => {
      const datesThisMonth = (h.completedDates ?? []).filter((dk) =>
        dk.startsWith(`${y}-${String(m + 1).padStart(2, '0')}-`)
      ).length;
      return a + (datesThisMonth / daysSoFar);
    }, 0) / (trackers.length || 1) * 100;

  const totalChecks = trackers.reduce((a, h) => a + (h.completedDates ?? []).length, 0);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="kicker">Tracker</div>
          <h1>Habit <em>Logs</em></h1>
        </div>
        <button className="btn-add" onClick={() => onEdit({ type: 'habit' })}>
            {Icons.plus({ size: 14, stroke: 'var(--cream)' })}
            <span>New tracker</span>
          </button>
      </div>

      {/* metric-row — temporarily hidden */}
      {/* <div className="metric-row">
        <div className="metric">
          <div className="label">Ticked today</div>
          <div className="value">
            {doneToday}<span style={{ fontSize: 18, color: 'var(--ink-mute)' }}>/{trackers.length}</span>
          </div>
          <div className="progress clay" style={{ marginTop: 10 }}>
            <div style={{ width: `${(doneToday / (trackers.length || 1)) * 100}%` }} />
          </div>
        </div>
        <div className="metric">
          <div className="label">Longest streak</div>
          <div className="value">🔥 {longest?.streak ?? 0}</div>
          <div className="delta">{longest?.name ?? '—'}</div>
        </div>
        <div className="metric">
          <div className="label">{monthName} avg</div>
          <div className="value">
            {monthlyPctTotal.toFixed(0)}<span style={{ fontSize: 18, color: 'var(--ink-mute)' }}>%</span>
          </div>
          <div className="delta">across {trackers.length} trackers</div>
        </div>
        <div className="metric">
          <div className="label">Total checks</div>
          <div className="value">{totalChecks}</div>
          <div className="delta">all time</div>
        </div>
      </div> */}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <button
          onClick={prevMonth}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', color: 'var(--ink-mute)', lineHeight: 1 }}
        >
          {Icons.chevL({ stroke: 'var(--ink-mute)' })}
        </button>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 36, letterSpacing: '-0.02em' }}>
          {monthName} <em style={{ fontStyle: 'italic', color: 'var(--clay)' }}>{y}</em>
        </div>
        <button
          onClick={nextMonth}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', color: 'var(--ink-mute)', lineHeight: 1 }}
        >
          {Icons.chevR({ stroke: 'var(--ink-mute)' })}
        </button>
      </div>

      <div className="habits-grid">
        {trackers.map((h) => {
          const completedDates = h.completedDates ?? [];
          const cells = buildHabitMonth(y, m, completedDates, h.startDate);
          const onCount = cells.filter((c) => !c.blank && c.on).length;
          const inCount = cells.filter((c) => !c.blank && !c.beforeStart).length;
          const pct = inCount ? Math.round((onCount / inCount) * 100) : 0;
          const streak = computeStreak(completedDates);

          return (
            <div key={h.id} className="habit-card">
              <div className="hc-head">
                <div
                  onClick={() => onEdit({ type: 'habit', item: h })}
                  style={{ cursor: 'pointer', flex: 1 }}
                >
                  <div className="hc-name">{h.name}</div>
                  <div className="hc-note">
                    {h.note}
                    {!h.repeating && <span style={{ marginLeft: 6, color: 'var(--ink-faint)' }}>· once</span>}
                  </div>
                </div>
                {streak > 0 && <div className="hc-streak">🔥 {streak}</div>}
              </div>
              <div className="mini-month">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="dow">{d}</div>
                ))}
                {cells.map((c) => {
                  if (c.blank) return <div key={c.key} />;
                  const cls: string[] = ['mc'];
                  if (c.beforeStart) {
                    cls.push('before-start');
                  } else {
                    cls.push('in');
                  }
                  if (c.streak) cls.push('streak');
                  else if (c.on) cls.push('on');
                  if (c.start) cls.push('habit-start');
                  if (c.today) cls.push('today');
                  const canToggle = !c.beforeStart && !!c.dateKey;
                  return (
                    <div
                      key={c.key}
                      className={cls.join(' ')}
                      style={{ cursor: canToggle ? 'pointer' : 'default' }}
                      onClick={() => canToggle && onTrackDate(h.id, c.dateKey!)}
                      title={canToggle ? (c.on ? 'Untick' : 'Tick') : undefined}
                    >
                      {c.d}
                    </div>
                  );
                })}
              </div>
              <div className="habit-foot">
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-mute)', textTransform: 'uppercase' }}>
                  {onCount}/{inCount} · {pct}% this month
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
