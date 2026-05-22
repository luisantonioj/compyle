import React, { useState } from 'react';
import { Icons } from '../../components/Icons';
import { TODAY_KEY, TODAY, buildMonthCells, type MonthCell } from '../../lib/seed';
import type { UserData, EditingState } from '../../types';

interface WebPlanProps {
  data: UserData;
  isPartner: boolean;
  onEdit: (e: EditingState) => void;
  onCheckTask: (id: string, dateKey?: string) => void;
}

function MiniCheck({ done }: { done: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <circle
        cx="5" cy="5" r="4"
        stroke={done ? 'var(--moss)' : 'var(--ink-mute)'}
        strokeWidth="1.2"
        fill={done ? 'var(--moss)' : 'none'}
      />
      {done && (
        <path
          d="M2.8 5.1l1.4 1.4 2.4-2.4"
          stroke="white" strokeWidth="1.1"
          strokeLinecap="round" strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export function WebPlanScreen({ data, isPartner, onEdit, onCheckTask }: WebPlanProps) {
  const [month, setMonth] = useState(() => new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [showPastWeeks, setShowPastWeeks] = useState(false);

  const y = month.getFullYear();
  const m = month.getMonth();
  const cells = buildMonthCells(y, m);
  const monthName = month.toLocaleString('en-US', { month: 'long' });

  const weeks: MonthCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const weekHasPassed = (week: MonthCell[]) => {
    const realDays = week.filter((c) => !c.other && c.dateKey);
    if (!realDays.length) return false;
    return realDays[realDays.length - 1].dateKey! < TODAY_KEY;
  };

  const pastCount = weeks.filter(weekHasPassed).length;
  const visibleWeeks = showPastWeeks ? weeks : weeks.filter((w) => !weekHasPassed(w));

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
        {pastCount > 0 && (
          <button className="past-weeks-toggle" onClick={() => setShowPastWeeks((v) => !v)}>
            {showPastWeeks
              ? `Hide ${pastCount} past week${pastCount > 1 ? 's' : ''}`
              : `Show ${pastCount} past week${pastCount > 1 ? 's' : ''}`}
          </button>
        )}
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
        {visibleWeeks.flatMap((week) =>
          week.map((c) => {
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
                {dayTasks.map((t) => (
                  <div
                    key={t.id}
                    className={`mini-task${t.done ? ' done' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isPartner) onEdit({ type: 'task', item: t, dateKey: c.dateKey });
                    }}
                  >
                    {!isPartner && (
                      <button
                        className="mini-check"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCheckTask(t.id, c.dateKey);
                        }}
                      >
                        <MiniCheck done={t.done} />
                      </button>
                    )}
                    <span className="emoji">{t.emoji}</span>
                    <span className="ttl">{t.title}</span>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
