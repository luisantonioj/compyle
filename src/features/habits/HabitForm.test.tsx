import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HabitForm } from './HabitForm';

describe('HabitForm', () => {
  it('saves a custom weekday schedule', () => {
    const onSave = vi.fn();
    render(<HabitForm onSave={onSave} onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Floss, Gym, Read'), { target: { value: 'Read' } });
    fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
    fireEvent.click(screen.getByRole('button', { name: 'Monday' }));
    fireEvent.click(screen.getByRole('button', { name: 'Wednesday' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create tracker' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Read',
      note: 'Mon, Wed',
      frequency: 'custom',
      scheduleMode: 'days',
      scheduleDays: [1, 3],
    }));
  });

  it('saves a custom times-per-week schedule', () => {
    const onSave = vi.fn();
    render(<HabitForm onSave={onSave} onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Floss, Gym, Read'), { target: { value: 'Gym' } });
    fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
    fireEvent.click(screen.getByRole('button', { name: 'Set times per week' }));
    fireEvent.click(screen.getByRole('button', { name: '4 times per week' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create tracker' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      note: '4× a week',
      frequency: 'custom',
      scheduleMode: 'times_per_week',
      timesPerWeek: 4,
    }));
  });
});
