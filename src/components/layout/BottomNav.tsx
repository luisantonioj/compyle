// compyle - bottom navigation bar
import React from 'react';
import { TabIcons } from '../Icons';
import type { TabId } from '../../types';
import { getVisibleNavItems, type VisibleTabSettings } from '../../lib/navigation';

interface BottomNavProps {
  tab: TabId;
  onTab: (t: TabId) => void;
  partner: boolean;
  visibleTabs: VisibleTabSettings;
}

export function BottomNav({ tab, onTab, partner, visibleTabs }: BottomNavProps) {
  const tabs = getVisibleNavItems(visibleTabs);

  return (
    <div className={`bottom-nav${partner ? ' partner' : ''}`}>
      <div className="bottom-nav-inner">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button key={t.id} className={`tab${active ? ' active' : ''}`} onClick={() => onTab(t.id)}>
              <div className="tab-dot" />
              {TabIcons[t.id](active)}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
