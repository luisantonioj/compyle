import type { TabId } from '../types';

export const NAV_ITEMS: { id: TabId; label: string }[] = [
  // { id: 'today', label: 'Today' }, // hidden - reserved for future use
  { id: 'cal', label: 'Plan' },
  { id: 'notes', label: 'Notes' },
  { id: 'links', label: 'Links' },
  { id: 'focus', label: 'Focus' },
  { id: 'habits', label: 'Track' },
  { id: 'money', label: 'Money' },
];

export type CustomizableTabId = 'cal' | 'notes' | 'links' | 'focus' | 'habits' | 'money';
export const CUSTOMIZABLE_NAV_ITEMS: { id: CustomizableTabId; label: string }[] = [
  { id: 'cal', label: 'Plan' },
  { id: 'notes', label: 'Notes' },
  { id: 'links', label: 'Links' },
  { id: 'focus', label: 'Focus' },
  { id: 'habits', label: 'Track' },
  { id: 'money', label: 'Money' },
];
export type VisibleTabSettings = Record<CustomizableTabId, boolean>;

export const DEFAULT_VISIBLE_TABS: VisibleTabSettings = {
  cal: true,
  notes: true,
  links: true,
  focus: true,
  habits: true,
  money: true,
};

export function getVisibleNavItems(visibleTabs: VisibleTabSettings) {
  return NAV_ITEMS.filter((item) => visibleTabs[item.id as CustomizableTabId] !== false);
}

export function getFirstVisibleTab(visibleTabs: VisibleTabSettings): TabId {
  return getVisibleNavItems(visibleTabs)[0]?.id ?? 'cal';
}
