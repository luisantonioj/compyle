import React from 'react';
import { Icons, TabIcons } from '../Icons';
import type { TabId, ViewMode } from '../../types';

const NAV_ITEMS: { id: TabId; label: string }[] = [
  // { id: 'today', label: 'Today' }, // hidden — reserved for future use
  { id: 'cal',    label: 'Plan'   },
  { id: 'notes',  label: 'Notes'  },
  { id: 'links',  label: 'Links'  },
  { id: 'focus',  label: 'Focus'  },
  { id: 'habits', label: 'Track' },
  { id: 'money',  label: 'Money'  },

];

interface SidebarProps {
  tab: TabId;
  onTab: (tab: TabId) => void;
  viewMode: ViewMode;
  onProfile: () => void;
  onSwitchView: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
  meInitial: string;
  meName: string;
  meEmail: string;
  partnerName: string;
  partnerLinked: boolean;
}

export function Sidebar({ tab, onTab, viewMode, onProfile, onSwitchView, collapsed = false, onToggle, meInitial, meName, meEmail, partnerName, partnerLinked }: SidebarProps) {
  const isPartner = viewMode === 'partner';
  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-top">
        <div className="brand-block">
          <div className="brand">compyle</div>
          {/* <div className="brand-sub">your personal companion</div */}
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
            <span className="nav-icon">{TabIcons[it.id](tab === it.id)}</span>
            <span className="nav-label">{it.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        {partnerLinked && (
          <button className="partner-switch" onClick={onSwitchView}>
            {Icons.swap()}
            <span>{isPartner ? 'Back to my view' : `Switch to ${partnerName}`}</span>
          </button>
        )}
        <button className={`profile-card${isPartner ? ' partner' : ''}`} onClick={onProfile}>
          <div className="pp">{isPartner ? partnerName.charAt(0).toUpperCase() : meInitial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="pc-name">{isPartner ? partnerName : meName}</div>
            <div className="pc-email">{isPartner ? 'PARTNER' : meEmail}</div>
          </div>
        </button>
      </div>
    </aside>
  );
}
