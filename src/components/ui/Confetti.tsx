import React, { useEffect, useState } from 'react';

interface ConfettiBit {
  id: string; x: number; y: number;
  dx: number; dy: number; r: number; d: number; c: string;
}
export function Confetti({ trigger }: { trigger: number }) {
  const [bits, setBits] = useState<ConfettiBit[]>([]);
  useEffect(() => {
    if (!trigger) return;
    const colors = ['#8f1d2b', '#c04059', '#4a5c3f', '#c08838', '#5e131c', '#15130f'];
    const next: ConfettiBit[] = Array.from({ length: 26 }, (_, i) => ({
      id: trigger + '_' + i,
      x: 40 + Math.random() * (window.innerWidth - 80),
      y: 150 + Math.random() * 200,
      dx: -150 + Math.random() * 300,
      dy: -200 - Math.random() * 200,
      r: -540 + Math.random() * 1080,
      d: Math.random() * 0.3,
      c: colors[i % colors.length],
    }));
    setBits(next);
    const t = setTimeout(() => setBits([]), 1800);
    return () => clearTimeout(t);
  }, [trigger]);
  if (!bits.length) return null;
  return (
    <div className="confetti">
      {bits.map((b) => (
        <i key={b.id} style={{
          left: b.x, top: b.y,
          '--dx': b.dx + 'px', '--dy': b.dy + 'px', '--r': b.r + 'deg',
          background: b.c, animationDelay: b.d + 's',
        } as React.CSSProperties} />
      ))}
    </div>
  );
}

// â”€â”€â”€ Toast â”€â”€â”€
