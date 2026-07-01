import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';

export function SyncIndicator({ onRetry }: { onRetry: () => void }) {
  const { syncStatus, pendingWrites, syncError } = useAppStore();
  const [showSynced, setShowSynced] = useState(false);

  useEffect(() => {
    if (syncStatus !== 'synced') return;
    setShowSynced(true);
    const timeout = setTimeout(() => setShowSynced(false), 1600);
    return () => clearTimeout(timeout);
  }, [syncStatus]);

  if (syncStatus === 'idle' || (syncStatus === 'synced' && !showSynced)) return null;

  const message = syncStatus === 'syncing'
    ? `Syncing${pendingWrites > 1 ? ` ${pendingWrites} changes` : '…'}`
    : syncStatus === 'offline'
      ? 'Offline · changes will sync when connected'
      : syncStatus === 'error'
        ? syncError || 'Sync failed'
        : 'Synced';

  return (
    <div className={`sync-indicator sync-${syncStatus}`} role="status" aria-live="polite">
      <span className="sync-indicator-dot" />
      <span>{message}</span>
      {syncStatus === 'error' && <button onClick={onRetry}>Retry</button>}
    </div>
  );
}
