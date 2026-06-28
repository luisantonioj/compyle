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

  it('creates, selects, and saves a reusable custom task type', () => {
    const onSave = vi.fn();
    const onSaveTaskType = vi.fn();
    render(
      <TaskForm
        dateKey="2026-06-23"
        onSave={onSave}
        onSaveTaskType={onSaveTaskType}
        onClose={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("What's the task?"), { target: { value: 'Buy groceries' } });
    fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
    fireEvent.click(screen.getByRole('button', { name: 'Use 🛒' }));
    fireEvent.change(screen.getByPlaceholderText('e.g. Errand'), { target: { value: 'Errand' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save type' }));

    expect(onSaveTaskType).toHaveBeenCalledWith(expect.objectContaining({
      emoji: '🛒',
      label: 'Errand',
    }));
    expect(screen.getByRole('button', { name: /Errand/ })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Add task' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        emoji: '🛒',
        taskTypeLabel: 'Errand',
      }),
      '2026-06-23',
    );
  });
});
