import React, { useState } from 'react';
import { Icons } from '../../components/Icons';
import { TODAY_KEY, TODAY, buildMonthCells } from '../../lib/seed';
import type { UserData, EditingState } from '../../types';

interface WebPlanProps {
  data: UserData;
  isPartner: boolean;
  onEdit: (e: EditingState) => void;
  onCheckTask: (id: string, dateKey?: string) => void;
}

export function WebPlanScreen({ data, isPartner, onEdit }: WebPlanProps) {
  const [month, setMonth] = useState(() => new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const y = month.getFullYear();
  const m = month.getMonth();
  const cells = buildMonthCells(y, m);
  const monthName = month.toLocaleString('en-US', { month: 'long' });

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="kicker">Calendar</div>
          <h1>Plan & <em>tasks</em></h1>
        </div>
        {!isPartner && (
          <button className="btn-add" onClick={() => onEdit({ type: 'task', dateKey: TODAY_KEY })}>
            {Icons.plus({ size: 14, stroke: 'var(--cream)' })}
            <span>New task</span>
          </button>
        )}
      </div>

      <div className="plan-bar">
        <div className="plan-nav">
          <button className="arrow" onClick={() => setMonth(new Date(y, m - 1, 1))}>
            {Icons.chevL()}
          </button>
          <h2>{monthName} <em>{y}</em></h2>
          <button className="arrow" onClick={() => setMonth(new Date(y, m + 1, 1))}>
            {Icons.chevR()}
          </button>
        </div>
        <div className="segment" style={{ display: 'inline-flex' }}>
          <button className="active">Month</button>
          <button>Week</button>
          <button>Day</button>
        </div>
      </div>

      <div className="month-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="month-head">{d}</div>
        ))}
        {cells.map((c) => {
          if (c.other) {
            return (
              <div key={c.key} className="month-cell other">
                <div className="day-num">{c.d}</div>
              </div>
            );
          }
          const dayTasks = data.tasks[c.dateKey!] ?? [];
          const done = dayTasks.filter((t) => t.done).length;
          const pct = dayTasks.length ? Math.round((done / dayTasks.length) * 100) : 0;
          const isToday = c.dateKey === TODAY_KEY;
          return (
            <div
              key={c.key}
              className={`month-cell${isToday ? ' today' : ''}`}
              style={{ position: 'relative' }}
              onClick={() => !isPartner && onEdit({ type: 'task', dateKey: c.dateKey })}
            >
              <div className="day-num">{c.d}</div>
              {dayTasks.length > 0 && (
                <div
                  className="mono"
                  style={{
                    position: 'absolute', top: 10, right: 12,
                    fontSize: 9, letterSpacing: '0.1em',
                    color: pct === 0 ? 'var(--ink-mute)' : 'var(--moss)',
                  }}
                >
                  {pct}%
                </div>
              )}
              {dayTasks.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className={`mini-task${t.done ? ' done' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isPartner) onEdit({ type: 'task', item: t, dateKey: c.dateKey });
                  }}
                >
                  <span className="emoji">{t.emoji}</span>
                  <span className="ttl">{t.title}</span>
                </div>
              ))}
              {dayTasks.length > 4 && (
                <div className="mini-more">+{dayTasks.length - 4} more</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
