import { useAppStore } from '../../store/appStore';

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    if (error.message.includes('INTERNAL ASSERTION FAILED')) return 'Sync needs to restart.';
    return error.message;
  }
  return 'Unable to sync changes';
}

/**
 * Observes a Firestore write without changing its Promise semantics.
 * Callers may still await the returned Promise, while fire-and-forget actions
 * are reflected in the global sync indicator and no longer fail silently.
 */
export function trackFirestoreWrite<T>(write: Promise<T>): Promise<T> {
  const store = useAppStore.getState();
  store.beginSyncWrite();

  void write.then(
    () => useAppStore.getState().completeSyncWrite(),
    (error) => {
      useAppStore.getState().completeSyncWrite();
      useAppStore.getState().reportSyncError(errorMessage(error));
    },
  );

  return write;
}
