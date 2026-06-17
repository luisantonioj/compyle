import { create } from 'zustand';

import { useAppStore } from './appStore';

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

interface FocusTimerState {
  mode: TimerMode;
  timeLeft: number;
  isActive: boolean;
  pomodorosCompleted: number;
  setMode: (mode: TimerMode) => void;
  setTimeLeft: (time: number | ((prev: number) => number)) => void;
  setIsActive: (active: boolean) => void;
  setPomodorosCompleted: (count: number | ((prev: number) => number)) => void;
}

export const useFocusTimerStore = create<FocusTimerState>((set) => {
  const initialSettings = useAppStore.getState().focusSettings;
  return {
    mode: 'focus',
    timeLeft: initialSettings.focusDuration * 60,
    isActive: false,
    pomodorosCompleted: 0,

  
  setMode: (mode) => set({ mode }),
  setTimeLeft: (time) => set((state) => ({ 
    timeLeft: typeof time === 'function' ? time(state.timeLeft) : time 
  })),
  setIsActive: (isActive) => set({ isActive }),
  setPomodorosCompleted: (count) => set((state) => ({
    pomodorosCompleted: typeof count === 'function' ? count(state.pomodorosCompleted) : count
  })),
  };
});
