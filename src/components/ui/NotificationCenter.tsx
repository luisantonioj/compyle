import type { ToastState } from '../../app/appTypes';
import { useAppStore } from '../../store/appStore';
import { SyncIndicator } from './SyncIndicator';
import { Toast } from './Toast';

export function NotificationCenter({
  toast,
  onToastDismiss,
  onSyncRetry,
}: {
  toast: ToastState | null;
  onToastDismiss: () => void;
  onSyncRetry: () => void;
}) {
  const syncStatus = useAppStore((state) => state.syncStatus);
  const offlinePlacement = !toast && syncStatus === 'offline';

  return (
    <div className={`notification-center${offlinePlacement ? ' notification-center-offline' : ''}`}>
      {toast && (
        <Toast
          message={toast.message}
          action={toast.action}
          onAction={toast.onAction}
          onDismiss={onToastDismiss}
        />
      )}
      <SyncIndicator onRetry={onSyncRetry} hidden={!!toast} />
    </div>
  );
}
