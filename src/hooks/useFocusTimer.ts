import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { useFocusTimerStore, TimerMode } from '../store/focusTimerStore';
import type { FocusSettings } from '../types';

export type { TimerMode };

export function getDuration(m: TimerMode, s: FocusSettings) {
  if (m === 'focus') return s.focusDuration * 60;
  if (m === 'shortBreak') return s.shortBreakDuration * 60;
  return s.longBreakDuration * 60;
}

export function useFocusTimer() {
  const settings = useAppStore((s) => s.focusSettings);
  const { mode, timeLeft, isActive, pomodorosCompleted, setMode, setTimeLeft, setIsActive, setPomodorosCompleted } = useFocusTimerStore();

  const switchMode = (newMode: TimerMode) => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(getDuration(newMode, settings));
  };

  const toggleTimer = () => setIsActive(!isActive);

  return {
    mode,
    switchMode,
    timeLeft,
    isActive,
    toggleTimer,
    pomodorosCompleted,
    settings,
  };
}
