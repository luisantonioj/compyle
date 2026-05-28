// compyle — Links tab (web / desktop)
import React, { useState } from 'react';
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
import { Icons } from '../../components/Icons';
import type { UserData, EditingState, LinkCategory, LinkItem } from '../../types';

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

interface WebLinksScreenProps {
  data: UserData;
  isPartner: boolean;
  onEdit: (state: EditingState) => void;
  onReorder: (cats: LinkCategory[]) => void;
}

export function WebLinksScreen({ data, onEdit, onReorder }: WebLinksScreenProps) {
  const { linkCategories, links } = data;
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = linkCategories.findIndex((c) => c.id === active.id);
    const newIndex = linkCategories.findIndex((c) => c.id === over.id);
    onReorder(arrayMove(linkCategories, oldIndex, newIndex));
  };

  const activeCat = activeId ? linkCategories.find((c) => c.id === activeId) ?? null : null;
  const activeLinks = activeId ? links.filter((l) => l.categoryId === activeId) : [];

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="kicker">Quick access</div>
          <h1>Your <em>links</em></h1>
        </div>
        <button className="btn-add" onClick={() => onEdit({ type: 'link-category' })}>
          {Icons.plus({ size: 14, stroke: 'var(--cream)' })}
          <span>New category</span>
        </button>
      </div>

      {linkCategories.length === 0 ? (
        <div className="card white" style={{ padding: '40px 24px', textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 18 }}>
            No categories yet.
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginTop: 8 }}>
            Add one to start organizing your links
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
          <SortableContext items={linkCategories.map((c) => c.id)} strategy={rectSortingStrategy}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 20,
              alignItems: 'start',
            }}>
              {linkCategories.map((cat) => (
                <SortableWebCard
                  key={cat.id}
                  cat={cat}
                  links={links.filter((l) => l.categoryId === cat.id)}
                  onEdit={onEdit}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay
            dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.35' } } }),
            }}
          >
            {activeCat && (
              <div style={{ transform: 'scale(1.02)', boxShadow: '0 20px 48px rgba(21,19,15,0.18)', borderRadius: 16 }}>
                <WebCardContent cat={activeCat} links={activeLinks} onEdit={onEdit} isOverlay />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

function SortableWebCard({ cat, links, onEdit }: {
  cat: LinkCategory;
  links: LinkItem[];
  onEdit: (state: EditingState) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
        zIndex: isDragging ? 1 : 0,
        position: 'relative',
      }}
    >
      <WebCardContent cat={cat} links={links} onEdit={onEdit} dragListeners={listeners} dragAttributes={attributes} />
    </div>
  );
}

function WebCardContent({ cat, links, onEdit, dragListeners, dragAttributes, isOverlay }: {
  cat: LinkCategory;
  links: LinkItem[];
  onEdit: (state: EditingState) => void;
  dragListeners?: ReturnType<typeof useSortable>['listeners'];
  dragAttributes?: ReturnType<typeof useSortable>['attributes'];
  isOverlay?: boolean;
}) {
  return (
    <div className="card white" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
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
          <span style={{ width: 10, height: 10, borderRadius: 999, background: cat.color, flexShrink: 0, display: 'inline-block' }} />
          <span style={{ fontFamily: 'var(--serif)', fontSize: 20, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
            {cat.name}
          </span>
        </div>
        {!isOverlay && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              className="btn-add ghost"
              style={{ fontSize: 9, padding: '5px 10px' }}
              onClick={() => onEdit({ type: 'link-item', categoryId: cat.id })}
            >
              + link
            </button>
            <button
              onClick={() => onEdit({ type: 'link-category', item: cat })}
              style={{
                width: 28, height: 28, borderRadius: 8,
                border: '1px solid var(--hair-strong)',
                background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ink-mute)',
              }}
              title="Edit category"
            >
              {Icons.chevR({ stroke: 'currentColor' })}
            </button>
          </div>
        )}
      </div>

      {links.length === 0 ? (
        <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-faint)', paddingBottom: 4 }}>
          No links yet.
        </div>
      ) : (
        <div>
          {links.map((link, idx) => (
            <WebLinkRow
              key={link.id}
              link={link}
              isLast={idx === links.length - 1}
              onEdit={() => !isOverlay && onEdit({ type: 'link-item', item: link, categoryId: cat.id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WebLinkRow({ link, isLast, onEdit }: { link: LinkItem; isLast: boolean; onEdit: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      paddingTop: 10, paddingBottom: 10,
      borderBottom: isLast ? 'none' : '1px solid var(--hair)',
    }}>
      <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
        <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.3, fontFamily: 'var(--sans)' }}>{link.title}</div>
        {link.description && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.08em', marginTop: 2 }}>
            {link.description}
          </div>
        )}
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-faint)',
          letterSpacing: '0.06em', marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {link.url}
        </div>
      </a>
      <button
        onClick={onEdit}
        style={{
          width: 26, height: 26, borderRadius: 7,
          border: '1px solid var(--hair-strong)', background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink-faint)', flexShrink: 0,
        }}
        title="Edit link"
      >
        {Icons.chevR({ stroke: 'currentColor' })}
      </button>
    </div>
  );
}
