import { useEffect } from 'react';

export function Toast({ message, action, onAction, onDismiss }: {
  message: string; action?: string; onAction?: () => void; onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3200);
    return () => clearTimeout(t);
  }, [message, onDismiss]);
  return (
    <div className="toast">
      <span>{message}</span>
      {action && onAction && <button onClick={onAction}>{action}</button>}
    </div>
  );
}

// Confirm dialog
