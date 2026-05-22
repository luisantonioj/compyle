// compyle — Profile / Settings sheet
import React from 'react';
import { Icons } from '../components/Icons';
import { Sheet, Toggle } from '../components/ui/shared';
import type { ViewMode, PrivacySettings } from '../types';

interface ProfileSheetProps {
  onClose: () => void;
  viewMode: ViewMode;
  onSwitchView: () => void;
  privacy: PrivacySettings;
  onPrivacyToggle: (key: keyof PrivacySettings) => void;
  partnerLinked: boolean;
  partnerName: string;
}

const PRIVACY_ITEMS: { key: keyof PrivacySettings; label: string }[] = [
  { key: 'tasks', label: 'Tasks & calendar' },
  { key: 'habits', label: 'Habit tracker' },
  { key: 'budget', label: 'Savings & budget' },
  { key: 'payments', label: 'Bills & payments' },
  { key: 'reminders', label: 'Reminders summary' },
];

const SETTINGS_ROWS = [
  { icon: '🔔', label: 'Notifications', detail: 'On' },
  { icon: '🌙', label: 'Appearance', detail: 'Cream' },
  { icon: '📥', label: 'Export data', detail: 'CSV / JSON' },
  { icon: '🔒', label: 'Privacy mode', detail: 'On' },
  { icon: '✨', label: 'About compyle', detail: 'v3.0' },
];

export function ProfileSheet({ onClose, viewMode, onSwitchView, privacy, onPrivacyToggle, partnerLinked, partnerName }: ProfileSheetProps) {
  return (
    <Sheet onClose={onClose}>
      <div style={{ paddingTop: 8, paddingBottom: 8 }}>
        {/* identity */}
        <div className="row" style={{ gap: 14, marginBottom: 18 }}>
          <div className={`profile-pill${viewMode === 'partner' ? ' partner' : ''}`} style={{ width: 56, height: 56, fontSize: 26 }}>
            {viewMode === 'partner' ? 'L' : 'y'}
          </div>
          <div style={{ flex: 1 }}>
            <div className="label">{viewMode === 'partner' ? 'Viewing' : 'Signed in as'}</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 26, lineHeight: 1.1, marginTop: 2 }}>
              {viewMode === 'partner' ? partnerName : 'yle'}
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.08em', marginTop: 2 }}>
              {viewMode === 'partner' ? 'PARTNER · READ-ONLY' : 'yle@compyle.app'}
            </div>
          </div>
        </div>

        {/* partner link */}
        {partnerLinked && (
          <div className="card white" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--hair)' }}>
              <div className="label" style={{ marginBottom: 4 }}>Linked partner</div>
              <div className="row-between">
                <div className="row" style={{ gap: 10 }}>
                  <div className="profile-pill partner" style={{ width: 32, height: 32, fontSize: 15 }}>L</div>
                  <div>
                    <div style={{ fontSize: 14 }}>{partnerName}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.08em', marginTop: 2 }}>
                      LINKED · 4 MONTHS
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

        {/* settings list */}
        <div className="card white" style={{ padding: 0, overflow: 'hidden' }}>
          {SETTINGS_ROWS.map((row, i) => (
            <div key={row.label} className="row" style={{
              padding: '13px 18px',
              borderBottom: i < SETTINGS_ROWS.length - 1 ? '1px solid var(--hair)' : 'none',
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

        <div className="mono" style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)', textAlign: 'center', marginTop: 18 }}>
          made with ♥ by Luis · for yle
        </div>
      </div>
    </Sheet>
  );
}
