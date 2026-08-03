import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormSheet, FormHead, FormFoot } from '../forms/FormPrimitives';
import { Icons } from '../Icons';
import type { Habit, HabitCategory, UserData } from '../../types';

export function HabitManager({ data, onClose, onSaveHabit, onSaveCategory, onDeleteHabit, onDeleteCategory, onReorderHabits }: {
  data: UserData;
  onClose: () => void;
  onSaveHabit: (habit: Habit) => void;
  onSaveCategory: (category: HabitCategory) => void;
  onDeleteHabit: (id: string) => void;
  onDeleteCategory: (id: string) => void;
  onReorderHabits: (habits: Habit[]) => void;
}) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'tracker' | 'category'; id: string; name: string } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const categories = useMemo(() => [...(data.habitCategories ?? [])].filter((category) => !category.deleted).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)), [data.habitCategories]);
  const categoryIds = useMemo(() => new Set(categories.map((category) => category.id)), [categories]);
  const groups = [...categories.map((category) => ({ id: category.id, name: category.name })), { id: 'uncategorized', name: 'Uncategorized' }];
  const habits = data.habits.filter((habit) => !habit.archived);
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const overHabit = habits.find((habit) => habit.id === over.id);
    const activeCategory = groups.find((group) => `category:${group.id}` === active.id);
    if (activeCategory) {
      const overCategory = groups.find((group) => `category:${group.id}` === over.id || group.id === overHabit?.categoryId);
      if (!overCategory || activeCategory.id === overCategory.id) return;
      const oldIndex = groups.findIndex((group) => group.id === activeCategory.id);
      const newIndex = groups.findIndex((group) => group.id === overCategory.id);
      const reordered = arrayMove(groups, oldIndex, newIndex);
      reordered.forEach((group, sort_order) => {
        if (group.id !== 'uncategorized') onSaveCategory({ ...categories.find((category) => category.id === group.id)!, sort_order });
      });
      return;
    }
    const activeHabit = habits.find((habit) => habit.id === active.id);
    if (!activeHabit) return;
    const destinationId = overHabit?.categoryId ?? (groups.some((group) => `category:${group.id}` === over.id) ? String(over).replace('category:', '') : activeHabit.categoryId);
    const moved = habits.map((habit) => habit.id === activeHabit.id ? { ...habit, categoryId: destinationId === 'uncategorized' ? undefined : destinationId } : habit);
    const oldIndex = moved.findIndex((habit) => habit.id === activeHabit.id);
    const newIndex = overHabit ? moved.findIndex((habit) => habit.id === overHabit.id) : oldIndex;
    onReorderHabits(arrayMove(moved, oldIndex, newIndex));
  };
  return createPortal(<FormSheet onClose={onClose} className="habit-manager-sheet">
      <FormHead kicker="Edit trackers" title="Manage" accent="trackers" onClose={onClose} />
      <div className="form-body habit-manager-body">
      <p className="habit-manager-help">Edit names below, then drag trackers to rearrange or regroup them.</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="habit-manager-groups">
          {groups.map((group) => {
            const groupHabits = habits.filter((habit) => group.id === 'uncategorized' ? !habit.categoryId || !categoryIds.has(habit.categoryId) : habit.categoryId === group.id);
            const category = categories.find((item) => item.id === group.id);
            const toggleEdit = () => {
              if (editingCategory === group.id) {
                const draft = categoryDrafts[group.id]?.trim();
                if (category && draft) onSaveCategory({ ...category, name: draft });
                setEditingCategory(null);
              } else {
                setCategoryDrafts((current) => ({ ...current, [group.id]: category?.name ?? group.name }));
                setEditingCategory(group.id);
              }
            };
            return <SortableHabitGroup key={group.id} id={group.id} name={group.name} category={category} categoryDraft={categoryDrafts[group.id]} habits={groupHabits} editing={editingCategory === group.id} onToggleEdit={toggleEdit} onChangeCategoryDraft={(name) => setCategoryDrafts((current) => ({ ...current, [group.id]: name }))} onRequestDelete={(type, id, name) => setDeleteTarget({ type, id, name })} onSaveHabit={onSaveHabit} />;
          })}
        </div>
      </DndContext>
      </div>
      <FormFoot onSave={onClose} onCancel={onClose} saveLabel="Done" />
      {deleteTarget && createPortal((
        <>
          <div className="sheet-backdrop habit-delete-confirm-backdrop" style={{ zIndex: 10000, pointerEvents: 'auto' }} onClick={() => setDeleteTarget(null)} />
          <div className="form-sheet habit-delete-confirm-sheet" style={{ zIndex: 10001, pointerEvents: 'auto' }}>
          <FormHead kicker="Confirm deletion" title="Delete this" accent={deleteTarget.type} onClose={() => setDeleteTarget(null)} />
          <div className="form-body">
            <p className="habit-delete-confirm-copy">Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This cannot be undone.</p>
          </div>
          <FormFoot
            onCancel={() => setDeleteTarget(null)}
            onSave={() => { if (deleteTarget.type === 'tracker') onDeleteHabit(deleteTarget.id); else onDeleteCategory(deleteTarget.id); setDeleteTarget(null); }}
            saveLabel="Delete"
          />
          </div>
        </>
      ), document.body)}
  </FormSheet>, document.body);
}

function SortableHabitGroup({ id, name, category, categoryDraft, habits, editing, onToggleEdit, onChangeCategoryDraft, onRequestDelete, onSaveHabit }: { id: string; name: string; category?: HabitCategory; categoryDraft?: string; habits: Habit[]; editing: boolean; onToggleEdit: () => void; onChangeCategoryDraft: (name: string) => void; onRequestDelete: (type: 'tracker' | 'category', id: string, name: string) => void; onSaveHabit: (habit: Habit) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `category:${id}` });
  return <section ref={setNodeRef} className={`habit-manager-group${isDragging ? ' dragging' : ''}`} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes}>
    <div className="habit-manager-group-title" {...listeners}>
      <span className="habit-manager-drag-handle">⠿</span>
      {editing && category ? <input value={categoryDraft ?? category.name} onChange={(event) => onChangeCategoryDraft(event.target.value)} onPointerDown={(event) => event.stopPropagation()} aria-label={`Edit ${name} category name`} /> : <span>{name}</span>}
      <button type="button" className="habit-manager-edit-category" onClick={(event) => { event.stopPropagation(); onToggleEdit(); }} aria-label={`${editing ? 'Confirm' : 'Edit'} ${name} category`}>{editing ? Icons.check({ size: 13, stroke: 'currentColor' }) : Icons.pencil({ size: 12 })}</button>
      {editing && category && <button type="button" className="habit-manager-delete" onClick={(event) => { event.stopPropagation(); onRequestDelete('category', category.id, category.name); }} aria-label={`Delete ${name} category`}>{Icons.trash({ size: 12 })}</button>}
    </div>
    <SortableContext items={habits.map((habit) => habit.id)} strategy={rectSortingStrategy}>
      {habits.map((habit) => <SortableManagerHabit key={habit.id} habit={habit} editing={editing} onSave={onSaveHabit} onRequestDelete={onRequestDelete} />)}
    </SortableContext>
  </section>;
}

function SortableManagerHabit({ habit, editing, onSave, onRequestDelete }: { habit: Habit; editing: boolean; onSave: (habit: Habit) => void; onRequestDelete: (type: 'tracker' | 'category', id: string, name: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: habit.id });
  return <div ref={setNodeRef} className={`habit-manager-item${isDragging ? ' dragging' : ''}`} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners}>
    {Icons.dragHandle({ size: 14, stroke: 'var(--ink-mute)' })}
    {editing ? <input value={habit.name} onChange={(event) => onSave({ ...habit, name: event.target.value })} aria-label={`Edit ${habit.name} tracker name`} onPointerDown={(event) => event.stopPropagation()} /> : <span className="habit-manager-item-name">{habit.name}</span>}
    {editing && <button type="button" className="habit-manager-delete" onClick={(event) => { event.stopPropagation(); onRequestDelete('tracker', habit.id, habit.name); }} aria-label={`Delete ${habit.name} tracker`}>{Icons.trash({ size: 12 })}</button>}
  </div>;
}
