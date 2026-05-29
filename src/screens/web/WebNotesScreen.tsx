// compyle — Notes tab (web / desktop)
import React from 'react';
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragOverlay,
  defaultDropAnimationSideEffects,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, rectSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { Icons } from '../../components/Icons';
import type { UserData, EditingState, Note } from '../../types';
import { relativeDate } from '../../lib/noteUtils';
import '../../styles/notes.css';

const GripIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="4.5" cy="3.5"  r="1.2" fill="currentColor"/>
    <circle cx="9.5" cy="3.5"  r="1.2" fill="currentColor"/>
    <circle cx="4.5" cy="7"    r="1.2" fill="currentColor"/>
    <circle cx="9.5" cy="7"    r="1.2" fill="currentColor"/>
    <circle cx="4.5" cy="10.5" r="1.2" fill="currentColor"/>
    <circle cx="9.5" cy="10.5" r="1.2" fill="currentColor"/>
  </svg>
);

// ── Tiptap content rendering ──────────────────────────────────────────────────

interface TNode {
  type?: string;
  text?: string;
  content?: TNode[];
  attrs?: Record<string, unknown>;
  marks?: { type: string }[];
}

function toggleTaskItem(contentJson: string, targetIdx: number, checked: boolean): string {
  const doc = JSON.parse(contentJson) as TNode;
  let counter = 0;
  const visit = (node: TNode): TNode => {
    if (node.type === 'taskItem') {
      if (counter++ === targetIdx) return { ...node, attrs: { ...node.attrs, checked } };
    }
    if (node.content) return { ...node, content: node.content.map(visit) };
    return node;
  };
  return JSON.stringify(visit(doc));
}

function renderNode(
  node: TNode,
  state: { n: number },
  onToggle: (idx: number, checked: boolean) => void,
  key: string,
): React.ReactNode {
  switch (node.type) {
    case 'doc':
      return (node.content ?? []).map((c, i) => renderNode(c, state, onToggle, `${key}.${i}`));

    case 'paragraph':
      return (
        <p key={key} style={{ margin: '2px 0', fontSize: 13, lineHeight: 1.6, color: 'var(--ink)', fontFamily: 'var(--sans)' }}>
          {(node.content ?? []).map((c, i) => renderNode(c, state, onToggle, `${key}.${i}`))}
        </p>
      );

    case 'taskList':
      return (
        <ul key={key} className="note-card-tasklist">
          {(node.content ?? []).map((c, i) => renderNode(c, state, onToggle, `${key}.${i}`))}
        </ul>
      );

    case 'taskItem': {
      const idx = state.n++;
      const checked = Boolean(node.attrs?.checked);
      return (
        <li key={key} className="note-card-taskitem" data-checked={String(checked)} onClick={(e) => e.stopPropagation()}>
          <label className="note-card-taskitem-label" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={checked}
              className="note-card-checkbox"
              onChange={(e) => { e.stopPropagation(); onToggle(idx, e.target.checked); }}
            />
          </label>
          <div
            className="note-card-taskitem-text"
            style={{ color: checked ? 'var(--ink-mute)' : 'var(--ink)', textDecoration: checked ? 'line-through' : 'none' }}
          >
            {(node.content ?? []).map((c, i) => renderNode(c, state, onToggle, `${key}.${i}`))}
          </div>
        </li>
      );
    }

    case 'bulletList':
      return (
        <ul key={key} className="note-card-bulletlist">
          {(node.content ?? []).map((c, i) => renderNode(c, state, onToggle, `${key}.${i}`))}
        </ul>
      );

    case 'listItem':
      return (
        <li key={key} className="note-card-listitem">
          {(node.content ?? []).map((c, i) => renderNode(c, state, onToggle, `${key}.${i}`))}
        </li>
      );

    case 'text': {
      let el: React.ReactNode = node.text ?? '';
      (node.marks ?? []).forEach((m) => {
        if (m.type === 'bold') el = <strong>{el}</strong>;
        else if (m.type === 'italic') el = <em>{el}</em>;
      });
      return <React.Fragment key={key}>{el}</React.Fragment>;
    }

    default:
      return null;
  }
}

function NoteContent({
  contentJson,
  onToggle,
}: {
  contentJson: string;
  onToggle: (idx: number, checked: boolean) => void;
}) {
  try {
    const doc = JSON.parse(contentJson) as TNode;
    if (!doc.content?.length) return null;
    const state = { n: 0 };
    return <>{renderNode(doc, state, onToggle, 'root')}</>;
  } catch {
    return null;
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface WebNotesScreenProps {
  data: UserData;
  isPartner: boolean;
  onEdit: (state: EditingState) => void;
  onReorder: (notes: Note[]) => void;
  onUpdateNote: (note: Note) => void;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function WebNotesScreen({ data, isPartner, onEdit, onReorder, onUpdateNote }: WebNotesScreenProps) {
  const { notes } = data;
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = notes.findIndex((n) => n.id === active.id);
    const newIndex = notes.findIndex((n) => n.id === over.id);
    onReorder(arrayMove(notes, oldIndex, newIndex));
  };

  const activeNote = activeId ? notes.find((n) => n.id === activeId) ?? null : null;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="kicker">Personal notes</div>
          <h1>Your <em>notes</em></h1>
        </div>
        <button className="btn-add" onClick={() => onEdit({ type: 'note' })}>
          {Icons.plus({ size: 14, stroke: 'var(--cream)' })}
          <span>New note</span>
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="card white" style={{ padding: '40px 24px', textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 18 }}>
            Nothing written yet.
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginTop: 8 }}>
            Click "New note" to start writing
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(e) => setActiveId(e.active.id as string)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext items={notes.map((n) => n.id)} strategy={rectSortingStrategy}>
            <div style={{ columns: '300px 3', columnGap: '20px' }}>
              {notes.map((note) => (
                <SortableNoteCard
                  key={note.id}
                  note={note}
                  onEdit={onEdit}
                  onUpdateNote={onUpdateNote}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay
            dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.35' } } }),
            }}
          >
            {activeNote && (
              <div style={{ transform: 'scale(1.02)', boxShadow: '0 20px 48px rgba(21,19,15,0.18)', borderRadius: 16 }}>
                <NoteCardContent note={activeNote} onEdit={onEdit} onUpdateNote={onUpdateNote} isOverlay />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

// ── Sortable card wrapper ──────────────────────────────────────────────────────

function SortableNoteCard({
  note, onEdit, onUpdateNote,
}: {
  note: Note;
  onEdit: (state: EditingState) => void;
  onUpdateNote: (note: Note) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
        zIndex: isDragging ? 1 : 0,
        position: 'relative',
        breakInside: 'avoid',
        marginBottom: 20,
      }}
    >
      <NoteCardContent
        note={note}
        onEdit={onEdit}
        onUpdateNote={onUpdateNote}
        dragListeners={listeners}
        dragAttributes={attributes}
      />
    </div>
  );
}

// ── Card content ──────────────────────────────────────────────────────────────

function NoteCardContent({
  note, onEdit, onUpdateNote, dragListeners, dragAttributes, isOverlay,
}: {
  note: Note;
  onEdit: (state: EditingState) => void;
  onUpdateNote: (note: Note) => void;
  dragListeners?: ReturnType<typeof useSortable>['listeners'];
  dragAttributes?: ReturnType<typeof useSortable>['attributes'];
  isOverlay?: boolean;
}) {
  const handleToggle = (idx: number, checked: boolean) => {
    const updated = toggleTaskItem(note.content, idx, checked);
    onUpdateNote({ ...note, content: updated, updated_at: Date.now() });
  };

  return (
    <div className="card white" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <button
            {...(!isOverlay ? dragListeners : {})}
            {...(!isOverlay ? dragAttributes : {})}
            style={{
              color: 'var(--ink-faint)', padding: '4px 6px',
              touchAction: 'none', cursor: isOverlay ? 'grabbing' : 'grab',
              flexShrink: 0, borderRadius: 6,
              transition: 'color 0.12s',
            }}
            title="Drag to reorder"
          >
            <GripIcon />
          </button>
          <span style={{
            fontFamily: 'var(--serif)',
            fontSize: 18, letterSpacing: '-0.01em', color: 'var(--ink)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {note.title}
          </span>
        </div>
        {!isOverlay && (
          <button
            onClick={() => onEdit({ type: 'note', item: note })}
            style={{
              width: 28, height: 28, borderRadius: 8,
              border: '1px solid var(--hair-strong)',
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink-mute)', flexShrink: 0,
            }}
            title="Edit note"
          >
            {Icons.chevR({ stroke: 'currentColor' })}
          </button>
        )}
      </div>

      <NoteContent contentJson={note.content} onToggle={isOverlay ? () => {} : handleToggle} />

      <div style={{
        fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--ink-faint)', marginTop: 10,
      }}>
        {relativeDate(note.updated_at)}
      </div>
    </div>
  );
}
