import { describe, expect, it } from 'vitest';
import { useAppStore } from './appStore';

describe('sync state', () => {
  it('clears stale partner errors when subscriptions change', () => {
    useAppStore.setState({
      syncStatus: 'error',
      syncError: 'Some shared data is unavailable',
      pendingWrites: 0,
      isOnline: true,
    });

    useAppStore.getState().beginSyncRefresh();

    expect(useAppStore.getState()).toMatchObject({
      syncStatus: 'idle',
      syncError: null,
    });
  });
});
