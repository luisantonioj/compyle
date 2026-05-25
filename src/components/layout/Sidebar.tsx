import React from 'react';
import { Icons } from '../Icons';
import type { TabId, ViewMode } from '../../types';

const NAV_ITEMS: { id: TabId; label: string; glyph: string }[] = [
  // { id: 'today', label: 'Today', glyph: 'T' }, // hidden — reserved for future use
  { id: 'cal',   label: 'Plan',  glyph: 'P' },
  { id: 'habits', label: 'Habits', glyph: 'H' },
  { id: 'money', label: 'Money', glyph: 'M' },
];

interface SidebarProps {
  tab: TabId;
  onTab: (tab: TabId) => void;
  viewMode: ViewMode;
  onProfile: () => void;
  onSwitchView: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ tab, onTab, viewMode, onProfile, onSwitchView, collapsed = false, onToggle }: SidebarProps) {
  const isPartner = viewMode === 'partner';
  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-top">
        <div className="brand-block">
          <div className="brand">compyle<em>.</em></div>
          <div className="brand-sub">for yle · v3.0</div>
        </div>
        <button className="sidebar-toggle" onClick={onToggle} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? Icons.chevR({ size: 14, stroke: 'currentColor' }) : Icons.chevL({ size: 14, stroke: 'currentColor' })}
        </button>
      </div>
      <nav className="nav">
        {NAV_ITEMS.map((it) => (
          <button
            key={it.id}
            className={`nav-item${tab === it.id ? ' active' : ''}`}
            onClick={() => onTab(it.id as TabId)}
          >
            <span className="nav-glyph">{it.glyph}</span>
            <span className="nav-label">{it.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        <button className="partner-switch" onClick={onSwitchView}>
          {Icons.swap()}
          <span>{isPartner ? 'Back to my view' : 'Switch to Luis'}</span>
        </button>
        <button className={`profile-card${isPartner ? ' partner' : ''}`} onClick={onProfile}>
          <div className="pp">{isPartner ? 'L' : 'y'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="pc-name">{isPartner ? 'Luis' : 'yle'}</div>
            <div className="pc-email">{isPartner ? 'PARTNER · READ-ONLY' : 'yle@compyle.app'}</div>
          </div>
        </button>
      </div>
    </aside>
  );
}
