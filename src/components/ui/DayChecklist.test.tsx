import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Habit } from '../../types';
import { DayChecklist } from './DayChecklist';

const habit: Habit = {
  id: 'h1',
  name: 'Read',
  note: 'Daily',
  frequency: 'daily',
  completedDates: [],
  repeating: true,
};

describe('DayChecklist', () => {
  it('displays every day in the selected month', () => {
    const { container } = render(
      <DayChecklist habit={habit} completedDates={[]} onToggle={vi.fn()} />,
    );

    const visibleDates = () =>
      Array.from(container.querySelectorAll<HTMLButtonElement>('.mobile-month-day'))
        .map((day) => day.title);
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-`;

    expect(visibleDates()).toHaveLength(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
    expect(visibleDates().every((date) => date.startsWith(monthPrefix))).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));

    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextPrefix = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-`;
    expect(visibleDates().every((date) => date.startsWith(nextPrefix))).toBe(true);
  });

  it('jumps to a month and year from the mobile period sheet', () => {
    const { container } = render(
      <DayChecklist habit={habit} completedDates={[]} onToggle={vi.fn()} />,
    );
    const targetYear = new Date().getFullYear() + 1;

    fireEvent.click(screen.getByRole('button', { name: /Choose calendar period/ }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Calendar month' }), {
      target: { value: 0 },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Calendar year' }), {
      target: { value: targetYear },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Show period' }));

    const visibleDates = Array.from(
      container.querySelectorAll<HTMLButtonElement>('.mobile-month-day'),
    ).map((day) => day.title);

    expect(visibleDates).toContain(`${targetYear}-01-01`);
    expect(screen.queryByRole('button', { name: 'Show period' })).not.toBeInTheDocument();
  });
});
