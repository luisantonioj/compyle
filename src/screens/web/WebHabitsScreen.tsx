import React from 'react';
import { Icons } from '../../components/Icons';
import { buildHabitMonth, TODAY } from '../../lib/seed';
import type { UserData, EditingState } from '../../types';

interface WebHabitsProps {
  data: UserData;
  isPartner: boolean;
  onEdit: (e: EditingState) => void;
  onCheckHabit: (id: string) => void;
}

export function WebHabitsScreen({ data, isPartner, onEdit, onCheckHabit }: WebHabitsProps) {
  const habits = data.habits;
  const y = TODAY.getFullYear();
  const m = TODAY.getMonth();
  const monthName = TODAY.toLocaleString('en-US', { month: 'long' });

  const completedToday = habits.filter((h) => h.doneToday).length;
  const longest = habits.length > 0 ? habits.reduce((a, h) => (h.streak > a.streak ? h : a), habits[0]) : null;

  const monthlyPctTotal =
    (habits.reduce((a, h) => {
      const cells = buildHabitMonth(y, m, h.pattern, h.startDate);
      const onCount = cells.filter((c) => !c.blank && c.on).length;
      const inCount = cells.filter((c) => !c.blank && c.in).length;
      return a + (inCount ? onCount / inCount : 0);
    }, 0) /
      (habits.length || 1)) *
    100;

  const totalChecks = habits.reduce(
    (a, h) => a + h.pattern.split(',').filter((s) => s === 'on').length,
    0
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="kicker">Habit tracker</div>
          <h1>Tiny <em>rituals</em></h1>
        </div>
        {!isPartner && (
          <button className="btn-add" onClick={() => onEdit({ type: 'habit' })}>
            {Icons.plus({ size: 14, stroke: 'var(--cream)' })}
            <span>New habit</span>
          </button>
        )}
      </div>

      <div className="metric-row">
        <div className="metric">
          <div className="label">Done today</div>
          <div className="value">
            {completedToday}<span style={{ fontSize: 18, color: 'var(--ink-mute)' }}>/{habits.length}</span>
          </div>
          <div className="progress clay" style={{ marginTop: 10 }}>
            <div style={{ width: `${(completedToday / (habits.length || 1)) * 100}%` }} />
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
          <div className="delta">across {habits.length} habits</div>
        </div>
        <div className="metric">
          <div className="label">Total checks</div>
          <div className="value">{totalChecks}</div>
          <div className="delta">last 28 days</div>
        </div>
      </div>

      <div style={{ fontFamily: 'var(--serif)', fontSize: 36, letterSpacing: '-0.02em', marginBottom: 16 }}>
        {monthName} <em style={{ fontStyle: 'italic', color: 'var(--clay)' }}>{y}</em>
      </div>

      <div className="habits-grid">
        {habits.map((h) => {
          const cells = buildHabitMonth(y, m, h.pattern, h.startDate);
          const onCount = cells.filter((c) => !c.blank && c.on).length;
          const inCount = cells.filter((c) => !c.blank && c.in).length;
          const pct = inCount ? Math.round((onCount / inCount) * 100) : 0;
          return (
            <div key={h.id} className="habit-card">
              <div className="hc-head">
                <div
                  onClick={() => !isPartner && onEdit({ type: 'habit', item: h })}
                  style={{ cursor: isPartner ? 'default' : 'pointer', flex: 1 }}
                >
                  <div className="hc-name">{h.name}</div>
                  <div className="hc-note">{h.note}</div>
                </div>
                <div className="hc-streak">🔥 {h.streak}</div>
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
                  } else if (c.in) {
                    cls.push('in');
                  }
                  if (c.streak) cls.push('streak');
                  else if (c.on) cls.push('on');
                  if (c.start) cls.push('habit-start');
                  if (c.today) cls.push('today');
                  return <div key={c.key} className={cls.join(' ')}>{c.d}</div>;
                })}
              </div>
              <div className="habit-foot">
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-mute)', textTransform: 'uppercase' }}>
                  {onCount}/{inCount} · {pct}% this month
                </div>
                {!isPartner && (
                  <button
                    className={`habit-toggle${h.doneToday ? ' done' : ''}`}
                    onClick={() => onCheckHabit(h.id)}
                  >
                    {h.doneToday ? '✓ Done' : 'Mark done'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
