import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TaskForm } from './TaskForm';

describe('TaskForm', () => {
  it('saves a new task with trimmed title and selected date', () => {
    const onSave = vi.fn();
    render(<TaskForm dateKey="2026-06-23" onSave={onSave} onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("What's the task?"), { target: { value: '  Pay bills  ' } });
    fireEvent.change(screen.getByDisplayValue('2026-06-23'), { target: { value: '2026-06-24' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add task' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Pay bills',
        done: false,
      }),
      '2026-06-24',
    );
  });
});
