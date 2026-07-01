import { describe, expect, it } from 'vitest';
import { useAppStore } from '../../store/appStore';
import { trackFirestoreWrite } from './syncTracker';

const resetSyncState = () => useAppStore.setState({
  syncStatus: 'idle',
  pendingWrites: 0,
  syncError: null,
  isOnline: true,
});

describe('trackFirestoreWrite', () => {
  it('tracks a write until the server acknowledges it', async () => {
    resetSyncState();
    let resolve!: () => void;
    const write = new Promise<void>((done) => { resolve = done; });

    trackFirestoreWrite(write);
    expect(useAppStore.getState()).toMatchObject({ syncStatus: 'syncing', pendingWrites: 1 });

    resolve();
    await write;
    await Promise.resolve();

    expect(useAppStore.getState()).toMatchObject({ syncStatus: 'synced', pendingWrites: 0, syncError: null });
  });

  it('surfaces failed writes', async () => {
    resetSyncState();
    const write = Promise.reject(new Error('permission denied'));

    trackFirestoreWrite(write);
    await expect(write).rejects.toThrow('permission denied');
    await Promise.resolve();

    expect(useAppStore.getState()).toMatchObject({
      syncStatus: 'error',
      pendingWrites: 0,
      syncError: 'permission denied',
    });
  });

  it('does not expose Firebase internal assertion details to users', async () => {
    resetSyncState();
    const write = Promise.reject(new Error('FIRESTORE INTERNAL ASSERTION FAILED: Unexpected state'));

    trackFirestoreWrite(write);
    await expect(write).rejects.toThrow('Unexpected state');
    await Promise.resolve();

    expect(useAppStore.getState()).toMatchObject({
      syncStatus: 'error',
      syncError: 'Sync needs to restart.',
    });
  });
});
