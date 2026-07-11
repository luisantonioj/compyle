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
export type NavOrderSettings = CustomizableTabId[];

export const DEFAULT_VISIBLE_TABS: VisibleTabSettings = {
  cal: true,
  notes: true,
  links: true,
  focus: true,
  habits: true,
  money: true,
};

export const DEFAULT_NAV_ORDER: NavOrderSettings = CUSTOMIZABLE_NAV_ITEMS.map((item) => item.id);

export function normalizeNavOrder(saved: unknown): NavOrderSettings {
  if (!Array.isArray(saved)) return DEFAULT_NAV_ORDER;
  const validIds = new Set(DEFAULT_NAV_ORDER);
  const ordered = saved.filter((id): id is CustomizableTabId => typeof id === 'string' && validIds.has(id as CustomizableTabId));
  const missing = DEFAULT_NAV_ORDER.filter((id) => !ordered.includes(id));
  return [...ordered, ...missing];
}

export function getOrderedNavItems(navOrder: NavOrderSettings) {
  const itemMap = new Map(CUSTOMIZABLE_NAV_ITEMS.map((item) => [item.id, item]));
  return normalizeNavOrder(navOrder).map((id) => itemMap.get(id)).filter((item): item is { id: CustomizableTabId; label: string } => !!item);
}

export function getVisibleNavItems(visibleTabs: VisibleTabSettings, navOrder: NavOrderSettings) {
  return getOrderedNavItems(navOrder).filter((item) => visibleTabs[item.id] !== false);
}

export function getFirstVisibleTab(visibleTabs: VisibleTabSettings, navOrder: NavOrderSettings): TabId {
  return getVisibleNavItems(visibleTabs, navOrder)[0]?.id ?? 'cal';
}
