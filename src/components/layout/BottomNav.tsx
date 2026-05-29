// compyle — bottom navigation bar
import React from 'react';
import { TabIcons } from '../Icons';
import type { TabId } from '../../types';

interface BottomNavProps {
  tab: TabId;
  onTab: (t: TabId) => void;
  partner: boolean;
}

const TABS: { id: TabId; label: string }[] = [
  // { id: 'today', label: 'Today' }, // hidden — reserved for future use
  { id: 'cal', label: 'Plan' },
  { id: 'notes', label: 'Notes' },
  { id: 'links', label: 'Links' },
  { id: 'habits', label: 'Track' },
  { id: 'money', label: 'Money' },
];

export function BottomNav({ tab, onTab, partner }: BottomNavProps) {
  return (
    <div className={`bottom-nav${partner ? ' partner' : ''}`}>
      <div className="bottom-nav-inner">
        {TABS.map((t) => {
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
