import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import type { FocusSettings } from '../types';

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export function useFocusTimer() {
  const settings = useAppStore((s) => s.focusSettings);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);

  const getDuration = (m: TimerMode, s: FocusSettings) => {
    if (m === 'focus') return s.focusDuration * 60;
    if (m === 'shortBreak') return s.shortBreakDuration * 60;
    return s.longBreakDuration * 60;
  };

  // Keep track of the full time for the current mode/settings
  const fullTimeRef = useRef(getDuration(mode, settings));

  // Sync timeLeft when settings change, but only if we haven't started or are paused at the full time.
  useEffect(() => {
    const newFullTime = getDuration(mode, settings);
    if (!isActive && timeLeft === fullTimeRef.current) {
      setTimeLeft(newFullTime);
    }
    fullTimeRef.current = newFullTime;
  }, [settings, mode, isActive, timeLeft]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Timer finished!
      setIsActive(false);
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    if (mode === 'focus') {
      const newCount = pomodorosCompleted + 1;
      setPomodorosCompleted(newCount);
      const isLongBreak = newCount > 0 && newCount % settings.longBreakInterval === 0;
      const nextMode = isLongBreak ? 'longBreak' : 'shortBreak';
      setMode(nextMode);
      setTimeLeft(getDuration(nextMode, settings));
      if (settings.autoStartBreaks) setIsActive(true);
    } else {
      setMode('focus');
      setTimeLeft(getDuration('focus', settings));
      if (settings.autoStartFocus) setIsActive(true);
    }
  };

  const switchMode = (newMode: TimerMode) => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(getDuration(newMode, settings));
    fullTimeRef.current = getDuration(newMode, settings);
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
