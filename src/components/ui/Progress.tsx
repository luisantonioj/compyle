export function Progress({ value, max, variant }: { value: number; max: number; variant?: 'clay' | 'moss' | 'amber' }) {
  const pct = Math.min(100, Math.max(0, (value / (max || 1)) * 100));
  return (
    <div className={`progress${variant ? ' ' + variant : ''}`}>
      <div style={{ width: pct + '%' }} />
    </div>
  );
}
