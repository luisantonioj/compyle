// compyle — seed / demo data (used before Firebase is wired up)
import type { UserData, UserProfile, Task, Note } from '../types';

export const TODAY_KEY = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

export const TODAY = new Date();

export const SEED_USER_ME: UserProfile = {
  uid: 'yle',
  displayName: 'yle',
  email: 'yle@compyle.app',
  initial: 'y',
  partnerId: 'luis',
};
export const SEED_USER_PARTNER: UserProfile = {
  uid: 'luis',
  displayName: 'Luis',
  email: 'luis@compyle.app',
  initial: 'L',
  partnerId: 'yle',
};

// Convert old-style 28-day pattern string to completedDates array relative to today
function patternToDates(pattern: string): string[] {
  const parts = pattern.split(',');
  const result: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === 'on') {
      const daysAgo = parts.length - 1 - i;
      const d = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - daysAgo);
      result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
  }
  return result;
}

export const SEED_YLE: UserData = {
  tasks: {
    [TODAY_KEY]: [
      { id: 't1', title: 'Skincare order pickup', emoji: '📌', time: '11:30', done: true },
      { id: 't2', title: 'Lunch with mom', emoji: '⭐', time: '12:30', done: true },
      { id: 't3', title: 'Pay rent (BDO transfer)', emoji: '🔔', time: '14:00', done: false },
      { id: 't4', title: 'Pilates class', emoji: '⭐', time: '17:30', done: false },
      { id: 't5', title: 'Read 20 pages', emoji: '📌', time: null, done: false },
      { id: 't6', title: 'Wash makeup brushes', emoji: '📌', time: null, done: false },
    ],
  },
  habits: [
    { id: 'h1', name: 'Double Cleanse', note: 'AM + PM', repeating: true, completedDates: patternToDates('on,on,on,on,on,on,on,on,on,on,on,on,on,off,on,on,on,on,on,on,on,on,on,on,on,on,on,on') },
    { id: 'h2', name: 'Bath',           note: 'Daily',   repeating: true, completedDates: patternToDates('on,on,on,on,on,on,on,on,on,on,on,on,on,on,on,on,on,on,on,on,on,on,on,on,on,on,on,on') },
    { id: 'h3', name: 'Towel change',   note: 'Every 3 days', repeating: true, completedDates: patternToDates('off,off,on,off,off,on,off,off,on,off,off,on,off,off,on,off,off,on,off,off,on,off,off,on,off,off,on,off') },
    { id: 'h4', name: 'Bed sheet',      note: 'Weekly Sun', repeating: true, completedDates: patternToDates('off,off,off,off,off,off,on,off,off,off,off,off,off,on,off,off,off,off,off,off,on,off,off,off,off,off,off,off') },
    { id: 'h5', name: 'Blanket wash',   note: 'Bi-weekly', repeating: true, completedDates: patternToDates('off,off,off,off,off,off,off,off,off,off,off,off,off,on,off,off,off,off,off,off,off,off,off,off,off,off,on,off') },
    { id: 'h6', name: 'Laundry',        note: 'Wed + Sat', repeating: true, completedDates: patternToDates('off,off,on,off,off,on,off,off,on,off,off,on,off,off,on,off,off,on,off,off,on,off,off,on,off,off,on,off') },
  ],
  banks: [
    { id: 'b1', name: 'BDO Savings', balance: 84320.50, color: '#1b3a6e', last4: '2891', categories: [
      { id: 'c1a', name: 'Emergency fund',  balance: 50000,   color: '#4a5c3f' },
      { id: 'c1b', name: 'Anniversary trip', balance: 18000, color: '#8f1d2b' },
      { id: 'c1c', name: 'Open',            balance: 16320.50, color: '#5a544a' },
    ]},
    { id: 'b2', name: 'GCash', balance: 8420.25, color: '#0066cc', last4: '4412', categories: [
      { id: 'c2a', name: 'Groceries',      balance: 2760,   color: '#8f1d2b' },
      { id: 'c2b', name: 'Coffee runs',    balance: 680,    color: '#9a6f48' },
      { id: 'c2c', name: 'Skincare',       balance: 880,    color: '#c04059' },
      { id: 'c2d', name: 'Subscriptions',  balance: 301,    color: '#5e131c' },
      { id: 'c2e', name: 'Open',           balance: 3799.25, color: '#5a544a' },
    ]},
    { id: 'b3', name: 'Maya', balance: 12100.00, color: '#00d68f', last4: '0931', categories: [
      { id: 'c3a', name: 'Splurge fund', balance: 4500, color: '#c04059' },
      { id: 'c3b', name: 'Transport',    balance: 2260, color: '#4a5c3f' },
      { id: 'c3c', name: 'Open',         balance: 5340, color: '#5a544a' },
    ]},
  ],
  transactions: [
    { id: 'tx1', bank: 'b2', cat: 'c2c', label: 'Sephora — toner refill', amt: -1240, date: TODAY_KEY, time: '11:32' },
    { id: 'tx2', bank: 'b2', cat: 'c2b', label: 'Tim Hortons',            amt: -185,  date: TODAY_KEY, time: '08:14' },
    { id: 'tx3', bank: 'b2', cat: 'c2a', label: 'S&R weekly haul',        amt: -2840, date: TODAY_KEY, time: '18:02' },
    { id: 'tx4', bank: 'b1', cat: 'c1c', label: 'Allowance from mom 💌',  amt: 5000,  date: TODAY_KEY, time: '09:00' },
    { id: 'tx5', bank: 'b3', cat: 'c3b', label: 'Grab — pilates',         amt: -240,  date: TODAY_KEY, time: '17:10' },
    { id: 'tx6', bank: 'b2', cat: 'c2d', label: 'Spotify Family',         amt: -194,  date: TODAY_KEY, time: '00:00' },
    { id: 'tx7', bank: 'b1', cat: 'c1c', label: 'Payday — May 15',        amt: 28000, date: TODAY_KEY, time: '09:00' },
    { id: 'tx8', bank: 'b3', cat: 'c3a', label: 'Birkin coin jar',        amt: 1500,  date: TODAY_KEY, time: '20:14' },
  ],
  bills: [
    { id: 'p1', name: 'Rent',           amount: 18500, due: 5,  status: 'paid' },
    { id: 'p2', name: 'Globe Fiber',    amount: 2499,  due: 12, status: 'paid' },
    { id: 'p3', name: 'Meralco',        amount: 3420,  due: 25, status: 'due' },
    { id: 'p4', name: 'Maynilad',       amount: 680,   due: 28, status: 'due' },
    { id: 'p5', name: 'Spotify Family', amount: 194,   due: 18, status: 'paid' },
  ],
  debts: [
    { id: 'd1', name: 'SPayLater — iPhone case',  total: 1899, paid: 1266, due: '2026-06-12', months: 3, paidMonths: 2 },
    { id: 'd2', name: 'TikTok PL — winter coat',  total: 4200, paid: 1050, due: '2026-06-04', months: 4, paidMonths: 1 },
    { id: 'd3', name: 'Tita Bea — loan',          total: 8000, paid: 3000, due: '2026-07-15', months: 0, paidMonths: 0 },
  ],
  privacy: { cal: true, notes: true, links: true, habits: true, money: true },
  linkCategories: [
    { id: 'ylc1', name: 'School', color: '#8f1d2b', sort_order: 0 },
    { id: 'ylc2', name: 'Socials', color: '#5e131c', sort_order: 1 },
  ],
  links: [
    { id: 'yli1', categoryId: 'ylc1', title: 'DLSL Portal', url: 'https://dlsl.edu.ph' },
    { id: 'yli2', categoryId: 'ylc1', title: 'Canvas LMS', url: 'https://canvas.instructure.com' },
    { id: 'yli3', categoryId: 'ylc2', title: 'Instagram', url: 'https://instagram.com' },
  ],
  notes: [
    {
      id: 'yn1',
      title: 'Anniversary ideas',
      content: JSON.stringify({ type: 'doc', content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Dinner at Mecha Uma — make a reservation early' }] },
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Book the restaurant' }] }] },
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Order flowers' }] }] },
          { type: 'taskItem', attrs: { checked: true },  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Pick out outfit' }] }] },
        ]},
      ] as unknown as Note[] }),
      updated_at: Date.now() - 7_200_000,
    },
    {
      id: 'yn2',
      title: 'Grocery list',
      content: JSON.stringify({ type: 'doc', content: [
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Eggs' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Oat milk' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Greek yogurt' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Baby spinach' }] }] },
        ]},
      ] as unknown as Note[] }),
      updated_at: Date.now() - 86_400_000,
    },
  ],
};

export const SEED_LUIS: UserData = {
  tasks: {
    [TODAY_KEY]: [
      { id: 'lt1', title: "Code review for Maya app", emoji: '🔔', time: '10:00', done: true },
      { id: 'lt2', title: 'Gym — push day',           emoji: '⭐', time: '06:30', done: true },
      { id: 'lt3', title: "Order yle's gift",         emoji: '📌', time: '15:00', done: false },
      { id: 'lt4', title: 'Standup notes',            emoji: '📌', time: null,    done: false },
    ],
  },
  habits: [
    { id: 'lh1', name: 'Morning workout',     note: '6:30 AM',   repeating: true, completedDates: patternToDates('on,on,on,off,on,on,on,on,on,off,on,on,on,on,on,on,off,on,on,on,on,on,on,on,off,on,on,on') },
    { id: 'lh2', name: 'Protein shake',       note: 'After gym', repeating: true, completedDates: patternToDates('on,on,on,off,on,on,on,on,on,off,on,on,on,on,on,on,off,on,on,on,on,on,on,on,off,on,on,on') },
    { id: 'lh3', name: 'Read 30 min',         note: 'Evening',   repeating: true, completedDates: patternToDates('on,on,off,on,on,on,off,on,on,off,on,on,off,on,on,on,off,on,on,off,on,on,on,on,off,on,on,off') },
    { id: 'lh4', name: 'No phone before bed', note: '11pm',      repeating: true, completedDates: patternToDates('off,on,off,off,on,off,off,on,off,off,on,off,off,on,off,off,on,off,off,on,off,off,on,off,off,on,on,off') },
  ],
  banks: [
    { id: 'lb1', name: 'Security Bank', balance: 142800.00, color: '#0a3d62', last4: '7723', categories: [
      { id: 'lc1a', name: 'Emergency',       balance: 100000, color: '#4a5c3f' },
      { id: 'lc1b', name: 'Wedding fund 💍', balance: 30000,  color: '#c04059' },
      { id: 'lc1c', name: 'Open',            balance: 12800,  color: '#5a544a' },
    ]},
    { id: 'lb2', name: 'GCash', balance: 4280.00, color: '#0066cc', last4: '8819', categories: [
      { id: 'lc2a', name: 'Food',        balance: 1800, color: '#8f1d2b' },
      { id: 'lc2b', name: 'Gym',         balance: 800,  color: '#4a5c3f' },
      { id: 'lc2c', name: 'Date nights', balance: 1200, color: '#c04059' },
      { id: 'lc2d', name: 'Open',        balance: 480,  color: '#5a544a' },
    ]},
  ],
  transactions: [
    { id: 'ltx1', bank: 'lb2', cat: 'lc2c', label: 'Reservation — Mecha Uma', amt: -2200, date: TODAY_KEY, time: '15:04' },
    { id: 'ltx2', bank: 'lb2', cat: 'lc2a', label: 'Mang Inasal',             amt: -240,  date: TODAY_KEY, time: '12:30' },
    { id: 'ltx3', bank: 'lb1', cat: 'lc1c', label: 'Payday — May 15',          amt: 65000, date: TODAY_KEY, time: '09:00' },
  ],
  bills: [
    { id: 'lp1', name: 'Condo dues',          amount: 8500, due: 5,  status: 'paid' },
    { id: 'lp2', name: 'PLDT Fiber',          amount: 1999, due: 14, status: 'paid' },
    { id: 'lp3', name: 'Gym (Anytime Fitness)', amount: 1799, due: 20, status: 'due' },
  ],
  debts: [
    { id: 'ld1', name: 'Home Credit — laptop', total: 65000, paid: 26000, due: '2026-09-15', months: 12, paidMonths: 4 },
  ],
  privacy: { cal: true, notes: true, links: true, habits: true, money: true },
  linkCategories: [
    { id: 'llc1', name: 'Work', color: '#3d6480', sort_order: 0 },
    { id: 'llc2', name: 'Resources', color: '#4a5c3f', sort_order: 1 },
  ],
  links: [
    { id: 'lli1', categoryId: 'llc1', title: 'GitHub', url: 'https://github.com' },
    { id: 'lli2', categoryId: 'llc1', title: 'Linear', url: 'https://linear.app' },
    { id: 'lli3', categoryId: 'llc2', title: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
  ],
  notes: [],
};

export const EMPTY_DATA: UserData = {
  tasks: {},
  habits: [],
  banks: [],
  transactions: [],
  bills: [],
  debts: [],
  privacy: { cal: true, notes: true, links: true, habits: true, money: true },
  linkCategories: [],
  links: [],
  notes: [],
};

// ─── helpers ───

export function formatPHP(n: number, opts: { short?: boolean; cents?: boolean } = {}): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (opts.short && abs >= 1000) {
    return sign + '₱' + (abs / 1000).toFixed(abs >= 10000 ? 1 : 2) + 'k';
  }
  return sign + '₱' + abs.toLocaleString('en-PH', {
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  });
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseKey(k: string): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export interface MonthCell {
  d: number;
  dateKey?: string;
  other?: boolean;
  key: string;
}

export function buildMonthCells(year: number, month: number): MonthCell[] {
  const dim = new Date(year, month + 1, 0).getDate();
  const first = new Date(year, month, 1).getDay();
  const cells: MonthCell[] = [];
  const prevDim = new Date(year, month, 0).getDate();
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonth = month === 0 ? 11 : month - 1;
  const nextYear = month === 11 ? year + 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  for (let i = first - 1; i >= 0; i--) {
    const day = prevDim - i;
    const dk = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({ d: day, other: true, dateKey: dk, key: 'p' + i });
  }
  for (let d = 1; d <= dim; d++) {
    const dk = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ d, dateKey: dk, key: 'd' + d });
  }
  let trail = 1;
  while (cells.length % 7 !== 0) {
    const dk = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(trail).padStart(2, '0')}`;
    cells.push({ d: trail++, other: true, dateKey: dk, key: 'n' + cells.length });
  }
  return cells;
}

export interface HabitCell {
  d?: number;
  dateKey?: string; // "YYYY-MM-DD" — used for click-to-toggle
  on?: boolean;
  in?: boolean;
  today?: boolean;
  blank?: boolean;
  start?: boolean;
  beforeStart?: boolean;
  streak?: boolean;
  key: string;
}

export function computeStreak(completedDates: string[]): number {
  let count = 0;
  const t = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
  for (let i = 0; ; i++) {
    const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() - i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (completedDates.includes(k)) count++;
    else break;
  }
  return count;
}

export interface TaskInstance extends Task {
  _virtual?: boolean;
  _originKey?: string;
}

export function occursOn(
  recurrence: string, originKey: string, targetKey: string, endKey?: string | null
): boolean {
  if (targetKey <= originKey) return false;
  if (endKey && targetKey > endKey) return false;
  const origin = parseKey(originKey);
  const target = parseKey(targetKey);
  const diff = Math.round((target.getTime() - origin.getTime()) / 86_400_000);
  switch (recurrence) {
    case 'daily':   return diff > 0;
    case 'weekly':  return diff > 0 && diff % 7 === 0;
    case 'monthly': return target.getDate() === origin.getDate();
    case 'yearly':  return target.getDate() === origin.getDate() && target.getMonth() === origin.getMonth();
    default:        return false;
  }
}

export function getTaskInstances(allTasks: Record<string, Task[]>, targetKey: string): TaskInstance[] {
  const direct: TaskInstance[] = (allTasks[targetKey] ?? []).map((t) => ({ ...t }));
  const recurring: TaskInstance[] = [];
  for (const [originKey, tasks] of Object.entries(allTasks)) {
    if (originKey === targetKey) continue;
    for (const task of tasks) {
      if (task.recurrence && occursOn(task.recurrence, originKey, targetKey, task.recurrenceEnd)) {
        recurring.push({ ...task, done: false, _virtual: true, _originKey: originKey });
      }
    }
  }
  return [...direct, ...recurring];
}

export function buildHabitMonth(year: number, month: number, completedDates: string[], startDate?: string): HabitCell[] {
  const dim = new Date(year, month + 1, 0).getDate();
  const first = new Date(year, month, 1).getDay();
  const cells: HabitCell[] = [];
  const todayNorm = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());

  // Build streak set — consecutive completed days ending at today going backwards
  const streakKeys = new Set<string>();
  for (let i = 0; ; i++) {
    const d = new Date(todayNorm.getFullYear(), todayNorm.getMonth(), todayNorm.getDate() - i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (completedDates.includes(k)) streakKeys.add(k);
    else break;
  }

  let startNorm: Date | null = null;
  if (startDate) {
    const [sy, sm, sd] = startDate.split('-').map(Number);
    startNorm = new Date(sy, sm - 1, sd);
  }

  for (let i = 0; i < first; i++) cells.push({ blank: true, key: 'b' + i });
  for (let d = 1; d <= dim; d++) {
    const thisDate = new Date(year, month, d);
    const dk = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const diff = Math.round((todayNorm.getTime() - thisDate.getTime()) / (1000 * 60 * 60 * 24));

    const beforeStart = startNorm ? thisDate < startNorm : false;
    const isStart = startNorm ? thisDate.getTime() === startNorm.getTime() : false;
    const isOn = completedDates.includes(dk);
    const isInWindow = !beforeStart;

    cells.push({
      d,
      dateKey: dk,
      on: isOn,
      in: isInWindow,
      today: diff === 0,
      start: isStart,
      beforeStart,
      streak: isOn && streakKeys.has(dk),
      key: 'd' + d,
    });
  }
  return cells;
}
