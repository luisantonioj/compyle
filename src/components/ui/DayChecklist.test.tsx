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
  it('always displays a Sunday-to-Saturday calendar week', () => {
    const { container } = render(
      <DayChecklist habit={habit} completedDates={[]} onToggle={vi.fn()} />,
    );

    const displayedWeekdays = () =>
      Array.from(container.querySelectorAll<HTMLButtonElement>('.day-tile')).map((day) =>
        new Date(`${day.title}T00:00:00`).getDay(),
      );

    expect(displayedWeekdays()).toEqual([0, 1, 2, 3, 4, 5, 6]);

    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));

    expect(displayedWeekdays()).toEqual([0, 1, 2, 3, 4, 5, 6]);
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
      container.querySelectorAll<HTMLButtonElement>('.day-tile'),
    ).map((day) => day.title);

    expect(visibleDates).toContain(`${targetYear}-01-01`);
    expect(screen.queryByRole('button', { name: 'Show period' })).not.toBeInTheDocument();
  });
});
