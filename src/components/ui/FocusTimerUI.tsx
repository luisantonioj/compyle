import React, { useState } from 'react';
import { useFocusTimer, TimerMode } from '../../hooks/useFocusTimer';
import { Icons } from '../Icons';
import { FocusSettingsForm } from '../forms/FocusSettingsForm';

export function FocusTimerUI() {
  const { mode, switchMode, timeLeft, isActive, toggleTimer, pomodorosCompleted, settings } = useFocusTimer();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getEstimatedFinish = () => {
    const now = new Date();
    const finishTime = new Date(now.getTime() + timeLeft * 1000);
    const opts: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: !settings.use24HourFormat 
    };
    return finishTime.toLocaleTimeString([], opts);
  };

  const modes: { id: TimerMode; label: string }[] = [
    { id: 'focus', label: 'Focus' },
    { id: 'shortBreak', label: 'Short Break' },
    { id: 'longBreak', label: 'Long Break' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', position: 'relative', paddingBottom: '10vh' }}>
      
      <div style={{ 
        display: 'flex', gap: '4px', marginBottom: '2rem', padding: '4px', 
        background: 'var(--hair)', borderRadius: '100px'
      }}>
        {modes.map(m => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => switchMode(m.id)}
              style={{
                padding: '8px 20px',
                borderRadius: '100px',
                border: 'none',
                background: active ? 'var(--white)' : 'transparent',
                color: active ? 'var(--ink)' : 'var(--ink-mute)',
                fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '0.9rem',
                boxShadow: active ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <div style={{ 
        fontSize: '6rem', 
        fontWeight: 700, 
        lineHeight: 1, 
        fontFamily: 'var(--mono)', 
        marginBottom: '3rem', 
        fontVariantNumeric: 'tabular-nums',
        color: mode === 'focus' ? 'var(--clay)' : mode === 'shortBreak' ? 'var(--moss)' : 'var(--amber)',
        transition: 'color 0.4s ease'
      }}>
        {formatTime(timeLeft)}
      </div>

      <button
        onClick={toggleTimer}
        style={{
          padding: '18px 48px',
          fontSize: '1.2rem',
          fontWeight: 600,
          borderRadius: '100px',
          border: 'none',
          background: isActive ? 'var(--hair)' : 'var(--ink)',
          color: isActive ? 'var(--ink)' : 'var(--cream)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          minWidth: '220px',
          letterSpacing: '0.05em'
        }}
      >
        {isActive ? 'PAUSE' : 'START'}
      </button>

      <div style={{ 
        marginTop: '2.5rem', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        color: 'var(--ink-mute)', 
        fontSize: '0.95rem',
        fontWeight: 500
      }}>
        <div>Sessions completed: {pomodorosCompleted}</div>
        <div style={{ opacity: 0.7 }}>Estimated Finish: {getEstimatedFinish()}</div>
      </div>
    </div>
  );
}
