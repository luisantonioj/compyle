import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NoteForm } from './NoteForm';

describe('NoteForm', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('autosaves a new note after the first typed character without closing', () => {
    vi.useFakeTimers();
    const onAutosave = vi.fn();
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(<NoteForm onSave={onSave} onAutosave={onAutosave} onClose={onClose} />);

    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'A' } });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onAutosave).toHaveBeenCalledWith(expect.objectContaining({
      id: expect.stringMatching(/^n_/),
      title: 'A',
    }));
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
