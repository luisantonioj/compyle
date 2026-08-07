export function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label?: string }) {
  return (
    <button type="button" onClick={onToggle} aria-label={label} aria-pressed={on} style={{
      width: 44, height: 26, borderRadius: 999,
      background: on ? 'var(--ink)' : 'var(--ink-faint)',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 20 : 2,
        width: 22, height: 22, borderRadius: 999, background: 'white',
        transition: 'left 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}
