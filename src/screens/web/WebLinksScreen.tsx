// compyle — Links tab (web / desktop)
import React from 'react';
import { Icons } from '../../components/Icons';
import type { UserData, EditingState, LinkItem } from '../../types';

interface WebLinksScreenProps {
  data: UserData;
  isPartner: boolean;
  onEdit: (state: EditingState) => void;
}

export function WebLinksScreen({ data, onEdit }: WebLinksScreenProps) {
  const { linkCategories, links } = data;

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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
          alignItems: 'start',
        }}>
          {linkCategories.map((cat) => {
            const catLinks = links.filter((l) => l.categoryId === cat.id);
            return (
              <div key={cat.id} className="card white" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: cat.color, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontFamily: 'var(--serif)', fontSize: 20, letterSpacing: '-0.01em', color: 'var(--ink)' }}>{cat.name}</span>
                  </div>
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
                        transition: 'background 0.12s',
                      }}
                      title="Edit category"
                    >
                      {Icons.chevR({ stroke: 'currentColor' })}
                    </button>
                  </div>
                </div>

                {catLinks.length === 0 ? (
                  <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-faint)', paddingBottom: 4 }}>
                    No links yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {catLinks.map((link, idx) => (
                      <WebLinkRow
                        key={link.id}
                        link={link}
                        isLast={idx === catLinks.length - 1}
                        onEdit={() => onEdit({ type: 'link-item', item: link, categoryId: cat.id })}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WebLinkRow({ link, isLast, onEdit }: { link: LinkItem; isLast: boolean; onEdit: () => void }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      paddingTop: 10,
      paddingBottom: 10,
      borderBottom: isLast ? 'none' : '1px solid var(--hair)',
    }}>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}
      >
        <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.3, fontFamily: 'var(--sans)' }}>{link.title}</div>
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
      <button
        onClick={onEdit}
        style={{
          width: 26, height: 26, borderRadius: 7,
          border: '1px solid var(--hair-strong)',
          background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink-faint)',
          flexShrink: 0,
          transition: 'background 0.12s',
        }}
        title="Edit link"
      >
        {Icons.chevR({ stroke: 'currentColor' })}
      </button>
    </div>
  );
}
