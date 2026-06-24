import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TransactionForm } from './MoneyForms';
import type { BankAccount } from '../../types';

const banks: BankAccount[] = [
  {
    id: 'bank-a',
    name: 'Main',
    balance: 1000,
    color: '#111',
    last4: '1234',
    categories: [{ id: 'cat-food', name: 'Food', color: '#222', balance: 300 }],
  },
];

describe('TransactionForm', () => {
  it('records a spend transaction with the selected account and category', () => {
    const onSave = vi.fn();
    render(<TransactionForm banks={banks} onSave={onSave} onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '125' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Sephora - toner refill'), {
      target: { value: 'Lunch' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Record spend' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        bank: 'bank-a',
        cat: 'cat-food',
        label: 'Lunch',
        amt: -125,
      }),
    );
  });
});
