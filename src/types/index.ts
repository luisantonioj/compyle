// compyle — shared TypeScript types

export interface Task {
  id: string;
  title: string;
  emoji: string;
  description?: string;
  time: string | null;
  done: boolean;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  recurrenceEnd?: string | null; // "YYYY-MM-DD" — stop expanding after this date
  reminder_time?: string | null;
  created_at?: number;
}

export interface Habit {
  id: string;
  name: string;
  note: string;
  freqType?: 'days' | 'time';
  startDate?: string; // "YYYY-MM-DD"
  completedDates: string[]; // "YYYY-MM-DD" — each day this tracker was ticked
  repeating: boolean; // false = no-repetition / one-time tracker
  sort_order?: number;
  archived?: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  balance: number;
  budget_limit?: number;
}

export interface BankAccount {
  id: string;
  name: string;
  balance: number;
  color: string;
  last4: string;
  categories?: Category[];
}

export interface Transaction {
  id: string;
  bank: string;
  cat: string;
  label: string;
  amt: number;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  due: number; // day of month
  status: 'paid' | 'due' | 'overdue';
  frequency?: 'monthly' | 'weekly';
  last_paid_at?: number | null;
}

export interface Debt {
  id: string;
  name: string;
  total: number;
  paid: number;
  due: string; // "YYYY-MM-DD"
  months: number;
  paidMonths: number;
  is_archived?: boolean;
}

export interface LinkCategory {
  id: string;
  name: string;
  color: string;
  sort_order?: number;
  archived?: boolean;
}

export interface LinkItem {
  id: string;
  categoryId: string;
  title: string;
  url: string;
  description?: string;
  sort_order?: number;
  archived?: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;   // Tiptap JSON stringified
  updated_at: number; // Unix ms
  sort_order?: number;
  archived?: boolean;
}

export interface PrivacySettings {
  tasks: boolean;
  habits: boolean;
  budget: boolean;
  payments: boolean;
  reminders: boolean;
}

export interface UserData {
  tasks: Record<string, Task[]>;
  habits: Habit[];
  banks: BankAccount[];
  transactions: Transaction[];
  bills: Bill[];
  debts: Debt[];
  privacy: PrivacySettings;
  linkCategories: LinkCategory[];
  links: LinkItem[];
  notes: Note[];
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  partnerId?: string | null;
  initial?: string;
}

export type TabId = 'today' | 'cal' | 'habits' | 'money' | 'links' | 'notes';
export type ViewMode = 'me' | 'partner';

export type EditingState =
  | { type: 'task'; item?: Task; dateKey?: string }
  | { type: 'task-view'; item: Task; dateKey: string }
  | { type: 'habit'; item?: Habit }
  | { type: 'tx'; item?: Transaction }
  | { type: 'account'; item?: BankAccount }
  | { type: 'category'; item?: Category & { bankId?: string } }
  | { type: 'bill'; item?: Bill }
  | { type: 'debt'; item?: Debt }
  | { type: 'link-category'; item?: LinkCategory }
  | { type: 'link-item'; item?: LinkItem; categoryId?: string }
  | { type: 'note'; item?: Note }
  | null;
