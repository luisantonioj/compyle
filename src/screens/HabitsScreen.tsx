// compyle — Track screen (mobile)
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Icons } from '../components/Icons';

import { DayChecklist } from '../components/ui/shared';
import { HabitManager } from '../components/ui/HabitManager';
import { TODAY_KEY, dateKey } from '../lib/seed';
import { isHabitGuideDate } from '../features/habits/habitSchedule';
// Streak calculations are temporarily disabled. Restore with the summary UI below if needed.
// import { computeStreak } from '../lib/seed';
import type { UserData, ViewMode, Habit, HabitCategory, EditingState } from '../types';

interface HabitsProps {
  data: UserData;
  viewMode: ViewMode;
  isPartner: boolean;
  profileInitial: string;
  onProfile: () => void;
  onTrackDate: (id: string, dk: string) => void;
  onEdit: (e: EditingState) => void;
  onReorderHabits?: (habits: Habit[]) => void;
  onSaveCategory?: (category: HabitCategory) => void;
  onSaveHabit?: (habit: Habit) => void;
  onDeleteHabit?: (id: string) => void;
  onDeleteCategory?: (id: string) => void;
}

function trackerSummary(habit: Habit): string {
  const today = new Date();
  for (let offset = 0; offset <= 60; offset++) {
    const candidate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    const key = dateKey(candidate);
    if (!(habit.completedDates ?? []).includes(key) && isHabitGuideDate(habit, key)) {
      if (offset === 0) return 'Scheduled today';
      if (offset === 1) return 'Next tomorrow';
      return `Next ${candidate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
  }

  const monthPrefix = TODAY_KEY.slice(0, 7);
  const checks = (habit.completedDates ?? []).filter((key) => key.startsWith(monthPrefix)).length;
  return `${checks} ${checks === 1 ? 'check' : 'checks'} this month`;
}

export function HabitsScreen({
  data,
  viewMode,
  isPartner,
  profileInitial,
  onProfile,
  onTrackDate,
  onEdit,
  onReorderHabits,
  onSaveCategory,
  onSaveHabit,
  onDeleteHabit,
  onDeleteCategory,
}: HabitsProps) {
  const trackers = data.habits.filter((h) => !h.archived);
  const archivedTrackers = data.habits.filter((h) => h.archived);
  const [showArchived, setShowArchived] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const categoryById = new Map((data.habitCategories ?? []).filter((category) => !category.deleted).map((category) => [category.id, category]));
  const categoryGroups = [
    ...[...(data.habitCategories ?? [])].filter((category) => !category.deleted).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((category) => ({
      id: category.id,
      name: category.name,
      trackers: trackers.filter((habit) => habit.categoryId === category.id),
    })),
    {
      id: 'uncategorized',
      name: 'Uncategorized',
      trackers: trackers.filter((habit) => !habit.categoryId || !categoryById.has(habit.categoryId)),
    },
  ].filter((group) => group.trackers.length > 0);
  const visibleTrackerIds = categoryGroups.flatMap((group) => group.trackers.map((habit) => habit.id));
  const visibleTrackerSignature = visibleTrackerIds.join('|');
  const [expandedOrder, setExpandedOrder] = useState<string[]>(() => trackers.slice(0, 2).map((habit) => habit.id));
  const expandedOrderRef = useRef(expandedOrder);
  const screenRef = useRef<HTMLDivElement>(null);
  const scrollDirectionRef = useRef<'up' | 'down'>('down');
  const bottomRevealRef = useRef<string | null>(null);
  const doneToday = trackers.filter((h) => h.completedDates?.includes(TODAY_KEY)).length;
  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || !onReorderHabits) return;
    const oldIndex = data.habits.findIndex((habit) => habit.id === active.id);
    const newIndex = data.habits.findIndex((habit) => habit.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const destinationGroup = over.data.current?.categoryId as string | undefined;
    const movedHabits = data.habits.map((habit) => (
      habit.id === active.id && destinationGroup
        ? { ...habit, categoryId: destinationGroup === 'uncategorized' ? undefined : destinationGroup }
        : habit
    ));
    onReorderHabits(arrayMove(movedHabits, oldIndex, newIndex));
  };

  const expandTracker = useCallback((habitId: string) => {
    setExpandedOrder((current) => {
      const promoted = current.filter((id) => id !== habitId);
      return [...promoted, habitId].slice(-2);
    });
  }, []);

  useEffect(() => {
    expandedOrderRef.current = expandedOrder;
  }, [expandedOrder]);

  useEffect(() => {
    setExpandedOrder((current) => {
      const visible = new Set(visibleTrackerIds);
      const next = current.filter((id) => visible.has(id));
      for (const id of visibleTrackerIds) {
        if (next.length >= 2) break;
        if (!next.includes(id)) next.push(id);
      }
      return next;
    });
  // The signature changes only when the ordered visible tracker IDs change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleTrackerSignature]);

  useEffect(() => {
    const root = screenRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const habitId = (entry.target as HTMLElement).dataset.habitId;
        if (habitId) expandTracker(habitId);
      });
    }, {
      root,
      rootMargin: '-15% 0px -55% 0px',
      threshold: 0,
    });

    root.querySelectorAll<HTMLElement>('.mobile-habit-activation').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [expandTracker, visibleTrackerSignature]);

  useEffect(() => {
    const root = screenRef.current;
    if (!root) return;
    let previousScrollTop = root.scrollTop;
    let revealTimer: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = () => {
      const currentScrollTop = root.scrollTop;
      if (currentScrollTop < previousScrollTop - 2) scrollDirectionRef.current = 'up';
      else if (currentScrollTop > previousScrollTop + 2) scrollDirectionRef.current = 'down';
      previousScrollTop = currentScrollTop;

      const nearBottom = currentScrollTop + root.clientHeight >= root.scrollHeight - 28;
      const lastHabitId = visibleTrackerIds[visibleTrackerIds.length - 1];

      if (nearBottom && lastHabitId) {
        if (!expandedOrderRef.current.includes(lastHabitId)) expandTracker(lastHabitId);
        if (bottomRevealRef.current !== lastHabitId) {
          bottomRevealRef.current = lastHabitId;
          if (revealTimer) clearTimeout(revealTimer);
          revealTimer = setTimeout(() => {
            const finalCard = root.querySelector<HTMLElement>(`[data-habit-card-id="${lastHabitId}"]`);
            finalCard?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
          }, 360);
        }
        return;
      }

      if (!nearBottom) bottomRevealRef.current = null;
      if (scrollDirectionRef.current !== 'up') return;

      const rootRect = root.getBoundingClientRect();
      const activeTop = rootRect.top + root.clientHeight * 0.12;
      const activeBottom = rootRect.top + root.clientHeight * 0.58;
      const collapsedCards = Array.from(root.querySelectorAll<HTMLElement>('.mobile-habit-card.is-collapsed'));
      const candidate = collapsedCards
        .map((card) => ({ card, distance: Math.abs(card.getBoundingClientRect().top - activeTop) }))
        .filter(({ card }) => {
          const top = card.getBoundingClientRect().top;
          return top >= activeTop && top <= activeBottom;
        })
        .sort((a, b) => a.distance - b.distance)[0]?.card;
      const habitId = candidate?.dataset.habitCardId;
      if (habitId) expandTracker(habitId);
    };

    root.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      root.removeEventListener('scroll', handleScroll);
      if (revealTimer) clearTimeout(revealTimer);
    };
  // The signature tracks the ordered cards currently rendered by the category filter.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandTracker, visibleTrackerSignature]);

  /*
  // Streak summary is temporarily disabled. Retained for future reuse.
  const longestStreak = trackers.length > 0
    ? trackers.reduce<{ name: string; streak: number }>((best, h) => {
        const s = computeStreak(h.completedDates ?? []);
        return s > best.streak ? { name: h.name, streak: s } : best;
      }, { name: '', streak: 0 })
    : null;
  */

  return (
    <div className="screen track-mobile-screen" ref={screenRef}>
      <div className="top-bar">
        <div>
          <div className="kicker">Tracker</div>
          <h1>Habit <em>Logs</em></h1>
        </div>
        <div className="mobile-top-actions">
          <button className="icon-btn" type="button" onClick={() => setManagerOpen(true)} aria-label="Edit trackers">
            {Icons.pencil({ size: 20, stroke: 'var(--ink)' })}
          </button>
          <button className={`profile-pill${viewMode === 'partner' ? ' partner' : ''}`} onClick={onProfile}>
            {profileInitial}
            <span className="dot" />
          </button>
        </div>
      </div>

      {/* summary card — temporarily hidden */}
      {/* <div className="pad-x">
        <div className="card" style={{ padding: '18px 20px', background: 'var(--ink)', color: 'var(--cream)' }}>
          <div className="label" style={{ color: 'rgba(244,239,228,0.6)' }}>Today's progress</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
            <div>
              <div className="amount" style={{ fontSize: 48, lineHeight: 0.9, color: 'var(--cream)' }}>
                {doneToday}
                <span style={{ fontSize: 22, color: 'rgba(244,239,228,0.6)' }}>/{trackers.length}</span>
              </div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(244,239,228,0.5)', marginTop: 6 }}>
                ticked today
              </div>
            </div>
            {longestStreak && longestStreak.streak > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 18 }}>🔥</span>
                  <div className="amount" style={{ fontSize: 32, color: 'var(--cream)' }}>{longestStreak.streak}</div>
                </div>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(244,239,228,0.5)', marginTop: 2 }}>
                  {longestStreak.name.split(' ')[0]} streak
                </div>
              </div>
            )}
          </div>
        </div>
      </div> */}

      {/* tracker list */}
      <div className="pad-x mobile-track-content">
        {trackers.length === 0 ? (
          <div className="card white" style={{ padding: '28px 18px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 16 }}>
              No trackers yet. Add one to start.
            </div>
          </div>
        ) : (
          <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="mobile-habit-groups">
              {categoryGroups.map((group) => (
                <section className="mobile-habit-group" key={group.id}>
                  <div className="mobile-habit-category">{group.name}</div>
                  <div className="mobile-habit-card-list">
                    <SortableContext items={group.trackers.map((habit) => habit.id)} strategy={verticalListSortingStrategy}>
                    {group.trackers.map((h: Habit) => {
                      const expanded = expandedOrder.includes(h.id);
                      return (
                      <SortableMobileHabitCard
                        key={h.id}
                        habitId={h.id}
                        categoryId={group.id}
                        expanded={expanded}
                        disabled={!onReorderHabits}
                      >
                        <span className="mobile-habit-activation" data-habit-id={h.id} aria-hidden="true" />
                        <div className="mobile-habit-calendar-shell" aria-hidden={!expanded}>
                          <DayChecklist
                            habit={h}
                            title={h.name}
                            onTitleClick={() => onEdit({ type: 'habit', item: h })}
                            completedDates={h.completedDates ?? []}
                            onToggle={(dk) => onTrackDate(h.id, dk)}
                            disabled={!expanded}
                          />
                        </div>
                        <button
                          type="button"
                          className="mobile-habit-summary"
                          onClick={() => expandTracker(h.id)}
                          aria-expanded={expanded}
                          aria-label={`Expand ${h.name} calendar`}
                        >
                          <span className="mobile-habit-summary-copy">
                            <strong>{h.name}</strong>
                            <small>{group.name} · {trackerSummary(h)}</small>
                          </span>
                          <span className="mobile-habit-summary-action">Calendar ›</span>
                        </button>
                      </SortableMobileHabitCard>
                      );
                    })}
                    </SortableContext>
                  </div>
                </section>
              ))}
            </div>
            </DndContext>
          </>
        )}
      </div>

      {archivedTrackers.length > 0 && (
        <div className="pad-x" style={{ marginTop: 8 }}>
          <button
            onClick={() => setShowArchived((v) => !v)}
            style={{
              width: '100%', padding: '10px', borderRadius: 12,
              border: '1px dashed var(--hair-strong)', background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              color: 'var(--ink-mute)', fontFamily: 'var(--mono)', fontSize: 10,
              letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
            }}
          >
            {showArchived ? '↑ Hide archived' : <>{Icons.archive({ stroke: 'currentColor' })} {archivedTrackers.length} archived</>}
          </button>
          {showArchived && (
            <div className="card white" style={{ padding: '4px 18px', marginTop: 8, opacity: 0.6 }}>
              {archivedTrackers.map((h: Habit) => (
                <div key={h.id} className="habit-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div
                      style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                      onClick={() => onEdit({ type: 'habit', item: h })}
                    >
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <div style={{ fontSize: 16, color: 'var(--ink)' }}>{h.name}</div>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          archived
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ height: 40 }} />
      {managerOpen && <HabitManager data={data} onClose={() => setManagerOpen(false)} onSaveHabit={onSaveHabit ?? (() => undefined)} onSaveCategory={onSaveCategory ?? (() => undefined)} onDeleteHabit={onDeleteHabit ?? (() => undefined)} onDeleteCategory={onDeleteCategory ?? (() => undefined)} onReorderHabits={onReorderHabits ?? (() => undefined)} />}
    </div>
  );
}

function SortableMobileHabitCard({
  habitId,
  categoryId,
  expanded,
  disabled,
  children,
}: {
  habitId: string;
  categoryId: string;
  expanded: boolean;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: habitId,
    data: { categoryId },
    disabled,
  });

  return (
    <article
      ref={setNodeRef}
      className={`mobile-habit-card${expanded ? ' is-expanded' : ' is-collapsed'}${isDragging ? ' dragging' : ''}`}
      data-habit-card-id={habitId}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 2 : 0,
        position: 'relative',
        touchAction: 'auto',
      }}
      {...attributes}
      {...listeners}
    >
      {children}
    </article>
  );
}
