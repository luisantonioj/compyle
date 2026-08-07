// compyle — Profile / Settings sheet
import { useState } from 'react';
import type { User } from 'firebase/auth';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Icons } from '../components/Icons';
import { Sheet, Toggle } from '../components/ui/shared';
import { IS_CONFIGURED } from '../lib/firebase';
import type { ViewMode } from '../types';
import { useAppStore } from '../store/appStore';
import {
  getOrderedNavItems,
  type CustomizableTabId,
  type NavOrderSettings,
  type VisibleTabSettings,
} from '../lib/navigation';

interface ProfileSheetProps {
  onClose: () => void;
  viewMode: ViewMode;
  onSwitchView: () => void;
  visibleTabs: VisibleTabSettings;
  onVisibleTabToggle: (tab: CustomizableTabId) => void;
  navOrder: NavOrderSettings;
  onSaveNavigationPreferences: (visibleTabs: VisibleTabSettings, navOrder: NavOrderSettings) => void;
  partnerLinked: boolean;
  partnerName: string;
  user?: User | null;
  onSignOut?: () => void;
  onEnableNotifications?: () => Promise<void>;
  pushEnabled?: boolean;
  onCreateInvite?: () => Promise<string>;
  onAcceptInvite?: (code: string) => Promise<void>;
  onUnlink?: () => Promise<void>;
}

const STATIC_SETTINGS_ROWS = [
  { icon: '🌙', label: 'Appearance', detail: 'Cream' },
  { icon: '📥', label: 'Export data', detail: 'CSV / JSON' },
  { icon: '🔒', label: 'Privacy mode', detail: 'On' },
  { icon: '✨', label: 'About compyle', detail: 'v1.43' },
];

export function ProfileSheet({ onClose, viewMode, onSwitchView, visibleTabs, onVisibleTabToggle, navOrder, onSaveNavigationPreferences, partnerLinked, partnerName, user, onSignOut, onEnableNotifications, pushEnabled, onCreateInvite, onAcceptInvite, onUnlink }: ProfileSheetProps) {
  const flash = useAppStore((s) => s.flash);
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'yle';
  const initial = (viewMode === 'partner' ? partnerName : displayName).charAt(0).toUpperCase();
  const email = user?.email || 'yle@compyle.app';

  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteInput, setInviteInput] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [showAbout, setShowAbout] = useState(false);
  const [editingNavigation, setEditingNavigation] = useState(false);
  const [draftVisibleTabs, setDraftVisibleTabs] = useState(visibleTabs);
  const [draftNavOrder, setDraftNavOrder] = useState(navOrder);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const notifDetail = IS_CONFIGURED
    ? pushEnabled
      ? 'On'
      : typeof Notification !== 'undefined' && Notification.permission === 'denied'
        ? 'Blocked'
        : 'Off'
    : 'On';
  const notifClickable = IS_CONFIGURED && !pushEnabled && typeof Notification !== 'undefined' && Notification.permission !== 'denied';

  const startNavigationEdit = () => {
    setDraftVisibleTabs(visibleTabs);
    setDraftNavOrder(navOrder);
    setEditingNavigation(true);
  };

  const saveNavigationEdit = () => {
    onSaveNavigationPreferences(draftVisibleTabs, draftNavOrder);
    setEditingNavigation(false);
  };

  const toggleDraftVisibleTab = (tab: CustomizableTabId) => {
    setDraftVisibleTabs((current) => {
      const visibleCount = Object.values(current).filter(Boolean).length;
      if (current[tab] && visibleCount <= 1) return current;
      return { ...current, [tab]: !current[tab] };
    });
  };

  const handleNavigationDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setDraftNavOrder((current) => {
      const oldIndex = current.indexOf(active.id as CustomizableTabId);
      const newIndex = current.indexOf(over.id as CustomizableTabId);
      if (oldIndex < 0 || newIndex < 0) return current;
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  if (showAbout) {
    return (
      <Sheet onClose={() => setShowAbout(false)}>
        <div style={{ position: 'relative', paddingTop: 8, paddingBottom: 24, paddingLeft: 4, paddingRight: 4 }}>
          <button 
            onClick={() => setShowAbout(false)}
            style={{ 
              position: 'absolute', top: -14, right: -10, 
              background: 'none', border: 'none', 
              padding: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink-mute)'
            }}
          >
            <div style={{ transform: 'rotate(45deg)' }}>
              {Icons.plus({ size: 28, stroke: 'currentColor' })}
            </div>
          </button>
          
          <div style={{ fontFamily: 'var(--serif)', fontSize: 30, marginBottom: 8, marginTop: 4 }}>Compyle</div>
          <div style={{ fontSize: 15, color: 'var(--ink-mute)', marginBottom: 28, lineHeight: 1.4 }}>
            All-in-One Personal Companion. Your Life Compyler.
          </div>

          <div style={{ fontSize: 17, fontFamily: 'var(--serif)', fontWeight: 600, marginBottom: 10 }}>Origin Story</div>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 28, textAlign: 'justify' }}>
            Compyle was originally created as a gift to replace a scattered collection of Google Sheets with one unified application. Built with love for Yle, the platform was designed to simplify daily routines and bring all essential life-management tools into a single space.
          </div>

          <div style={{ fontSize: 17, fontFamily: 'var(--serif)', fontWeight: 600, marginBottom: 10 }}>App Summary</div>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5, textAlign: 'justify' }}>
            Serving as your personal companion, this offline-first Progressive Web App seamlessly consolidates calendar tasks, random notes, quick links, habit tracking, budget management, and payment reminders. It also features secure couple collaboration, allowing partners to securely view and edit each other's progress while maintaining full control over their own privacy settings.
          </div>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet onClose={onClose}>
      <div style={{ paddingTop: 8, paddingBottom: 8 }}>
        {/* identity */}
        <div className="row" style={{ gap: 14, marginBottom: 18 }}>
          <div className={`profile-pill${viewMode === 'partner' ? ' partner' : ''}`} style={{ width: 56, height: 56, fontSize: 26 }}>
            {initial}
          </div>
          <div style={{ flex: 1 }}>
            <div className="label">{viewMode === 'partner' ? 'Viewing' : 'Signed in as'}</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 26, lineHeight: 1.1, marginTop: 2 }}>
              {viewMode === 'partner' ? partnerName : displayName}
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.08em', marginTop: 2 }}>
              {viewMode === 'partner' ? 'PARTNER · READ-ONLY' : email}
            </div>
          </div>
        </div>

        {/* partner section — linked */}
        {partnerLinked && (
          <div className="card white" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--hair)' }}>
              {/* <div className="label" style={{ marginBottom: 4 }}>Linked partner</div> */}
              <div className="row-between">
                <div className="row" style={{ gap: 10 }}>
                  <div className="profile-pill partner" style={{ width: 32, height: 32, fontSize: 15 }}>
                    {partnerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14 }}>{partnerName}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.08em', marginTop: 2 }}>
                      PARTNER
                    </div>
                  </div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <button
                    onClick={onSwitchView}
                    style={{
                      fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      padding: '8px 12px', borderRadius: 999,
                      background: viewMode === 'partner' ? 'var(--ink)' : 'var(--partner)',
                      color: 'white',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    {Icons.swap()}
                    {viewMode === 'partner' ? 'My view' : `${partnerName}'s view`}
                  </button>
                  {onUnlink && (
                    <button
                      style={{
                        fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: 'var(--clay)',
                        width: 44, boxSizing: 'border-box',
                        padding: '8px 12px', border: '1px solid var(--clay)',
                        borderRadius: 999, background: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      }}
                      onClick={async () => { await onUnlink(); }}
                    >
                      {Icons.unlink({ stroke: 'var(--clay)' })}
                    </button>
                  )}
                </div>
              </div>
            </div>


          </div>
        )}

        {/* personal navigation controls - available for every own account */}
        {viewMode !== 'partner' && (
          <div className="card white" style={{ padding: '12px 18px', marginBottom: 16 }}>
            <div className="row-between" style={{ marginBottom: 10 }}>
              <div className="label">Customize navigation</div>
              <button
                className="mono"
                onClick={editingNavigation ? saveNavigationEdit : startNavigationEdit}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  width: 44,
                  height: 26,
                  color: editingNavigation ? 'var(--cream)' : 'var(--clay)',
                  background: editingNavigation ? 'var(--ink)' : 'transparent',
                  border: '1px solid var(--hair-strong)',
                  borderRadius: 999,
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {editingNavigation ? 'Done' : 'Edit'}
              </button>
            </div>
            {editingNavigation ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleNavigationDragEnd}>
                <SortableContext items={draftNavOrder} strategy={verticalListSortingStrategy}>
                  {getOrderedNavItems(draftNavOrder).map((item) => (
                    <SortableNavigationRow
                      key={item.id}
                      id={item.id}
                      label={item.label}
                      visible={draftVisibleTabs[item.id]}
                      onToggle={() => toggleDraftVisibleTab(item.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              getOrderedNavItems(navOrder).map((item) => (
                <div key={item.id} className="row-between" style={{ padding: '8px 0' }}>
                  <span style={{ fontSize: 14 }}>{item.label}</span>
                  <Toggle on={visibleTabs[item.id]} onToggle={() => onVisibleTabToggle(item.id)} />
                </div>
              ))
            )}
          </div>
        )}

        {/* partner section — not linked */}
        {!partnerLinked && IS_CONFIGURED && (
          <div className="card white" style={{ padding: '14px 18px', marginBottom: 16 }}>
            <div className="label" style={{ marginBottom: 10 }}>Link a partner</div>

            {/* generate code */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginBottom: 8 }}>
                Share this code with your partner:
              </div>
              {inviteCode ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="mono" style={{ fontSize: 22, letterSpacing: '0.22em', color: 'var(--ink)', fontWeight: 600 }}>
                    {inviteCode}
                  </div>
                  <button
                    className="mono"
                    style={{ fontSize: 10, color: 'var(--clay)', padding: '4px 8px', border: '1px solid var(--hair-strong)', borderRadius: 6, background: 'none', cursor: 'pointer' }}
                    onClick={() => setInviteCode(null)}
                  >clear</button>
                </div>
              ) : (
                <button
                  style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', padding: '8px 14px', borderRadius: 10, border: '1.5px solid var(--hair-strong)', background: 'none', cursor: 'pointer' }}
                  disabled={linkLoading}
                  onClick={async () => {
                    if (!onCreateInvite) return;
                    setLinkLoading(true); setLinkError('');
                    try { setInviteCode(await onCreateInvite()); }
                    catch { setLinkError('Could not generate code.'); }
                    finally { setLinkLoading(false); }
                  }}
                >
                  {linkLoading ? '···' : 'Generate code'}
                </button>
              )}
            </div>

            {/* enter code */}
            <div style={{ borderTop: '1px solid var(--hair)', paddingTop: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginBottom: 8 }}>
                Or enter your partner's code:
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ flex: 1, fontSize: 16, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--hair-strong)', background: 'var(--cream)', fontFamily: 'var(--mono)', outline: 'none' }}
                  placeholder="ABC123"
                  maxLength={6}
                  value={inviteInput}
                  onChange={(e) => { setInviteInput(e.target.value.toUpperCase()); setLinkError(''); }}
                />
                <button
                  style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', padding: '8px 16px', borderRadius: 10, background: 'var(--ink)', color: 'var(--cream)', border: 'none', cursor: 'pointer', opacity: (linkLoading || inviteInput.length < 6) ? 0.4 : 1 }}
                  disabled={linkLoading || inviteInput.length < 6}
                  onClick={async () => {
                    if (!onAcceptInvite) return;
                    setLinkLoading(true); setLinkError('');
                    try { await onAcceptInvite(inviteInput); setInviteInput(''); }
                    catch (err) { setLinkError((err as Error).message ?? 'Invalid code.'); }
                    finally { setLinkLoading(false); }
                  }}
                >
                  {linkLoading ? '···' : 'Link'}
                </button>
              </div>
              {linkError && <div style={{ fontSize: 12, color: 'var(--clay)', marginTop: 6 }}>{linkError}</div>}
            </div>
          </div>
        )}

        {/* settings list */}
        <div className="card white" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Notifications row — interactive when push not yet enabled */}
          <div
            className="row"
            onClick={() => flash('Feature coming soon')}
            style={{
              padding: '13px 18px',
              borderBottom: '1px solid var(--hair)',
              gap: 12,
              cursor: 'pointer',
              opacity: 0.4,
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: 'var(--cream-deep)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>🔔</div>
            <div style={{ flex: 1, fontSize: 15 }}>Notifications</div>
            <div className="mono" style={{
              fontSize: 11,
              color: notifDetail === 'On' ? 'var(--sage)' : notifDetail === 'Blocked' ? 'var(--clay)' : 'var(--ink-mute)',
              letterSpacing: '0.05em',
            }}>{notifDetail}</div>
            {Icons.chevR({ stroke: 'var(--ink-faint)' })}
          </div>

          {STATIC_SETTINGS_ROWS.map((row, i) => {
            const isComingSoon = row.label !== 'About compyle';
            return (
            <div 
              key={row.label} 
              className="row" 
              style={{
                padding: '13px 18px',
                borderBottom: i < STATIC_SETTINGS_ROWS.length - 1 ? '1px solid var(--hair)' : 'none',
                gap: 12,
                opacity: isComingSoon ? 0.4 : 1,
                cursor: 'pointer'
              }}
              onClick={() => {
                if (isComingSoon) {
                  flash('Feature coming soon');
                } else if (row.label === 'About compyle') {
                  setShowAbout(true);
                }
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 8, background: 'var(--cream-deep)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              }}>{row.icon}</div>
              <div style={{ flex: 1, fontSize: 15 }}>{row.label}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.05em' }}>{row.detail}</div>
              {Icons.chevR({ stroke: 'var(--ink-faint)' })}
            </div>
          )})}
        </div>

        {IS_CONFIGURED && onSignOut && (
          <button
            onClick={onSignOut}
            style={{
              width: '100%', marginTop: 12, height: 48,
              border: '1.5px solid var(--hair-strong)', borderRadius: 14,
              background: 'transparent', fontSize: 14,
              color: 'var(--clay)', fontFamily: 'var(--sans)',
              letterSpacing: '0.01em',
            }}
          >
            Sign out
          </button>
        )}

        <div className="mono" style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)', textAlign: 'center', marginTop: 18 }}>
          made with ♥ by Luis · for yle
        </div>
      </div>
    </Sheet>
  );
}

function SortableNavigationRow({
  id,
  label,
  visible,
  onToggle,
}: {
  id: CustomizableTabId;
  label: string;
  visible: boolean;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className="row-between"
      style={{
        padding: '8px 0',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        position: 'relative',
        zIndex: isDragging ? 2 : 0,
      }}
    >
      <div className="row" style={{ gap: 10 }}>
        <button
          {...attributes}
          {...listeners}
          title="Drag to reorder"
          style={{
            width: 28,
            height: 28,
            border: '1px solid var(--hair)',
            borderRadius: 8,
            background: 'var(--cream)',
            color: 'var(--ink-mute)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            cursor: 'grab',
            touchAction: 'none',
          }}
        >
          <span style={{ width: 12, height: 1, background: 'currentColor' }} />
          <span style={{ width: 12, height: 1, background: 'currentColor' }} />
          <span style={{ width: 12, height: 1, background: 'currentColor' }} />
        </button>
        <span style={{ fontSize: 14 }}>{label}</span>
      </div>
      <Toggle on={visible} onToggle={onToggle} />
    </div>
  );
}
