import React, { useState } from 'react';
import { Icons } from '../../components/Icons';
import { TODAY_KEY, TODAY, buildMonthCells, dateKey, parseKey } from '../../lib/seed';
import type { MonthCell } from '../../lib/seed';
import type { UserData, EditingState, Task } from '../../types';

type View = 'month' | 'week' | 'day';

interface WebPlanProps {
  data: UserData;
  isPartner: boolean;
  onEdit: (e: EditingState) => void;
  onCheckTask: (id: string, dateKey?: string) => void;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(d.getDate() + n);
  return r;
}

function MiniCheck({ done }: { done: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <circle cx="5" cy="5" r="4"
        stroke={done ? 'var(--moss)' : 'var(--ink-mute)'}
        strokeWidth="1.2"
        fill={done ? 'var(--moss)' : 'none'}
      />
      {done && (
        <path d="M2.8 5.1l1.4 1.4 2.4-2.4"
          stroke="white" strokeWidth="1.1"
          strokeLinecap="round" strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function DayTaskPanel({
  dk, tasks, isPartner, showHeader = true, onCheck, onEdit,
}: {
  dk: string;
  tasks: Task[];
  isPartner: boolean;
  showHeader?: boolean;
  onCheck: (id: string, dk: string) => void;
  onEdit: (e: EditingState) => void;
}) {
  const done = tasks.filter((t) => t.done).length;
  const d = parseKey(dk);
  const label = dk === TODAY_KEY
    ? 'Today'
    : d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ marginTop: 24 }}>
      {showHeader && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 24, letterSpacing: '-0.01em' }}>{label}</div>
          {tasks.length > 0 && (
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{done}/{tasks.length} done</div>
          )}
        </div>
      )}
      <div style={{
        background: 'var(--white)', borderRadius: 16,
        border: '1px solid var(--hair)',
        padding: tasks.length ? '4px 20px' : '28px 20px',
      }}>
        {tasks.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--ink-mute)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16 }}>
            Nothing planned. Quiet day.
          </div>
        )}
        {tasks.map((t) => (
          <div
            key={t.id}
            className={`task-list-item${t.done ? ' done' : ''}`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.check')) return;
              if (!isPartner) onEdit({ type: 'task', item: t, dateKey: dk });
            }}
          >
            <button
              className={`check${t.done ? ' checked' : ''}`}
              onClick={(e) => { e.stopPropagation(); if (!isPartner) onCheck(t.id, dk); }}
              disabled={isPartner}
            >
              {Icons.check()}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="title">{t.emoji && <span style={{ marginRight: 6 }}>{t.emoji}</span>}{t.title}</div>
              {t.description && <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}>{t.description}</div>}
              {t.time && <div className="time">{t.time}</div>}
            </div>
            {!isPartner && Icons.chevR({ stroke: 'var(--ink-faint)' })}
          </div>
        ))}
      </div>
      {!isPartner && (
        <button
          style={{
            marginTop: 12, display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--ink-mute)', fontFamily: 'var(--mono)', fontSize: 11,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
          onClick={() => onEdit({ type: 'task', dateKey: dk })}
        >
          + Add task
        </button>
      )}
    </div>
  );
}

interface TooltipState { task: Task; x: number; y: number }

export function WebPlanScreen({ data, isPartner, onEdit, onCheckTask }: WebPlanProps) {
  const [view, setView] = useState<View>('month');
  const [selected, setSelected] = useState(TODAY_KEY);
  const [month, setMonth] = useState(() => new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [showPastWeeks, setShowPastWeeks] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const y = month.getFullYear();
  const m = month.getMonth();
  const isCurrentMonth = y === TODAY.getFullYear() && m === TODAY.getMonth();
  const cells = buildMonthCells(y, m);
  const monthName = month.toLocaleString('en-US', { month: 'long' });

  // Group into weeks for past-week logic (month view only)
  const weeks: MonthCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const weekHasPassed = (week: MonthCell[]) => {
    const real = week.filter((c) => !c.other && c.dateKey);
    return real.length > 0 && real[real.length - 1].dateKey! < TODAY_KEY;
  };

  const pastCount = isCurrentMonth ? weeks.filter(weekHasPassed).length : 0;
  const visibleWeeks = isCurrentMonth && !showPastWeeks
    ? weeks.filter((w) => !weekHasPassed(w))
    : weeks;

  // Week view strip
  const selDate = parseKey(selected);
  const weekStart = addDays(selDate, -selDate.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const k = dateKey(d);
    return { d, k, tasks: data.tasks[k] ?? [] };
  });

  const navLabel = () => {
    if (view === 'month') return <>{monthName} <em>{y}</em></>;
    if (view === 'week') {
      const end = addDays(weekStart, 6);
      const s = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const e = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return <>{s} — <em>{e}</em></>;
    }
    return (
      <>{selDate.toLocaleDateString('en-US', { month: 'short' })} <em>{selDate.getDate()}</em></>
    );
  };

  const navPrev = () => {
    if (view === 'month') setMonth(new Date(y, m - 1, 1));
    else if (view === 'week') setSelected(dateKey(addDays(selDate, -7)));
    else setSelected(dateKey(addDays(selDate, -1)));
  };

  const navNext = () => {
    if (view === 'month') setMonth(new Date(y, m + 1, 1));
    else if (view === 'week') setSelected(dateKey(addDays(selDate, 7)));
    else setSelected(dateKey(addDays(selDate, 1)));
  };

  const switchView = (v: View) => {
    setView(v);
    if (v === 'month') {
      const d = parseKey(selected);
      setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  };

  const selTasks = data.tasks[selected] ?? [];

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="kicker">Calendar</div>
          <h1>Plan & <em>tasks</em></h1>
        </div>
        {!isPartner && (
          <button className="btn-add" onClick={() => onEdit({ type: 'task', dateKey: selected })}>
            {Icons.plus({ size: 14, stroke: 'var(--cream)' })}
            <span>New task</span>
          </button>
        )}
      </div>

      <div className="plan-bar">
        <div className="plan-nav">
          <button className="arrow" onClick={navPrev}>{Icons.chevL()}</button>
          <h2>{navLabel()}</h2>
          <button className="arrow" onClick={navNext}>{Icons.chevR()}</button>
        </div>
        {view === 'month' && pastCount > 0 && (
          <button className="past-weeks-toggle" onClick={() => setShowPastWeeks((v) => !v)}>
            {showPastWeeks
              ? `Hide ${pastCount} past week${pastCount > 1 ? 's' : ''}`
              : `Show ${pastCount} past week${pastCount > 1 ? 's' : ''}`}
          </button>
        )}
        <div className="segment" style={{ display: 'inline-flex' }}>
          {(['month', 'week', 'day'] as const).map((v) => (
            <button key={v} className={view === v ? 'active' : ''} onClick={() => switchView(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Month View ── */}
      {view === 'month' && (
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
                    <div className="mono" style={{
                      position: 'absolute', top: 10, right: 12,
                      fontSize: 9, letterSpacing: '0.1em',
                      color: pct === 0 ? 'var(--ink-mute)' : 'var(--moss)',
                    }}>
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
                      onMouseEnter={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        setTooltip({ task: t, x: r.left + r.width / 2, y: r.top });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {!isPartner && (
                        <button
                          className="mini-check"
                          onClick={(e) => { e.stopPropagation(); onCheckTask(t.id, c.dateKey); }}
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
      )}

      {/* ── Week View ── */}
      {view === 'week' && (
        <>
          <div className="web-week-strip">
            {weekDays.map(({ d, k, tasks }) => {
              const isToday = k === TODAY_KEY;
              const isSel = k === selected;
              return (
                <button
                  key={k}
                  className={`web-week-day${isToday ? ' today' : ''}${isSel && !isToday ? ' selected' : ''}`}
                  onClick={() => setSelected(k)}
                >
                  <div className="wwd-name">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className="wwd-num">{d.getDate()}</div>
                  <div className="wwd-dots">
                    {tasks.slice(0, 3).map((_, i) => <i key={i} className="wwd-dot" />)}
                  </div>
                </button>
              );
            })}
          </div>
          <DayTaskPanel
            dk={selected}
            tasks={selTasks}
            isPartner={isPartner}
            onCheck={(id, dk) => onCheckTask(id, dk)}
            onEdit={onEdit}
          />
        </>
      )}

      {/* ── Day View ── */}
      {view === 'day' && (
        <>
          <div className="plan-day-hero">
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: 10 }}>
              {selDate.toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 68, lineHeight: 0.9, letterSpacing: '-0.02em' }}>
              {selDate.toLocaleDateString('en-US', { month: 'short' })}{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--clay)' }}>{selDate.getDate()}</em>
            </div>
          </div>
          <DayTaskPanel
            dk={selected}
            tasks={selTasks}
            isPartner={isPartner}
            onCheck={(id, dk) => onCheckTask(id, dk)}
            onEdit={onEdit}
            showHeader={false}
          />
        </>
      )}

      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x,
          top: tooltip.y - 8,
          transform: 'translate(-50%, -100%)',
          background: 'var(--ink)',
          color: 'var(--cream)',
          borderRadius: 10,
          padding: '8px 12px',
          maxWidth: 240,
          zIndex: 9999,
          pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(21,19,15,0.22)',
          lineHeight: 1.4,
        }}>
          <div style={{ fontSize: 12, fontFamily: 'var(--sans)', fontWeight: 500, wordBreak: 'break-word' }}>
            {tooltip.task.title}
          </div>
          {tooltip.task.description && (
            <div style={{ fontSize: 11, fontFamily: 'var(--sans)', opacity: 0.65, marginTop: 3, wordBreak: 'break-word' }}>
              {tooltip.task.description}
            </div>
          )}
          <div style={{
            position: 'absolute',
            bottom: -5,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid var(--ink)',
          }} />
        </div>
      )}
    </div>
  );
}
