import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from '../../store/appStore';
import { SyncIndicator } from './SyncIndicator';

describe('SyncIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useAppStore.setState({
      syncStatus: 'idle',
      pendingWrites: 0,
      syncError: null,
      isOnline: true,
    });
  });
  afterEach(() => vi.useRealTimers());

  it('shows pending cross-device writes', () => {
    useAppStore.setState({ syncStatus: 'syncing', pendingWrites: 2 });
    render(<SyncIndicator onRetry={() => {}} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(700));
    expect(screen.getByRole('status')).toHaveTextContent('Syncing 2 changes');
  });

  it('stays quiet when synchronization finishes quickly', () => {
    useAppStore.setState({ syncStatus: 'syncing', pendingWrites: 1 });
    render(<SyncIndicator onRetry={() => {}} />);

    act(() => useAppStore.setState({ syncStatus: 'synced', pendingWrites: 0 }));
    act(() => vi.runAllTimers());

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('offers a retry when synchronization fails', () => {
    const onRetry = vi.fn();
    useAppStore.setState({ syncStatus: 'error', syncError: 'Connection lost' });
    render(<SyncIndicator onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('collapses the offline explanation after five seconds', () => {
    useAppStore.setState({ syncStatus: 'offline', isOnline: false });
    const { container } = render(<SyncIndicator onRetry={() => {}} />);

    expect(screen.getByRole('status')).toHaveTextContent('Offline · changes will sync when connected');
    expect(container.querySelector('.sync-indicator-icon')).toBeInTheDocument();
    expect(container.querySelector('.sync-indicator-dot')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(5000));

    expect(screen.getByRole('status')).toHaveTextContent(/^Offline$/);
  });
});
