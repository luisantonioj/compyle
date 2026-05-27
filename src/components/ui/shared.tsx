// compyle — shared UI primitives
import React, { useEffect, useState } from 'react';
import { Icons } from '../Icons';
import { TODAY_KEY, dateKey } from '../../lib/seed';

// ─── Progress bar ───
export function Progress({ value, max, variant }: { value: number; max: number; variant?: 'clay' | 'moss' | 'amber' }) {
  const pct = Math.min(100, Math.max(0, (value / (max || 1)) * 100));
  return (
    <div className={`progress${variant ? ' ' + variant : ''}`}>
      <div style={{ width: pct + '%' }} />
    </div>
  );
}

// ─── Day checklist (last 7 days — each independently tickable) ───
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function DayChecklist({ completedDates, onToggle, disabled }: {
  completedDates: string[];
  onToggle: (dk: string) => void;
  disabled?: boolean;
}) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const offset = 6 - i;
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    const dk = dateKey(d);
    return { dk, dayLetter: DAY_LETTERS[d.getDay()], dayNum: d.getDate(), isToday: dk === TODAY_KEY };
  });

  return (
    <div className="day-check-row">
      {days.map(({ dk, dayLetter, dayNum, isToday }) => {
        const checked = completedDates.includes(dk);
        return (
          <button
            key={dk}
            className={`day-tile${checked ? ' checked' : ''}${isToday ? ' today' : ''}`}
            disabled={disabled}
            onClick={() => !disabled && onToggle(dk)}
            title={dk}
          >
            <span className="dt-letter">{dayLetter}</span>
            <span className="dt-num">{dayNum}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Sheet (bottom drawer) ───
export function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        {children}
      </div>
    </>
  );
}

// ─── Partner banner ───
export function PartnerBanner({ name, onReturn }: { name: string; onReturn: () => void }) {
  return (
    <div className="partner-banner fade-in">
      <div>Viewing & editing <strong>{name}'s</strong> data</div>
      <button onClick={onReturn}>↩ Me</button>
    </div>
  );
}

// ─── Confetti ───
interface ConfettiBit {
  id: string; x: number; y: number;
  dx: number; dy: number; r: number; d: number; c: string;
}
export function Confetti({ trigger }: { trigger: number }) {
  const [bits, setBits] = useState<ConfettiBit[]>([]);
  useEffect(() => {
    if (!trigger) return;
    const colors = ['#8f1d2b', '#c04059', '#4a5c3f', '#c08838', '#6b5e8a', '#15130f'];
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

// ─── Toast ───
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

// ─── Confirm dialog ───
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

// ─── Toggle switch ───
export function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
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
