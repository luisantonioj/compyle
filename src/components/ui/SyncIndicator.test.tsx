import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from '../../store/appStore';
import { SyncIndicator } from './SyncIndicator';

describe('SyncIndicator', () => {
  beforeEach(() => {
    useAppStore.setState({
      syncStatus: 'idle',
      pendingWrites: 0,
      syncError: null,
      isOnline: true,
    });
  });

  it('shows pending cross-device writes', () => {
    useAppStore.setState({ syncStatus: 'syncing', pendingWrites: 2 });
    render(<SyncIndicator onRetry={() => {}} />);

    expect(screen.getByRole('status')).toHaveTextContent('Syncing 2 changes');
  });

  it('offers a retry when synchronization fails', () => {
    const onRetry = vi.fn();
    useAppStore.setState({ syncStatus: 'error', syncError: 'Connection lost' });
    render(<SyncIndicator onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
