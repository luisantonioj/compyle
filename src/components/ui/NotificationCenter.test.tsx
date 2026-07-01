import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from '../../store/appStore';
import { NotificationCenter } from './NotificationCenter';

describe('NotificationCenter', () => {
  afterEach(() => vi.useRealTimers());

  it('gives action toasts priority over sync status', () => {
    vi.useFakeTimers();
    useAppStore.setState({
      syncStatus: 'error',
      syncError: 'Sync failed',
      pendingWrites: 0,
      isOnline: true,
    });

    render(
      <NotificationCenter
        toast={{ message: 'Task saved' }}
        onToastDismiss={() => {}}
        onSyncRetry={() => {}}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Task saved');
    expect(screen.queryByText('Sync failed')).not.toBeInTheDocument();
  });

  it('moves offline status to the dedicated upper-right placement', () => {
    vi.useFakeTimers();
    useAppStore.setState({ syncStatus: 'offline', isOnline: false, syncError: null });

    const { container } = render(
      <NotificationCenter toast={null} onToastDismiss={() => {}} onSyncRetry={() => {}} />,
    );

    expect(container.querySelector('.notification-center')).toHaveClass('notification-center-offline');
    expect(screen.getByRole('status')).toHaveTextContent('Offline');
  });
});
