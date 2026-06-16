// compyle — Links tab (mobile)
import React, { useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragOverlay,
  defaultDropAnimationSideEffects,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, rectSortingStrategy,
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
  onReorderLinks: (links: LinkItem[]) => void;
}

export function LinksScreen({ data, isPartner, profileInitial, onProfile, onEdit, onReorder, onReorderLinks }: LinksScreenProps) {
  const activeCategories = data.linkCategories.filter((c) => !c.archived);
  const activeLinks = data.links.filter((l) => !l.archived);
  const archivedCategories = data.linkCategories.filter((c) => c.archived);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = activeCategories.findIndex((c) => c.id === active.id);
    const newIndex = activeCategories.findIndex((c) => c.id === over.id);
    onReorder(arrayMove(activeCategories, oldIndex, newIndex));
  };

  const activeCat = activeId ? activeCategories.find((c) => c.id === activeId) ?? null : null;
  const activeDragLinks = activeId ? activeLinks.filter((l) => l.categoryId === activeId) : [];

  return (
    <div className="screen">
      <div className="top-bar">
        <div>
          <div className="kicker">Links</div>
          <h1>Saved <em>Bookmarks</em></h1>
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
        {activeCategories.length === 0 && archivedCategories.length === 0 ? (
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
            <SortableContext items={activeCategories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {activeCategories.map((cat) => (
                <SortableCategoryCard
                  key={cat.id}
                  cat={cat}
                  links={activeLinks.filter((l) => l.categoryId === cat.id)}
                  onEdit={onEdit}
                  onReorderLinks={onReorderLinks}
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
                  <CategoryCardContent cat={activeCat} links={activeDragLinks} onEdit={onEdit} onReorderLinks={onReorderLinks} isOverlay />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}

        {archivedCategories.length > 0 && (
          <>
            <button
              onClick={() => setShowArchived((v) => !v)}
              style={{
                width: '100%', padding: '10px', borderRadius: 12, marginTop: 8,
                border: '1px dashed var(--hair-strong)', background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                color: 'var(--ink-mute)', fontFamily: 'var(--mono)', fontSize: 10,
                letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
              }}
            >
              {showArchived ? '↑ Hide archived' : <>{Icons.archive({ stroke: 'currentColor' })} {archivedCategories.length} archived</>}
            </button>
            {showArchived && archivedCategories.map((cat) => (
              <div key={cat.id} style={{ opacity: 0.6 }}>
                <CategoryCardContent
                  cat={cat}
                  links={data.links.filter((l) => l.categoryId === cat.id)}
                  onEdit={onEdit}
                  onReorderLinks={onReorderLinks}
                />
              </div>
            ))}
          </>
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

function SortableCategoryCard({ cat, links, onEdit, onReorderLinks }: {
  cat: LinkCategory;
  links: LinkItem[];
  onEdit: (state: EditingState) => void;
  onReorderLinks: (links: LinkItem[]) => void;
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
        onReorderLinks={onReorderLinks}
        dragListeners={listeners}
        dragAttributes={attributes}
      />
    </div>
  );
}

function CategoryCardContent({ cat, links, onEdit, onReorderLinks, dragListeners, dragAttributes, isOverlay }: {
  cat: LinkCategory;
  links: LinkItem[];
  onEdit: (state: EditingState) => void;
  onReorderLinks: (links: LinkItem[]) => void;
  dragListeners?: ReturnType<typeof useSortable>['listeners'];
  dragAttributes?: ReturnType<typeof useSortable>['attributes'];
  isOverlay?: boolean;
}) {
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null);

  const linkSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
  );

  const handleLinkDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLinkId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);
    onReorderLinks(arrayMove(links, oldIndex, newIndex));
  };

  const activeLink = activeLinkId ? links.find((l) => l.id === activeLinkId) ?? null : null;

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
            {Icons.pencil({ stroke: 'var(--ink-faint)' })}
          </button>
        )}
      </div>

      {links.length > 0 && (
        <>
          <div className="hr" />
          {isOverlay ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: '16px 12px', paddingTop: 10 }}>
              {links.map((link) => (
                <LinkRow key={link.id} link={link} onEdit={() => {}} />
              ))}
            </div>
          ) : (
            <DndContext
              sensors={linkSensors}
              collisionDetection={closestCenter}
              onDragStart={(e) => setActiveLinkId(e.active.id as string)}
              onDragEnd={handleLinkDragEnd}
              onDragCancel={() => setActiveLinkId(null)}
            >
              <SortableContext items={links.map((l) => l.id)} strategy={rectSortingStrategy}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: '16px 12px', paddingTop: 10 }}>
                  {links.map((link) => (
                    <SortableLinkRow
                      key={link.id}
                      link={link}
                      onEdit={() => onEdit({ type: 'link-item', item: link, categoryId: cat.id })}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay
                dropAnimation={{
                  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.35' } } }),
                }}
              >
                {activeLink && (
                  <div style={{ transform: 'scale(1.05)' }}>
                    <LinkRow link={activeLink} onEdit={() => {}} />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
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

function SortableLinkRow({ link, onEdit }: { link: LinkItem; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
        touchAction: 'none',
        position: 'relative',
        zIndex: isDragging ? 1 : 0,
      }}
      {...listeners}
      {...attributes}
    >
      <LinkRow link={link} onEdit={onEdit} />
    </div>
  );
}

function LinkRow({ link, onEdit }: { link: LinkItem; onEdit: () => void }) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', width: '100%' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid var(--hair-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 6, background: 'var(--white)' }}>
          {link.customImageUrl ? (
            <img src={link.customImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : link.customEmoji ? (
            <span style={{ fontSize: 24, lineHeight: 1 }}>{link.customEmoji}</span>
          ) : (
            <img src={`https://www.google.com/s2/favicons?domain=${link.url}&sz=64`} alt="" style={{ width: 24, height: 24 }} />
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink)', lineHeight: 1.2, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>
          {link.title}
        </div>
      </a>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
        style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, background: 'var(--white)', border: '1px solid var(--hair-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-mute)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
      >
        <span style={{ fontSize: 10, lineHeight: 1, paddingBottom: 2, fontFamily: 'var(--sans)' }}>⋮</span>
      </button>
    </div>
  );
}
