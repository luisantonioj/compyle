// compyle — shared TypeScript types

export interface Task {
  id: string;
  title: string;
  emoji: string;
  time: string | null;
  done: boolean;
  recurrence?: 'daily' | 'weekly' | string | null;
  reminder_time?: string | null;
  created_at?: number;
}

export interface Habit {
  id: string;
  name: string;
  note: string;
  streak: number;
  doneToday: boolean;
  pattern: string; // comma-separated "on"/"off" for last 28 days
  sort_order?: number;
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
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  partnerId?: string | null;
  initial?: string;
}

export type TabId = 'today' | 'cal' | 'habits' | 'money';
export type ViewMode = 'me' | 'partner';

export type EditingState =
  | { type: 'task'; item?: Task; dateKey?: string }
  | { type: 'habit'; item?: Habit }
  | { type: 'tx'; item?: Transaction }
  | { type: 'account'; item?: BankAccount }
  | { type: 'category'; item?: Category & { bankId?: string } }
  | { type: 'bill'; item?: Bill }
  | { type: 'debt'; item?: Debt }
  | null;
