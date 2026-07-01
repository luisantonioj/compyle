import { useEffect, useRef, useState } from 'react';
import { useAppStore, type SyncStatus } from '../../store/appStore';
import { Icons } from '../Icons';

export function SyncIndicator({ onRetry, hidden = false }: { onRetry: () => void; hidden?: boolean }) {
  const { syncStatus, pendingWrites, syncError } = useAppStore();
  const [displayStatus, setDisplayStatus] = useState<SyncStatus | null>(null);
  const [offlineExpanded, setOfflineExpanded] = useState(false);
  const showedSyncing = useRef(false);

  useEffect(() => {
    if (syncStatus === 'syncing') {
      const timeout = setTimeout(() => {
        showedSyncing.current = true;
        setDisplayStatus('syncing');
      }, 700);
      return () => clearTimeout(timeout);
    }

    if (syncStatus === 'synced') {
      if (!showedSyncing.current) {
        setDisplayStatus(null);
        return;
      }
      showedSyncing.current = false;
      setDisplayStatus('synced');
      const timeout = setTimeout(() => setDisplayStatus(null), 1000);
      return () => clearTimeout(timeout);
    }

    showedSyncing.current = false;
    setDisplayStatus(syncStatus === 'offline' || syncStatus === 'error' ? syncStatus : null);
  }, [syncStatus]);

  useEffect(() => {
    if (syncStatus !== 'offline') {
      setOfflineExpanded(false);
      return;
    }
    setOfflineExpanded(true);
    const timeout = setTimeout(() => setOfflineExpanded(false), 5000);
    return () => clearTimeout(timeout);
  }, [syncStatus]);

  if (hidden || !displayStatus) return null;

  const message = displayStatus === 'syncing'
    ? `Syncing${pendingWrites > 1 ? ` ${pendingWrites} changes` : '…'}`
    : displayStatus === 'offline'
      ? offlineExpanded ? 'Offline · changes will sync when connected' : 'Offline'
      : displayStatus === 'error'
        ? syncError || 'Sync failed'
        : 'Synced';

  return (
    <div className={`notification-pill sync-indicator sync-${displayStatus}`} role="status" aria-live="polite">
      {displayStatus === 'offline'
        ? <span className="sync-indicator-icon">{Icons.wifiOff()}</span>
        : <span className="sync-indicator-dot" />}
      <span>{message}</span>
      {displayStatus === 'error' && <button onClick={onRetry}>Retry</button>}
    </div>
  );
}
