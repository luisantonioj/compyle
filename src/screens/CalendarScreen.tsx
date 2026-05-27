// compyle — Calendar + Habits screens
import React, { useState, useEffect } from 'react';
import { Icons } from '../components/Icons';
import { TODAY_KEY, daysInMonth, dateKey, parseKey, getTaskInstances } from '../lib/seed';
import type { TaskInstance } from '../lib/seed';
import type { UserData, ViewMode, Task, EditingState } from '../types';

interface CalProps {
  data: UserData;
  viewMode: ViewMode;
  isPartner: boolean;
  profileInitial: string;
  onProfile: () => void;
  onCheck: (id: string, dateKey: string) => void;
  onEdit: (e: EditingState) => void;
  onSelectedChange?: (dateKey: string) => void;
  defaultView?: 'month' | 'week' | 'day';
}

export function CalendarScreen({ data, viewMode, isPartner, profileInitial, onProfile, onCheck, onEdit, onSelectedChange, defaultView = 'month' }: CalProps) {
  const [view, setView] = useState<'month' | 'week' | 'day'>(defaultView);
  const [selected, setSelected] = useState(TODAY_KEY);
  const [month, setMonth] = useState(new Date());

  useEffect(() => { onSelectedChange?.(selected); }, [selected]);

  const tasksOnSelected = getTaskInstances(data.tasks, selected);
  const done = tasksOnSelected.filter((t) => t.done).length;

  function formatDay(k: string) {
    if (k === TODAY_KEY) return 'Today';
    return parseKey(k).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  return (
    <div className="screen">
      <div className="top-bar">
        <div>
          <div className="kicker">Calendar</div>
          <h1>Plan & <em>tasks</em></h1>
        </div>
        <button className={`profile-pill${viewMode === 'partner' ? ' partner' : ''}`} onClick={onProfile}>
          {profileInitial}
          <span className="dot" />
        </button>
      </div>

      <div className="pad-x" style={{ marginBottom: 14 }}>
        <div className="segment">
          {(['month', 'week', 'day'] as const).map((v) => (
            <button key={v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>{v}</button>
          ))}
        </div>
      </div>

      {view === 'month' && <MonthView month={month} setMonth={setMonth} selected={selected} setSelected={setSelected} data={data}/>}
      {view === 'week' && <WeekView selected={selected} setSelected={setSelected} data={data}/>}
      {view === 'day' && <DayView selected={selected} setSelected={setSelected}/>}

      {/* task list for selected day */}
      <div className="pad-x" style={{ marginTop: 20 }}>
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{formatDay(selected)}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{done}/{tasksOnSelected.length} done</div>
        </div>
        <div className="card white" style={{ padding: tasksOnSelected.length ? '4px 16px' : '24px 16px' }}>
          {tasksOnSelected.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--ink-mute)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16 }}>Nothing planned. Quiet day.</div>
          )}
          {tasksOnSelected.map((t: Task) => {
            const ti = t as TaskInstance;
            const editKey = ti._originKey ?? selected;
            return (
              <div key={ti._virtual ? `${t.id}-${selected}` : t.id} className={`task-item${!isPartner ? ' row-tap' : ''}`}
                onClick={(e) => {
                  if (isPartner) return;
                  if ((e.target as HTMLElement).closest('.check')) return;
                  onEdit({ type: 'task', item: t, dateKey: editKey });
                }}>
                <button className={`check${t.done ? ' checked' : ''}`} disabled={isPartner || !!ti._virtual}
                  onClick={(e) => { e.stopPropagation(); !isPartner && !ti._virtual && onCheck(t.id, editKey); }}>
                  {Icons.check()}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, color: t.done ? 'var(--ink-mute)' : 'var(--ink)', textDecoration: t.done ? 'line-through' : 'none' }}>
                    {t.emoji && <span style={{ marginRight: 6 }}>{t.emoji}</span>}{t.title}
                  </div>
                  {t.description && <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}>{t.description}</div>}
                  {t.time && <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.08em', marginTop: 3 }}>{t.time}</div>}
                  {ti._virtual && t.recurrence && (
                    <div className="mono" style={{ fontSize: 10, color: 'var(--clay)', letterSpacing: '0.08em', marginTop: 3 }}>↻ {t.recurrence}</div>
                  )}
                </div>
                {!isPartner && Icons.chevR({ stroke: 'var(--ink-faint)' })}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ height: 40 }}/>
    </div>
  );
}

function MonthView({ month, setMonth, selected, setSelected, data }: {
  month: Date; setMonth: (d: Date) => void;
  selected: string; setSelected: (k: string) => void;
  data: UserData;
}) {
  const y = month.getFullYear(), m = month.getMonth();
  const dim = daysInMonth(y, m);
  const first = new Date(y, m, 1).getDay();
  const monthName = month.toLocaleString('en-US', { month: 'long' });

  const prevDim = new Date(y, m, 0).getDate();
  const prevY = m === 0 ? y - 1 : y, prevM = m === 0 ? 11 : m - 1;
  const nextY = m === 11 ? y + 1 : y, nextM = m === 11 ? 0 : m + 1;

  type Cell = { other?: boolean; d: number; key: string; dateKey: string; tasks: Task[] };
  const cells: Cell[] = [];
  for (let i = first - 1; i >= 0; i--) {
    const day = prevDim - i;
    const dk = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({ other: true, d: day, dateKey: dk, tasks: getTaskInstances(data.tasks, dk), key: 'p' + i });
  }
  for (let d = 1; d <= dim; d++) {
    const dk = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ d, dateKey: dk, tasks: getTaskInstances(data.tasks, dk), key: 'd' + d });
  }
  let trail = 1;
  while (cells.length % 7 !== 0) {
    const dk = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(trail).padStart(2, '0')}`;
    cells.push({ other: true, d: trail++, dateKey: dk, tasks: getTaskInstances(data.tasks, dk), key: 'n' + cells.length });
  }

  return (
    <div className="pad-x">
      <div className="row-between" style={{ marginBottom: 6 }}>
        <button style={{ padding: 6 }} onClick={() => setMonth(new Date(y, m - 1, 1))}>{Icons.chevL({ stroke: 'var(--ink-soft)' })}</button>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{monthName} <em style={{ fontStyle: 'italic', color: 'var(--clay)' }}>{y}</em></div>
        <button style={{ padding: 6 }} onClick={() => setMonth(new Date(y, m + 1, 1))}>{Icons.chevR({ stroke: 'var(--ink-soft)' })}</button>
      </div>
      <div className="cal-grid">
        {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} className="cal-head">{d}</div>)}
        {cells.map((c) => {
          const isToday = c.dateKey === TODAY_KEY;
          const isSel = c.dateKey === selected;
          const handleClick = c.other
            ? () => { setSelected(c.dateKey); setMonth(new Date(parseKey(c.dateKey).getFullYear(), parseKey(c.dateKey).getMonth(), 1)); }
            : () => setSelected(c.dateKey);
          return (
            <button key={c.key}
              className={`cal-day${c.other ? ' other' : ''}${isToday ? ' today' : ''}`}
              onClick={handleClick}
              style={{ outline: isSel && !isToday ? '1.5px solid var(--clay)' : 'none', outlineOffset: -2 }}>
              {c.d}
              {c.tasks.length > 0 && (
                <div className="dots">
                  {c.tasks.slice(0, 3).map((_, i) => <i key={i} />)}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ selected, setSelected, data }: { selected: string; setSelected: (k: string) => void; data: UserData }) {
  const sel = parseKey(selected);
  const start = new Date(sel);
  start.setDate(sel.getDate() - sel.getDay());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const k = dateKey(d);
    return { d, key: k, tasks: getTaskInstances(data.tasks, k) };
  });

  return (
    <div className="pad-x">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <button style={{ padding: 6 }} onClick={() => setSelected(dateKey(new Date(parseKey(selected).setDate(parseKey(selected).getDate() - 7))))}>
          {Icons.chevL({ stroke: 'var(--ink-soft)' })}
        </button>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>
          {days[0].d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {days[6].d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
        <button style={{ padding: 6 }} onClick={() => setSelected(dateKey(new Date(parseKey(selected).setDate(parseKey(selected).getDate() + 7))))}>
          {Icons.chevR({ stroke: 'var(--ink-soft)' })}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {days.map(({ d, key, tasks }) => {
          const isToday = key === TODAY_KEY;
          const isSel = key === selected;
          return (
            <button key={key} onClick={() => setSelected(key)} style={{
              padding: '10px 4px', borderRadius: 12,
              background: isToday ? 'var(--ink)' : (isSel ? 'var(--cream-deep)' : 'transparent'),
              color: isToday ? 'var(--cream)' : 'var(--ink)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minHeight: 86,
            }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7 }}>
                {d.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{d.getDate()}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                {tasks.slice(0, 3).map((_, i) => (
                  <i key={i} style={{ width: 4, height: 4, borderRadius: 999, background: isToday ? 'var(--cream)' : 'var(--clay)' }}/>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayView({ selected, setSelected }: { selected: string; setSelected: (k: string) => void }) {
  const d = parseKey(selected);
  const prev = () => { const n = new Date(d); n.setDate(d.getDate() - 1); setSelected(dateKey(n)); };
  const next = () => { const n = new Date(d); n.setDate(d.getDate() + 1); setSelected(dateKey(n)); };

  return (
    <div className="pad-x">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 6px' }}>
        <button style={{ padding: 6 }} onClick={prev}>{Icons.chevL({ stroke: 'var(--ink-soft)' })}</button>
        <div style={{ textAlign: 'center' }}>
          <div className="label" style={{ marginBottom: 4 }}>{d.toLocaleDateString('en-US', { weekday: 'long' })}</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 56, lineHeight: 0.9 }}>
            {d.toLocaleDateString('en-US', { month: 'short' })} <em style={{ fontStyle: 'italic', color: 'var(--clay)' }}>{d.getDate()}</em>
          </div>
        </div>
        <button style={{ padding: 6 }} onClick={next}>{Icons.chevR({ stroke: 'var(--ink-soft)' })}</button>
      </div>
    </div>
  );
}
