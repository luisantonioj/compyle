// compyle — Links tab (mobile)
import React, { useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragOverlay,
  defaultDropAnimationSideEffects,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Icons } from '../components/Icons';
import type { UserData, ViewMode, EditingState, LinkCategory, LinkItem } from '../types';

const GripIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="4.5" cy="3.5" r="1.2" fill="currentColor"/>
    <circle cx="9.5" cy="3.5" r="1.2" fill="currentColor"/>
    <circle cx="4.5" cy="7"   r="1.2" fill="currentColor"/>
    <circle cx="9.5" cy="7"   r="1.2" fill="currentColor"/>
    <circle cx="4.5" cy="10.5" r="1.2" fill="currentColor"/>
    <circle cx="9.5" cy="10.5" r="1.2" fill="currentColor"/>
  </svg>
);

interface LinksScreenProps {
  data: UserData;
  viewMode: ViewMode;
  isPartner: boolean;
  profileInitial: string;
  onProfile: () => void;
  onEdit: (state: EditingState) => void;
  onReorder: (cats: LinkCategory[]) => void;
}

export function LinksScreen({ data, isPartner, profileInitial, onProfile, onEdit, onReorder }: LinksScreenProps) {
  const { linkCategories, links } = data;
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
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
    <div className="screen">
      <div className="top-bar">
        <div>
          <div className="kicker">Quick access</div>
          <h1>Your <em>links</em></h1>
        </div>
        <button
          className={`profile-pill${isPartner ? ' partner' : ''}`}
          onClick={onProfile}
        >
          {profileInitial}
          <span className="dot" />
        </button>
      </div>

      <div className="pad-x" style={{ marginTop: 8 }}>
        {linkCategories.length === 0 ? (
          <div className="card white" style={{ padding: '28px 18px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 16 }}>
              No categories yet. Add one to get started.
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
            <SortableContext items={linkCategories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {linkCategories.map((cat) => (
                <SortableCategoryCard
                  key={cat.id}
                  cat={cat}
                  links={links.filter((l) => l.categoryId === cat.id)}
                  onEdit={onEdit}
                />
              ))}
            </SortableContext>

            <DragOverlay
              dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.35' } } }),
              }}
            >
              {activeCat && (
                <div style={{ transform: 'scale(1.02)', boxShadow: '0 16px 40px rgba(21,19,15,0.18)', borderRadius: 18 }}>
                  <CategoryCardContent cat={activeCat} links={activeLinks} onEdit={onEdit} isOverlay />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}

        <button
          onClick={() => onEdit({ type: 'link-category' })}
          style={{
            width: '100%', padding: '13px', borderRadius: 14,
            border: '1.5px dashed var(--hair-strong)', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: 'var(--ink-soft)', fontFamily: 'var(--mono)', fontSize: 11,
            letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
            marginTop: 4,
          }}
        >
          + Add category
        </button>
      </div>

      <div style={{ height: 40 }} />
    </div>
  );
}

function SortableCategoryCard({ cat, links, onEdit }: {
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
      <CategoryCardContent
        cat={cat}
        links={links}
        onEdit={onEdit}
        dragListeners={listeners}
        dragAttributes={attributes}
      />
    </div>
  );
}

function CategoryCardContent({ cat, links, onEdit, dragListeners, dragAttributes, isOverlay }: {
  cat: LinkCategory;
  links: LinkItem[];
  onEdit: (state: EditingState) => void;
  dragListeners?: ReturnType<typeof useSortable>['listeners'];
  dragAttributes?: ReturnType<typeof useSortable>['attributes'];
  isOverlay?: boolean;
}) {
  return (
    <div className="card white" style={{ marginBottom: 12, padding: '14px 18px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: links.length > 0 ? 10 : 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
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
          <span style={{ fontFamily: 'var(--serif)', fontSize: 18, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
            {cat.name}
          </span>
        </div>
        {!isOverlay && (
          <button onClick={() => onEdit({ type: 'link-category', item: cat })} style={{ color: 'var(--ink-faint)', padding: 4 }}>
            {Icons.chevR({ stroke: 'var(--ink-faint)' })}
          </button>
        )}
      </div>

      {links.length > 0 && (
        <>
          <div className="hr" />
          {links.map((link, idx) => (
            <LinkRow
              key={link.id}
              link={link}
              isLast={idx === links.length - 1}
              onEdit={() => !isOverlay && onEdit({ type: 'link-item', item: link, categoryId: cat.id })}
            />
          ))}
        </>
      )}

      {!isOverlay && (
        <button
          onClick={() => onEdit({ type: 'link-item', categoryId: cat.id })}
          style={{
            marginTop: 10, width: '100%', padding: '8px', borderRadius: 10,
            border: '1.5px dashed var(--hair-strong)', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            color: 'var(--ink-mute)', fontFamily: 'var(--mono)', fontSize: 10,
            letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
          }}
        >
          + Add link
        </button>
      )}
    </div>
  );
}

function LinkRow({ link, isLast, onEdit }: { link: LinkItem; isLast: boolean; onEdit: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      paddingTop: 10, paddingBottom: isLast ? 4 : 10,
      borderBottom: isLast ? 'none' : '1px solid var(--hair)',
    }}>
      <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
        <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.3 }}>{link.title}</div>
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
      <button onClick={onEdit} style={{ color: 'var(--ink-faint)', padding: 4, flexShrink: 0 }}>
        {Icons.chevR({ stroke: 'var(--ink-faint)' })}
      </button>
    </div>
  );
}
