export function PartnerBanner({ name, onReturn }: { name: string; onReturn: () => void }) {
  return (
    <div className="partner-banner fade-in">
      <div>Viewing & editing <strong>{name}'s</strong> data</div>
      <button onClick={onReturn}>Me</button>
    </div>
  );
}
