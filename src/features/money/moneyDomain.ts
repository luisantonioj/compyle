import type { BankAccount, Transaction } from '../../types';

export function applyTransactionDelta(
  banks: BankAccount[],
  bankId: string,
  catId: string,
  delta: number,
): BankAccount[] {
  return banks.map((bank) => {
    if (bank.id !== bankId) return bank;
    const categories = (bank.categories ?? []).map((category) =>
      category.id === catId
        ? { ...category, balance: (category.balance ?? 0) + delta }
        : category,
    );

    return {
      ...bank,
      balance: (bank.balance ?? 0) + delta,
      categories,
    };
  });
}

export function applySavedTransaction(
  banks: BankAccount[],
  tx: Transaction,
  existing?: Transaction,
): BankAccount[] {
  let next = banks;
  if (existing?.bank && existing.cat) {
    next = applyTransactionDelta(next, existing.bank, existing.cat, -existing.amt);
  }
  if (tx.bank && tx.cat) {
    next = applyTransactionDelta(next, tx.bank, tx.cat, tx.amt);
  }
  return next;
}

export function applyDeletedTransaction(
  banks: BankAccount[],
  removed?: Transaction,
): BankAccount[] {
  if (!removed?.bank || !removed.cat) return banks;
  return applyTransactionDelta(banks, removed.bank, removed.cat, -removed.amt);
}
