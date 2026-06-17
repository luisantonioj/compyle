import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { useFocusTimerStore } from '../store/focusTimerStore';
import { getDuration } from '../hooks/useFocusTimer';

export function FocusTimerManager() {
  const settings = useAppStore((s) => s.focusSettings);
  const { mode, timeLeft, isActive, pomodorosCompleted, setMode, setTimeLeft, setIsActive, setPomodorosCompleted } = useFocusTimerStore();

  const fullTimeRef = useRef(getDuration(mode, settings));

  // Sync timeLeft when settings change, but only if we haven't started or are paused at the full time.
  useEffect(() => {
    const newFullTime = getDuration(mode, settings);
    if (!isActive && timeLeft === fullTimeRef.current) {
      setTimeLeft(newFullTime);
    }
    fullTimeRef.current = newFullTime;
  }, [settings, mode, isActive, timeLeft, setTimeLeft]);

  // Timer interval
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

  // Document title update
  useEffect(() => {
    if (isActive) {
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      const modeStr = mode === 'focus' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : 'Long Break';
      document.title = `${timeStr} - ${modeStr} | compyle`;
    } else {
      document.title = 'compyle';
    }
    return () => {
      document.title = 'compyle'; // reset on unmount, though this won't unmount usually
    }
  }, [isActive, timeLeft, mode]);

  return null; // This component does not render anything
}
