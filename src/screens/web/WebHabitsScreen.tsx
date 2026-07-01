import React, { useState } from 'react';
import { Icons } from '../../components/Icons';
import { buildHabitMonth, TODAY, TODAY_KEY } from '../../lib/seed';
// Streak calculations are temporarily disabled. Restore with the streak UI below if needed.
// import { computeStreak } from '../../lib/seed';
import { isHabitGuideDate } from '../../features/habits/habitSchedule';
import type { UserData, EditingState } from '../../types';

interface WebHabitsProps {
  data: UserData;
  isPartner: boolean;
  onEdit: (e: EditingState) => void;
  onTrackDate: (id: string, dk: string) => void;
}

interface HabitCalendarView {
  year: number;
  month: number;
}

const MONTHS = Array.from({ length: 12 }, (_, month) =>
  new Date(2000, month, 1).toLocaleString('en-US', { month: 'long' }),
);

export function WebHabitsScreen({ data, isPartner, onEdit, onTrackDate }: WebHabitsProps) {
  const [calendarViews, setCalendarViews] = useState<Record<string, HabitCalendarView>>({});
  const [openPeriodPicker, setOpenPeriodPicker] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const moveHabitMonth = (habitId: string, offset: -1 | 1) => {
    setCalendarViews((current) => {
      const view = current[habitId] ?? {
        year: TODAY.getFullYear(),
        month: TODAY.getMonth(),
      };
      const moved = new Date(view.year, view.month + offset, 1);
      return {
        ...current,
        [habitId]: { year: moved.getFullYear(), month: moved.getMonth() },
      };
    });
  };

  const setHabitPeriod = (habitId: string, next: Partial<HabitCalendarView>) => {
    setCalendarViews((current) => {
      const view = current[habitId] ?? {
        year: TODAY.getFullYear(),
        month: TODAY.getMonth(),
      };
      return { ...current, [habitId]: { ...view, ...next } };
    });
  };

  const trackers = data.habits.filter((habit) => !habit.archived);
  const categoryById = new Map((data.habitCategories ?? []).map((category) => [category.id, category]));
  const categoryGroups = [
    ...(data.habitCategories ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      trackers: trackers.filter((habit) => habit.categoryId === category.id),
    })),
    {
      id: 'uncategorized',
      name: 'Uncategorized',
      trackers: trackers.filter((habit) => !habit.categoryId || !categoryById.has(habit.categoryId)),
    },
  ].filter((group) => group.trackers.length > 0 && (categoryFilter === 'all' || categoryFilter === group.id));

  const doneToday = trackers.filter((h) => (h.completedDates ?? []).includes(TODAY_KEY)).length;

  /*
  // Streak summary is temporarily disabled. Retained for future reuse.
  const longest = trackers.length > 0
    ? trackers.reduce<{ name: string; streak: number }>((best, h) => {
        const s = computeStreak(h.completedDates ?? []);
        return s > best.streak ? { name: h.name, streak: s } : best;
      }, { name: '', streak: 0 })
    : null;
  */

  /*
  // These metrics are temporarily hidden with the metric row below.
  const y = TODAY.getFullYear();
  const m = TODAY.getMonth();
  const monthName = new Date(y, m, 1).toLocaleString('en-US', { month: 'long' });
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
  */

  return (
    <div className="web-habits-screen">
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

      {trackers.length > 0 && (
        <div className="habit-filter">
          <label htmlFor="web-habit-category-filter">Show</label>
          <select
            id="web-habit-category-filter"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="all">All categories</option>
            {(data.habitCategories ?? []).map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
            {trackers.some((habit) => !habit.categoryId || !categoryById.has(habit.categoryId)) && (
              <option value="uncategorized">Uncategorized</option>
            )}
          </select>
        </div>
      )}

      <div className="habit-category-groups">
        {categoryGroups.map((group) => (
          <section className="habit-category-group" key={group.id}>
            <div className="habit-category-label">{group.name}</div>
            <div className="habits-grid">
              {group.trackers.map((h) => {
          const view = calendarViews[h.id] ?? {
            year: TODAY.getFullYear(),
            month: TODAY.getMonth(),
          };
          const y = view.year;
          const m = view.month;
          const monthLabel = new Date(y, m, 1).toLocaleString('en-US', {
            month: 'short',
            year: 'numeric',
          });
          const completedDates = h.completedDates ?? [];
          const cells = buildHabitMonth(y, m, completedDates, h.startDate);
          // Streak calculation is temporarily disabled. Retained for future reuse.
          // const streak = computeStreak(completedDates);

          return (
            <div key={h.id} className="habit-card">
              <div className="hc-head">
                <div
                  onClick={() => onEdit({ type: 'habit', item: h })}
                  style={{ cursor: 'pointer', flex: 1 }}
                >
                  <div className="hc-name">{h.name}</div>
                </div>
                {/* Streak display is temporarily disabled. Retained for future reuse.
                {streak > 0 && <div className="hc-streak">🔥 {streak}</div>}
                */}
                <div className="hc-calendar-nav tracker-calendar-header" aria-label={`${h.name} calendar navigation`}>
                  <button
                    type="button"
                    className="hc-calendar-arrow tracker-calendar-arrow"
                    onClick={() => moveHabitMonth(h.id, -1)}
                    aria-label={`Previous month for ${h.name}`}
                    title={`Previous month for ${h.name}`}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="hc-calendar-month"
                    onClick={() => setOpenPeriodPicker((current) => current === h.id ? null : h.id)}
                    aria-label={`Choose month and year for ${h.name}, currently ${monthLabel}`}
                    aria-expanded={openPeriodPicker === h.id}
                  >
                    {monthLabel}
                  </button>
                  <button
                    type="button"
                    className="hc-calendar-arrow tracker-calendar-arrow"
                    onClick={() => moveHabitMonth(h.id, 1)}
                    aria-label={`Next month for ${h.name}`}
                    title={`Next month for ${h.name}`}
                  >
                    ›
                  </button>
                  {openPeriodPicker === h.id && (
                    <div className="hc-period-popover" role="dialog" aria-label={`Choose calendar period for ${h.name}`}>
                      <label>
                        <span>Month</span>
                        <select
                          value={m}
                          onChange={(event) => setHabitPeriod(h.id, { month: Number(event.target.value) })}
                          aria-label={`Month for ${h.name}`}
                        >
                          {MONTHS.map((month, index) => (
                            <option key={month} value={index}>{month}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Year</span>
                        <select
                          value={y}
                          onChange={(event) => setHabitPeriod(h.id, { year: Number(event.target.value) })}
                          aria-label={`Year for ${h.name}`}
                        >
                          {Array.from({ length: 21 }, (_, i) => y - 10 + i).map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </label>
                      <button type="button" className="hc-period-done" onClick={() => setOpenPeriodPicker(null)}>
                        Done
                      </button>
                    </div>
                  )}
                </div>
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
                  // Streak highlighting is temporarily disabled. Retained for future reuse.
                  // if (c.streak) cls.push('streak');
                  if (c.on) cls.push('on');
                  if (!c.on && c.dateKey && isHabitGuideDate(h, c.dateKey)) cls.push('schedule-guide');
                  if (c.start) cls.push('habit-start');
                  if (c.today) cls.push('today');
                  const canToggle = !!c.dateKey;
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
            </div>
          );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
