// compyle — Links tab (mobile)
import React from 'react';
import { Icons } from '../components/Icons';
import type { UserData, ViewMode, EditingState, LinkItem } from '../types';

interface LinksScreenProps {
  data: UserData;
  viewMode: ViewMode;
  isPartner: boolean;
  profileInitial: string;
  onProfile: () => void;
  onEdit: (state: EditingState) => void;
}

export function LinksScreen({ data, viewMode, isPartner, profileInitial, onProfile, onEdit }: LinksScreenProps) {
  const { linkCategories, links } = data;

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
          linkCategories.map((cat) => {
            const catLinks = links.filter((l) => l.categoryId === cat.id);
            return (
              <div key={cat.id} className="card white" style={{ marginBottom: 12, padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: catLinks.length > 0 ? 10 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: cat.color, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontFamily: 'var(--serif)', fontSize: 18, letterSpacing: '-0.01em', color: 'var(--ink)' }}>{cat.name}</span>
                  </div>
                  <button
                    onClick={() => onEdit({ type: 'link-category', item: cat })}
                    style={{ color: 'var(--ink-faint)', padding: 4 }}
                  >
                    {Icons.chevR({ stroke: 'var(--ink-faint)' })}
                  </button>
                </div>

                {catLinks.length > 0 && (
                  <>
                    <div className="hr" />
                    {catLinks.map((link, idx) => (
                      <LinkRow
                        key={link.id}
                        link={link}
                        isLast={idx === catLinks.length - 1}
                        onEdit={() => onEdit({ type: 'link-item', item: link, categoryId: cat.id })}
                      />
                    ))}
                  </>
                )}

                <button
                  onClick={() => onEdit({ type: 'link-item', categoryId: cat.id })}
                  style={{
                    marginTop: 10,
                    width: '100%',
                    padding: '8px',
                    borderRadius: 10,
                    border: '1.5px dashed var(--hair-strong)',
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    color: 'var(--ink-mute)',
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  + Add link
                </button>
              </div>
            );
          })
        )}

        <button
          onClick={() => onEdit({ type: 'link-category' })}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: 14,
            border: '1.5px dashed var(--hair-strong)',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: 'var(--ink-soft)',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          + Add category
        </button>
      </div>

      <div style={{ height: 40 }} />
    </div>
  );
}

function LinkRow({ link, isLast, onEdit }: { link: LinkItem; isLast: boolean; onEdit: () => void }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      paddingTop: 10,
      paddingBottom: isLast ? 4 : 10,
      borderBottom: isLast ? 'none' : '1px solid var(--hair)',
    }}>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}
      >
        <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.3 }}>{link.title}</div>
        {link.description && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.08em', marginTop: 2 }}>
            {link.description}
          </div>
        )}
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: 9,
          color: 'var(--ink-faint)',
          letterSpacing: '0.06em',
          marginTop: 2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
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
