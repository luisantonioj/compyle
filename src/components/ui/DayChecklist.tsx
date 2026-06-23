import React, { useState } from 'react';
import { Icons } from '../Icons';
import { TODAY_KEY, dateKey } from '../../lib/seed';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function DayChecklist({ completedDates, onToggle, disabled }: {
  completedDates: string[];
  onToggle: (dk: string) => void;
  disabled?: boolean;
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const today = new Date();
  const baseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + weekOffset * 7);
  const firstDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - 6);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - 6 + i);
    const dk = dateKey(d);
    return { dk, dayLetter: DAY_LETTERS[d.getDay()], dayNum: d.getDate(), isToday: dk === TODAY_KEY };
  });

  const shortMon = (d: Date) => d.toLocaleString('en-US', { month: 'short' });
  const rangeLabel = firstDate.getMonth() === baseDate.getMonth()
    ? `${shortMon(baseDate)} ${firstDate.getDate()} - ${baseDate.getDate()}`
    : `${shortMon(firstDate)} ${firstDate.getDate()} - ${shortMon(baseDate)} ${baseDate.getDate()}`;

  const navBtn: React.CSSProperties = {
    background: 'none', border: 'none', padding: '0 4px',
    cursor: 'pointer', lineHeight: 1, color: 'var(--ink-mute)',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <button style={navBtn} onClick={() => setWeekOffset(o => o - 1)}>
          {Icons.chevL({ stroke: 'var(--ink-mute)' })}
        </button>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>
          {rangeLabel}
        </span>
        <button style={navBtn} onClick={() => setWeekOffset(o => o + 1)}>
          {Icons.chevR({ stroke: 'var(--ink-mute)' })}
        </button>
      </div>
      <div className="day-check-row">
        {days.map(({ dk, dayLetter, dayNum, isToday }) => {
          const checked = completedDates.includes(dk);
          return (
            <button
              key={dk}
              className={`day-tile${checked ? ' checked' : ''}${isToday ? ' today' : ''}`}
              disabled={disabled}
              onClick={() => !disabled && onToggle(dk)}
              title={dk}
            >
              <span className="dt-letter">{dayLetter}</span>
              <span className="dt-num">{dayNum}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
