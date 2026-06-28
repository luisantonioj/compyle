import React, { useState } from 'react';
import { Icons } from '../Icons';
import { TODAY_KEY, dateKey } from '../../lib/seed';
import { isHabitGuideDate } from '../../features/habits/habitSchedule';
import { Sheet } from './Sheet';
import type { Habit } from '../../types';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = Array.from({ length: 12 }, (_, month) =>
  new Date(2000, month, 1).toLocaleString('en-US', { month: 'long' }),
);

export function DayChecklist({ habit, completedDates, onToggle, disabled }: {
  habit: Habit;
  completedDates: string[];
  onToggle: (dk: string) => void;
  disabled?: boolean;
}) {
  const today = new Date();
  const [anchorDate, setAnchorDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate()),
  );
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(anchorDate.getMonth());
  const [pickerYear, setPickerYear] = useState(anchorDate.getFullYear());
  const firstDate = new Date(
    anchorDate.getFullYear(),
    anchorDate.getMonth(),
    anchorDate.getDate() - anchorDate.getDay(),
  );
  const lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate() + 6);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate() + i);
    const dk = dateKey(d);
    return { dk, dayLetter: DAY_LETTERS[d.getDay()], dayNum: d.getDate(), isToday: dk === TODAY_KEY };
  });

  const shortMon = (d: Date) => d.toLocaleString('en-US', { month: 'short' });
  const rangeLabel = firstDate.getMonth() === lastDate.getMonth()
    ? `${shortMon(lastDate)} ${firstDate.getDate()} - ${lastDate.getDate()}`
    : `${shortMon(firstDate)} ${firstDate.getDate()} - ${shortMon(lastDate)} ${lastDate.getDate()}`;

  const navBtn: React.CSSProperties = {
    background: 'none', border: 'none', padding: '0 4px',
    cursor: 'pointer', lineHeight: 1, color: 'var(--ink-mute)',
  };

  const moveWeek = (offset: -7 | 7) => {
    setAnchorDate((current) =>
      new Date(current.getFullYear(), current.getMonth(), current.getDate() + offset),
    );
  };

  const openPeriodPicker = () => {
    setPickerMonth(anchorDate.getMonth());
    setPickerYear(anchorDate.getFullYear());
    setShowPeriodPicker(true);
  };

  const jumpToPeriod = () => {
    setAnchorDate(new Date(pickerYear, pickerMonth, 1));
    setShowPeriodPicker(false);
  };

  const pickerYears = Array.from({ length: 21 }, (_, i) => pickerYear - 10 + i);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <button
          style={navBtn}
          onClick={() => moveWeek(-7)}
          aria-label="Previous week"
        >
          {Icons.chevL({ stroke: 'var(--ink-mute)' })}
        </button>
        <button
          type="button"
          className="day-period-trigger"
          onClick={openPeriodPicker}
          aria-label={`Choose calendar period, currently ${rangeLabel}`}
        >
          {rangeLabel}
        </button>
        <button
          style={navBtn}
          onClick={() => moveWeek(7)}
          aria-label="Next week"
        >
          {Icons.chevR({ stroke: 'var(--ink-mute)' })}
        </button>
      </div>
      <div className="day-check-row">
        {days.map(({ dk, dayLetter, dayNum, isToday }) => {
          const checked = completedDates.includes(dk);
          const guided = !checked && isHabitGuideDate(habit, dk);
          return (
            <button
              key={dk}
              className={`day-tile${checked ? ' checked' : ''}${guided ? ' schedule-guide' : ''}${isToday ? ' today' : ''}`}
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
      {showPeriodPicker && (
        <Sheet onClose={() => setShowPeriodPicker(false)}>
          <div className="period-sheet-head">
            <div>
              <div className="kicker">Calendar</div>
              <div className="period-sheet-title">Jump to a period</div>
            </div>
            <button
              type="button"
              className="period-sheet-close"
              onClick={() => setShowPeriodPicker(false)}
              aria-label="Close calendar period picker"
            >
              ×
            </button>
          </div>
          <div className="period-fields">
            <label>
              <span>Month</span>
              <select
                value={pickerMonth}
                onChange={(event) => setPickerMonth(Number(event.target.value))}
                aria-label="Calendar month"
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={index}>{month}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Year</span>
              <select
                value={pickerYear}
                onChange={(event) => setPickerYear(Number(event.target.value))}
                aria-label="Calendar year"
              >
                {pickerYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
          </div>
          <button type="button" className="period-sheet-apply" onClick={jumpToPeriod}>
            Show period
          </button>
        </Sheet>
      )}
    </div>
  );
}
