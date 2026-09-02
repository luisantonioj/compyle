// compyle — Track screen (mobile)
import React, { useState } from 'react';
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
import { TODAY_KEY } from '../lib/seed';
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
    <div className="screen track-mobile-screen">
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="mobile-habit-groups">
              {categoryGroups.map((group) => (
                <section className="mobile-habit-group" key={group.id}>
                  <div className="mobile-habit-category">{group.name}</div>
                  <div className="mobile-habit-card-list">
                    <SortableContext items={group.trackers.map((habit) => habit.id)} strategy={verticalListSortingStrategy}>
                      {group.trackers.map((h: Habit) => (
                        <SortableMobileHabitCard
                          key={h.id}
                          habitId={h.id}
                          categoryId={group.id}
                          disabled={!onReorderHabits}
                        >
                          <div className="mobile-habit-calendar-shell">
                            <DayChecklist
                              habit={h}
                              title={h.name}
                              onTitleClick={() => onEdit({ type: 'habit', item: h })}
                              completedDates={h.completedDates ?? []}
                              onToggle={(dk) => onTrackDate(h.id, dk)}
                            />
                          </div>
                        </SortableMobileHabitCard>
                      ))}
                    </SortableContext>
                  </div>
                </section>
              ))}
            </div>
          </DndContext>
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
      {managerOpen && (
        <HabitManager
          data={data}
          onClose={() => setManagerOpen(false)}
          onSaveHabit={onSaveHabit ?? (() => undefined)}
          onSaveCategory={onSaveCategory ?? (() => undefined)}
          onDeleteHabit={onDeleteHabit ?? (() => undefined)}
          onDeleteCategory={onDeleteCategory ?? (() => undefined)}
          onReorderHabits={onReorderHabits ?? (() => undefined)}
        />
      )}
    </div>
  );
}

function SortableMobileHabitCard({
  habitId,
  categoryId,
  disabled,
  children,
}: {
  habitId: string;
  categoryId: string;
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
      className={`mobile-habit-card is-expanded${isDragging ? ' dragging' : ''}`}
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
