import { deleteDoc, setDoc, writeBatch } from 'firebase/firestore';
import { userDoc } from '../../services/firebase/client';
import type { BankAccount, Bill, Category, Debt, Transaction } from '../../types';
import { db } from '../../lib/firebase';
import { trackFirestoreWrite } from '../../services/firebase/syncTracker';

export const upsertBank = (uid: string, bank: BankAccount) =>
  trackFirestoreWrite(setDoc(userDoc(uid, 'bank_accounts', bank.id), bank));

export const removeBank = (uid: string, id: string) =>
  trackFirestoreWrite(deleteDoc(userDoc(uid, 'bank_accounts', id)));

export async function upsertBanksBatch(uid: string, banks: BankAccount[]): Promise<void> {
  const batch = writeBatch(db!);
  banks.forEach((bank) => batch.set(userDoc(uid, 'bank_accounts', bank.id), bank));
  await trackFirestoreWrite(batch.commit());
}

export const upsertTx = (uid: string, tx: Transaction) =>
  trackFirestoreWrite(setDoc(userDoc(uid, 'transactions', tx.id), tx));

export const removeTx = (uid: string, id: string) =>
  trackFirestoreWrite(deleteDoc(userDoc(uid, 'transactions', id)));

export async function saveTxWithBanksBatch(
  uid: string,
  tx: Transaction,
  banks: BankAccount[],
): Promise<void> {
  const batch = writeBatch(db!);
  batch.set(userDoc(uid, 'transactions', tx.id), tx);
  banks.forEach((bank) => batch.set(userDoc(uid, 'bank_accounts', bank.id), bank));
  await trackFirestoreWrite(batch.commit());
}

export async function removeTxWithBanksBatch(
  uid: string,
  txId: string,
  banks: BankAccount[],
): Promise<void> {
  const batch = writeBatch(db!);
  batch.delete(userDoc(uid, 'transactions', txId));
  banks.forEach((bank) => batch.set(userDoc(uid, 'bank_accounts', bank.id), bank));
  await trackFirestoreWrite(batch.commit());
}

export const upsertBill = (uid: string, bill: Bill) =>
  trackFirestoreWrite(setDoc(userDoc(uid, 'recurring_payments', bill.id), bill));

export const removeBill = (uid: string, id: string) =>
  trackFirestoreWrite(deleteDoc(userDoc(uid, 'recurring_payments', id)));

export const upsertDebt = (uid: string, debt: Debt) =>
  trackFirestoreWrite(setDoc(userDoc(uid, 'pending_payments', debt.id), debt));

export const removeDebt = (uid: string, id: string) =>
  trackFirestoreWrite(deleteDoc(userDoc(uid, 'pending_payments', id)));

export function normalizeBankDoc(data: Record<string, unknown>): BankAccount | null {
  if (typeof data.id !== 'string' || typeof data.name !== 'string') return null;
  return {
    id: data.id,
    name: data.name,
    balance: asNumber(data.balance),
    color: typeof data.color === 'string' ? data.color : '#8f1d2b',
    last4: typeof data.last4 === 'string' ? data.last4 : '0000',
    categories: Array.isArray(data.categories) ? data.categories.map(normalizeCategory).filter(Boolean) as Category[] : [],
  };
}

export function normalizeTransactionDoc(data: Record<string, unknown>): Transaction | null {
  if (typeof data.id !== 'string') return null;
  return {
    id: data.id,
    bank: typeof data.bank === 'string' ? data.bank : '',
    cat: typeof data.cat === 'string' ? data.cat : '',
    label: typeof data.label === 'string' ? data.label : '',
    amt: asNumber(data.amt),
    date: typeof data.date === 'string' ? data.date : '',
    time: typeof data.time === 'string' ? data.time : '',
  };
}

export function normalizeBillDoc(data: Record<string, unknown>): Bill | null {
  if (typeof data.id !== 'string' || typeof data.name !== 'string') return null;
  return {
    id: data.id,
    name: data.name,
    amount: asNumber(data.amount),
    due: asNumber(data.due),
    status: data.status === 'paid' || data.status === 'overdue' ? data.status : 'due',
    frequency: data.frequency === 'weekly' || data.frequency === 'monthly' ? data.frequency : undefined,
    last_paid_at: typeof data.last_paid_at === 'number' ? data.last_paid_at : null,
  };
}

export function normalizeDebtDoc(data: Record<string, unknown>): Debt | null {
  if (typeof data.id !== 'string' || typeof data.name !== 'string') return null;
  return {
    id: data.id,
    name: data.name,
    total: asNumber(data.total),
    paid: asNumber(data.paid),
    due: typeof data.due === 'string' ? data.due : '',
    months: asNumber(data.months),
    paidMonths: asNumber(data.paidMonths),
    is_archived: typeof data.is_archived === 'boolean' ? data.is_archived : undefined,
  };
}

function normalizeCategory(data: unknown): Category | null {
  if (!data || typeof data !== 'object') return null;
  const raw = data as Record<string, unknown>;
  if (typeof raw.id !== 'string' || typeof raw.name !== 'string') return null;
  return {
    id: raw.id,
    name: raw.name,
    color: typeof raw.color === 'string' ? raw.color : '#8f1d2b',
    balance: asNumber(raw.balance),
    budget_limit: typeof raw.budget_limit === 'number' ? raw.budget_limit : undefined,
  };
}

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

