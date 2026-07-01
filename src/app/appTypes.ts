import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import type {
  BankAccount,
  Bill,
  Category,
  Debt,
  EditingState,
  Habit,
  HabitCategory,
  LinkCategory,
  LinkItem,
  Note,
  PrivacySettings,
  TabId,
  Task,
  TaskType,
  Transaction,
  UserData,
  ViewMode,
} from '../types';

export interface ConfirmState {
  title: string;
  message: string;
  onConfirm: () => void;
}

export interface ToastState {
  message: string;
  action?: string;
  onAction?: () => void;
}

export type SetEditing = (editing: EditingState) => void;
export type ConfirmDelete = (label: string, action: () => void) => void;

export interface TaskHandlers {
  reorderTasks: (dateKey: string, reorderedTasks: Task[]) => void;
  moveTask: (taskId: string, sourceDate: string, destDate: string, newIndex: number) => void;
  saveTask: (task: Task, dateKey: string) => void;
  saveTaskType: (taskType: TaskType) => void;
  deleteTask: (taskId: string, dateKey: string) => void;
  checkTask: (taskId: string, dateKey?: string) => void;
}

export interface HabitHandlers {
  saveHabit: (habit: Habit) => void;
  saveHabitCategory: (category: HabitCategory) => void;
  deleteHabit: (id: string) => void;
  archiveHabit: (habit: Habit) => void;
  restoreHabit: (habit: Habit) => void;
  toggleTrackerDate: (habitId: string, dateKey: string) => void;
}

export interface MoneyHandlers {
  saveTx: (tx: Transaction) => void;
  deleteTx: (id: string) => void;
  saveAccount: (account: BankAccount) => void;
  deleteAccount: (id: string) => void;
  saveCategory: (category: Category & { bankId?: string }) => void;
  deleteCategory: (id: string) => void;
  saveBill: (bill: Bill) => void;
  deleteBill: (id: string) => void;
  toggleBillPaid: (id: string) => void;
  saveDebt: (debt: Debt) => void;
  deleteDebt: (id: string) => void;
  recordDebtPayment: (id: string) => void;
}

export interface LinkHandlers {
  reorderLinkCategories: (categories: LinkCategory[]) => void;
  saveLinkCategory: (category: LinkCategory) => void;
  deleteLinkCategory: (id: string) => void;
  archiveLinkCategory: (category: LinkCategory) => void;
  restoreLinkCategory: (category: LinkCategory) => void;
  reorderLinks: (links: LinkItem[]) => void;
  saveLink: (link: LinkItem) => void;
  deleteLink: (id: string) => void;
  archiveLink: (link: LinkItem) => void;
  restoreLink: (link: LinkItem) => void;
}

export interface NoteHandlers {
  reorderNotes: (notes: Note[]) => void;
  updateNoteContent: (note: Note) => void;
  saveNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  archiveNote: (note: Note) => void;
  restoreNote: (note: Note) => void;
}

export interface ProfileHandlers {
  handleSignOut: () => Promise<void>;
  handleEnableNotifications: () => Promise<void>;
  togglePrivacy: (key: keyof PrivacySettings) => void;
  createPartnerInvite?: () => Promise<string>;
  acceptPartnerInvite?: (code: string) => Promise<void>;
  unlinkCurrentPartner?: () => Promise<void>;
}

export interface LayoutBaseProps {
  data: UserData;
  tab: TabId;
  viewMode: ViewMode;
  isPartner: boolean;
  partnerName: string;
  profileInitial: string;
  overlays: ReactNode;
  taskHandlers: TaskHandlers;
  habitHandlers: HabitHandlers;
  moneyHandlers: MoneyHandlers;
  linkHandlers: LinkHandlers;
  noteHandlers: NoteHandlers;
}

export interface OverlayProps {
  user: User | null;
  data: UserData;
  viewMode: ViewMode;
  profileOpen: boolean;
  editing: EditingState;
  confirm: ConfirmState | null;
  confettiTrigger: number;
  crown: boolean;
  pushEnabled: boolean;
  partnerName: string;
  confirmDelete: ConfirmDelete;
  taskHandlers: TaskHandlers;
  habitHandlers: HabitHandlers;
  moneyHandlers: MoneyHandlers;
  linkHandlers: LinkHandlers;
  noteHandlers: NoteHandlers;
  profileHandlers: ProfileHandlers;
}

