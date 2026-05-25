// compyle — Profile / Settings sheet
import { useState } from 'react';
import type { User } from 'firebase/auth';
import { Icons } from '../components/Icons';
import { Sheet, Toggle } from '../components/ui/shared';
import { IS_CONFIGURED } from '../lib/firebase';
import type { ViewMode, PrivacySettings } from '../types';

interface ProfileSheetProps {
  onClose: () => void;
  viewMode: ViewMode;
  onSwitchView: () => void;
  privacy: PrivacySettings;
  onPrivacyToggle: (key: keyof PrivacySettings) => void;
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

const PRIVACY_ITEMS: { key: keyof PrivacySettings; label: string }[] = [
  { key: 'tasks', label: 'Tasks & calendar' },
  { key: 'habits', label: 'Habit tracker' },
  { key: 'budget', label: 'Savings & budget' },
  { key: 'payments', label: 'Bills & payments' },
  { key: 'reminders', label: 'Reminders summary' },
];

const STATIC_SETTINGS_ROWS = [
  { icon: '🌙', label: 'Appearance', detail: 'Cream' },
  { icon: '📥', label: 'Export data', detail: 'CSV / JSON' },
  { icon: '🔒', label: 'Privacy mode', detail: 'On' },
  { icon: '✨', label: 'About compyle', detail: 'v3.0' },
];

export function ProfileSheet({ onClose, viewMode, onSwitchView, privacy, onPrivacyToggle, partnerLinked, partnerName, user, onSignOut, onEnableNotifications, pushEnabled, onCreateInvite, onAcceptInvite, onUnlink }: ProfileSheetProps) {
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'yle';
  const initial = (viewMode === 'partner' ? partnerName : displayName).charAt(0).toUpperCase();
  const email = user?.email || 'yle@compyle.app';

  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteInput, setInviteInput] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState('');

  const notifDetail = IS_CONFIGURED
    ? pushEnabled
      ? 'On'
      : typeof Notification !== 'undefined' && Notification.permission === 'denied'
        ? 'Blocked'
        : 'Off'
    : 'On';
  const notifClickable = IS_CONFIGURED && !pushEnabled && typeof Notification !== 'undefined' && Notification.permission !== 'denied';

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
              {viewMode === 'partner' ? 'PARTNER · READ-ONLY' : email.toUpperCase()}
            </div>
          </div>
        </div>

        {/* partner section — linked */}
        {partnerLinked && (
          <div className="card white" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--hair)' }}>
              <div className="label" style={{ marginBottom: 4 }}>Linked partner</div>
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
              </div>
              {onUnlink && (
                <button
                  style={{
                    marginTop: 10, fontFamily: 'var(--mono)', fontSize: 10,
                    letterSpacing: '0.1em', color: 'var(--clay)',
                    padding: '4px 8px', border: '1px solid var(--clay)',
                    borderRadius: 6, background: 'none', cursor: 'pointer',
                  }}
                  onClick={async () => { await onUnlink(); }}
                >
                  unlink
                </button>
              )}
            </div>

            {/* privacy controls — only shown in own view */}
            {viewMode !== 'partner' && (
              <div style={{ padding: '12px 18px' }}>
                <div className="label" style={{ marginBottom: 10 }}>What {partnerName} can see</div>
                {PRIVACY_ITEMS.map((p) => (
                  <div key={p.key} className="row-between" style={{ padding: '8px 0' }}>
                    <span style={{ fontSize: 14 }}>{p.label}</span>
                    <Toggle on={privacy[p.key]} onToggle={() => onPrivacyToggle(p.key)} />
                  </div>
                ))}
              </div>
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
            onClick={notifClickable && onEnableNotifications ? () => void onEnableNotifications() : undefined}
            style={{
              padding: '13px 18px',
              borderBottom: '1px solid var(--hair)',
              gap: 12,
              cursor: notifClickable ? 'pointer' : 'default',
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

          {STATIC_SETTINGS_ROWS.map((row, i) => (
            <div key={row.label} className="row" style={{
              padding: '13px 18px',
              borderBottom: i < STATIC_SETTINGS_ROWS.length - 1 ? '1px solid var(--hair)' : 'none',
              gap: 12,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, background: 'var(--cream-deep)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              }}>{row.icon}</div>
              <div style={{ flex: 1, fontSize: 15 }}>{row.label}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.05em' }}>{row.detail}</div>
              {Icons.chevR({ stroke: 'var(--ink-faint)' })}
            </div>
          ))}
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
