import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FocusSettingsForm } from './FocusSettingsForm';
import { useAppStore } from '../../store/appStore';
import type { FocusSettings } from '../../types';

const settings: FocusSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStartBreaks: false,
  autoStartFocus: false,
  longBreakInterval: 4,
  use24HourFormat: false,
};

describe('FocusSettingsForm', () => {
  beforeEach(() => {
    useAppStore.setState({ focusSettings: settings });
  });

  it('saves normalized duration and interval values', () => {
    const onClose = vi.fn();
    render(<FocusSettingsForm onClose={onClose} />);

    const durationInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(durationInputs[0], { target: { value: '0' } });
    fireEvent.change(durationInputs[1], { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Auto-start breaks' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));

    expect(useAppStore.getState().focusSettings).toMatchObject({
      focusDuration: 1,
      shortBreakDuration: 10,
      autoStartBreaks: true,
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('discards edits when cancelled', () => {
    const onClose = vi.fn();
    render(<FocusSettingsForm onClose={onClose} />);

    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '45' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(useAppStore.getState().focusSettings.focusDuration).toBe(25);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
