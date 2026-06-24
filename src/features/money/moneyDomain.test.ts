import { describe, expect, it } from 'vitest';
import { applyDeletedTransaction, applySavedTransaction, applyTransactionDelta } from './moneyDomain';
import type { BankAccount, Transaction } from '../../types';

const banks: BankAccount[] = [
  {
    id: 'bank-a',
    name: 'Main',
    balance: 1000,
    color: '#111',
    last4: '1234',
    categories: [
      { id: 'cat-food', name: 'Food', color: '#222', balance: 300 },
      { id: 'cat-fun', name: 'Fun', color: '#333', balance: 200 },
    ],
  },
  {
    id: 'bank-b',
    name: 'Savings',
    balance: 500,
    color: '#444',
    last4: '9876',
    categories: [{ id: 'cat-trip', name: 'Trip', color: '#555', balance: 500 }],
  },
];

const tx = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  bank: 'bank-a',
  cat: 'cat-food',
  label: 'Lunch',
  amt: -125,
  date: '2026-06-23',
  time: '12:30',
  ...overrides,
});

describe('money domain', () => {
  it('applies transaction deltas to the selected bank and category only', () => {
    const next = applyTransactionDelta(banks, 'bank-a', 'cat-food', -125);

    expect(next[0].balance).toBe(875);
    expect(next[0].categories?.[0].balance).toBe(175);
    expect(next[0].categories?.[1].balance).toBe(200);
    expect(next[1]).toBe(banks[1]);
  });

  it('reverses an existing transaction before saving the edited transaction', () => {
    const existing = tx({ amt: -100 });
    const edited = tx({ amt: -50, cat: 'cat-fun' });
    const next = applySavedTransaction(banks, edited, existing);

    expect(next[0].balance).toBe(1050);
    expect(next[0].categories?.find((cat) => cat.id === 'cat-food')?.balance).toBe(400);
    expect(next[0].categories?.find((cat) => cat.id === 'cat-fun')?.balance).toBe(150);
  });

  it('restores balances when a transaction is deleted', () => {
    const next = applyDeletedTransaction(banks, tx({ amt: -125 }));

    expect(next[0].balance).toBe(1125);
    expect(next[0].categories?.[0].balance).toBe(425);
  });
});
