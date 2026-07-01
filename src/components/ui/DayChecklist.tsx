import React, { useState } from 'react';
import { buildHabitMonth, TODAY_KEY } from '../../lib/seed';
import { isHabitGuideDate } from '../../features/habits/habitSchedule';
import { Sheet } from './Sheet';
import type { Habit } from '../../types';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = Array.from({ length: 12 }, (_, month) =>
  new Date(2000, month, 1).toLocaleString('en-US', { month: 'long' }),
);

export function DayChecklist({ habit, completedDates, onToggle, disabled, title, onTitleClick }: {
  habit: Habit;
  completedDates: string[];
  onToggle: (dk: string) => void;
  disabled?: boolean;
  title?: string;
  onTitleClick?: () => void;
}) {
  const today = new Date();
  const [anchorDate, setAnchorDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(anchorDate.getMonth());
  const [pickerYear, setPickerYear] = useState(anchorDate.getFullYear());
  const cells = buildHabitMonth(
    anchorDate.getFullYear(),
    anchorDate.getMonth(),
    completedDates,
    habit.startDate,
  );
  const periodLabel = anchorDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });

  const moveMonth = (offset: -1 | 1) => {
    setAnchorDate((current) =>
      new Date(current.getFullYear(), current.getMonth() + offset, 1),
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
    <div className="day-checklist">
      <div className={`mobile-tracker-card-header${title ? '' : ' navigation-only'}`}>
        {title && (
          <button type="button" className="mobile-habit-card-title" onClick={onTitleClick}>
            {title}
          </button>
        )}
        <div className="tracker-calendar-header mobile-calendar-header">
          <button
            type="button"
            className="tracker-calendar-arrow"
            onClick={() => moveMonth(-1)}
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            className="day-period-trigger"
            onClick={openPeriodPicker}
            aria-label={`Choose calendar period, currently ${periodLabel}`}
          >
            {periodLabel}
          </button>
          <button
            type="button"
            className="tracker-calendar-arrow"
            onClick={() => moveMonth(1)}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>
      <div className="mobile-month-grid">
        {DAY_LETTERS.map((letter, index) => (
          <span className="mobile-month-dow" key={`${letter}-${index}`}>{letter}</span>
        ))}
        {cells.map((cell) => {
          if (cell.blank) return <span key={cell.key} />;
          const dk = cell.dateKey!;
          const checked = completedDates.includes(dk);
          const guided = !checked && isHabitGuideDate(habit, dk);
          return (
            <button
              key={dk}
              className={`mobile-month-day${checked ? ' checked' : ''}${guided ? ' schedule-guide' : ''}${dk === TODAY_KEY ? ' today' : ''}${cell.beforeStart ? ' before-start' : ''}`}
              disabled={disabled}
              onClick={() => !disabled && onToggle(dk)}
              title={dk}
            >
              {cell.d}
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
