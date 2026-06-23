import { useAppStore } from '../../store/appStore';
import {
  removeBank,
  removeBill,
  removeDebt,
  removeTxWithBanksBatch,
  saveTxWithBanksBatch,
  upsertBank,
  upsertBanksBatch,
  upsertBill,
  upsertDebt,
} from '../../lib/db';
import type { DataSetter } from '../actionTypes';
import type { BankAccount, Bill, Category, Debt, Transaction, UserData } from '../../types';

interface MoneyActionOptions {
  data: UserData;
  fs: boolean;
  activeUid: string;
  setActiveData: DataSetter;
  onComplete: (probability?: number) => void;
}

const applyTx = (banks: BankAccount[], bankId: string, catId: string, delta: number): BankAccount[] =>
  banks.map((b) => {
    if (b.id !== bankId) return b;
    const cats = (b.categories ?? []).map((c) =>
      c.id === catId ? { ...c, balance: (c.balance ?? 0) + delta } : c,
    );
    return { ...b, balance: (b.balance ?? 0) + delta, categories: cats };
  });

export function useMoneyActions({ data, fs, activeUid, setActiveData, onComplete }: MoneyActionOptions) {
  const store = useAppStore();

  const saveTx = (tx: Transaction) => {
    if (fs) {
      const existed = data.transactions.find((t) => t.id === tx.id);
      let banks = data.banks;
      if (existed) {
        if (existed.bank && existed.cat) banks = applyTx(banks, existed.bank, existed.cat, -existed.amt);
        if (tx.bank && tx.cat) banks = applyTx(banks, tx.bank, tx.cat, tx.amt);
      } else if (tx.bank && tx.cat) {
        banks = applyTx(banks, tx.bank, tx.cat, tx.amt);
      }
      const affectedIds = new Set([tx.bank, existed?.bank].filter(Boolean) as string[]);
      const affectedBanks = banks.filter((b) => affectedIds.has(b.id));
      void saveTxWithBanksBatch(activeUid, tx, affectedBanks);
    } else {
      setActiveData((d) => {
        const existed = d.transactions.find((t) => t.id === tx.id);
        let banks = d.banks;
        if (existed) {
          if (existed.bank && existed.cat) banks = applyTx(banks, existed.bank, existed.cat, -existed.amt);
          if (tx.bank && tx.cat) banks = applyTx(banks, tx.bank, tx.cat, tx.amt);
          return { ...d, transactions: d.transactions.map((t) => (t.id === tx.id ? tx : t)), banks };
        }
        if (tx.bank && tx.cat) banks = applyTx(banks, tx.bank, tx.cat, tx.amt);
        return { ...d, transactions: [tx, ...d.transactions], banks };
      });
    }
    store.setEditing(null);
    store.flash(store.editing && 'item' in store.editing && store.editing.item ? 'Updated' : tx.amt > 0 ? 'Money in' : 'Logged');
  };

  const deleteTx = (id: string) => {
    const removed = data.transactions.find((t) => t.id === id);
    store.setEditing(null);
    if (fs) {
      let banks = data.banks;
      if (removed?.bank && removed?.cat) banks = applyTx(banks, removed.bank, removed.cat, -removed.amt);
      const affectedBanks = removed?.bank ? banks.filter((b) => b.id === removed.bank) : [];
      void removeTxWithBanksBatch(activeUid, id, affectedBanks);
    } else {
      setActiveData((d) => {
        const rem = d.transactions.find((t) => t.id === id);
        let banks = d.banks;
        if (rem?.bank && rem?.cat) banks = applyTx(banks, rem.bank, rem.cat, -rem.amt);
        return { ...d, transactions: d.transactions.filter((t) => t.id !== id), banks };
      });
    }
    store.flash('Removed', 'Undo', () => {
      if (removed) saveTx(removed);
      store.setToast(null);
    });
  };

  const saveAccount = (acct: BankAccount) => {
    if (fs) {
      void upsertBank(activeUid, acct);
    } else {
      setActiveData((d) => {
        const existed = d.banks.find((b) => b.id === acct.id);
        const banks = existed ? d.banks.map((b) => (b.id === acct.id ? acct : b)) : [...d.banks, acct];
        return { ...d, banks };
      });
    }
    store.setEditing(null);
    store.flash(store.editing && 'item' in store.editing && store.editing.item ? 'Account updated' : 'Account added');
  };

  const deleteAccount = (id: string) => {
    const removed = data.banks.find((b) => b.id === id);
    store.setEditing(null);
    if (fs) {
      void removeBank(activeUid, id);
    } else {
      setActiveData((d) => ({ ...d, banks: d.banks.filter((b) => b.id !== id) }));
    }
    store.flash('Account removed', 'Undo', () => {
      if (removed) saveAccount(removed);
      store.setToast(null);
    });
  };

  const saveCategory = (cat: Category & { bankId?: string }) => {
    const { bankId, ...rest } = cat;
    if (fs) {
      let banks = data.banks.map((b) => {
        if ((b.categories ?? []).some((c) => c.id === cat.id)) {
          return { ...b, categories: (b.categories ?? []).filter((c) => c.id !== cat.id) };
        }
        return b;
      });
      if (bankId) {
        banks = banks.map((b) =>
          b.id === bankId ? { ...b, categories: [...(b.categories ?? []), rest] } : b,
        );
      }
      void upsertBanksBatch(activeUid, banks);
    } else {
      setActiveData((d) => {
        let banks = d.banks.map((b) => {
          if ((b.categories ?? []).some((c) => c.id === cat.id)) {
            return { ...b, categories: (b.categories ?? []).filter((c) => c.id !== cat.id) };
          }
          return b;
        });
        if (bankId) {
          banks = banks.map((b) =>
            b.id === bankId ? { ...b, categories: [...(b.categories ?? []), rest] } : b,
          );
        }
        return { ...d, banks };
      });
    }
    store.setEditing(null);
    store.flash(store.editing && 'item' in store.editing && store.editing.item ? 'Category updated' : 'Category added');
  };

  const deleteCategory = (id: string) => {
    let removed: Category | undefined;
    let removedBankId: string | undefined;
    data.banks.forEach((b) => {
      const found = (b.categories ?? []).find((c) => c.id === id);
      if (found) {
        removed = found;
        removedBankId = b.id;
      }
    });
    store.setEditing(null);
    if (fs) {
      const banks = data.banks.map((b) => ({
        ...b,
        categories: (b.categories ?? []).filter((c) => c.id !== id),
      }));
      void upsertBanksBatch(activeUid, banks);
    } else {
      setActiveData((d) => ({
        ...d,
        banks: d.banks.map((b) => ({
          ...b,
          categories: (b.categories ?? []).filter((c) => c.id !== id),
        })),
      }));
    }
    store.flash('Category removed', 'Undo', () => {
      if (removed) saveCategory({ ...removed, bankId: removedBankId });
      store.setToast(null);
    });
  };

  const saveBill = (b: Bill) => {
    if (fs) {
      void upsertBill(activeUid, b);
    } else {
      setActiveData((d) => {
        const existed = d.bills.find((x) => x.id === b.id);
        return { ...d, bills: existed ? d.bills.map((x) => (x.id === b.id ? b : x)) : [...d.bills, b] };
      });
    }
    store.setEditing(null);
    store.flash(store.editing && 'item' in store.editing && store.editing.item ? 'Bill updated' : 'Bill added');
  };

  const deleteBill = (id: string) => {
    const removed = data.bills.find((b) => b.id === id);
    store.setEditing(null);
    if (fs) {
      void removeBill(activeUid, id);
    } else {
      setActiveData((d) => ({ ...d, bills: d.bills.filter((b) => b.id !== id) }));
    }
    store.flash('Bill removed', 'Undo', () => {
      if (removed) saveBill(removed);
      store.setToast(null);
    });
  };

  const toggleBillPaid = (id: string) => {
    if (fs) {
      const bill = data.bills.find((b) => b.id === id);
      if (!bill) return;
      const next = bill.status === 'paid' ? 'due' : 'paid';
      if (next === 'paid') onComplete(0.6);
      void upsertBill(activeUid, { ...bill, status: next });
    } else {
      setActiveData((d) => {
        const bills = d.bills.map((b) => {
          if (b.id !== id) return b;
          const next = b.status === 'paid' ? 'due' : 'paid';
          if (next === 'paid') onComplete(0.6);
          return { ...b, status: next } as Bill;
        });
        return { ...d, bills };
      });
    }
  };

  const saveDebt = (debt: Debt) => {
    if (fs) {
      void upsertDebt(activeUid, debt);
    } else {
      setActiveData((d) => {
        const existed = d.debts.find((x) => x.id === debt.id);
        const debts = existed ? d.debts.map((x) => (x.id === debt.id ? debt : x)) : [...d.debts, debt];
        return { ...d, debts };
      });
    }
    store.setEditing(null);
    store.flash(store.editing && 'item' in store.editing && store.editing.item ? 'Debt updated' : 'Tracking');
  };

  const deleteDebt = (id: string) => {
    const removed = data.debts.find((b) => b.id === id);
    store.setEditing(null);
    if (fs) {
      void removeDebt(activeUid, id);
    } else {
      setActiveData((d) => ({ ...d, debts: d.debts.filter((b) => b.id !== id) }));
    }
    store.flash('Debt removed', 'Undo', () => {
      if (removed) saveDebt(removed);
      store.setToast(null);
    });
  };

  const recordDebtPayment = (id: string) => {
    if (fs) {
      const debt = data.debts.find((d) => d.id === id);
      if (!debt) return;
      const monthlyAmt = debt.months > 0 ? debt.total / debt.months : 0;
      const newPaid = Math.min(debt.total, debt.paid + monthlyAmt);
      const newPaidMonths = Math.min(debt.months, debt.paidMonths + 1);
      if (newPaid >= debt.total) onComplete();
      void upsertDebt(activeUid, { ...debt, paid: newPaid, paidMonths: newPaidMonths });
    } else {
      setActiveData((d) => {
        const debts = d.debts.map((deb) => {
          if (deb.id !== id) return deb;
          const monthlyAmt = deb.months > 0 ? deb.total / deb.months : 0;
          const newPaid = Math.min(deb.total, deb.paid + monthlyAmt);
          const newPaidMonths = Math.min(deb.months, deb.paidMonths + 1);
          if (newPaid >= deb.total) onComplete();
          return { ...deb, paid: newPaid, paidMonths: newPaidMonths };
        });
        return { ...d, debts };
      });
    }
    store.flash('Payment recorded');
  };

  return {
    saveTx,
    deleteTx,
    saveAccount,
    deleteAccount,
    saveCategory,
    deleteCategory,
    saveBill,
    deleteBill,
    toggleBillPaid,
    saveDebt,
    deleteDebt,
    recordDebtPayment,
  };
}

