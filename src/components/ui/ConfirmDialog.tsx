export function ConfirmDialog({ title, message, onConfirm, onCancel }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onCancel} />
      <div className="confirm-dialog">
        <div style={{ fontFamily: 'var(--serif)', fontSize: 24, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 18, lineHeight: 1.4 }}>{message}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '11px', borderRadius: 12, background: 'var(--cream-deep)',
            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft)',
          }}>Keep</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '11px', borderRadius: 12, background: 'var(--clay)',
            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'white',
          }}>Delete</button>
        </div>
      </div>
    </>
  );
}
