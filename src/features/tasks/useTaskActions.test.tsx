import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTaskActions } from './useTaskActions';
import type { Task, UserData } from '../../types';

let mockEditing: any = null;
const mockSetEditing = vi.fn();
const mockFlash = vi.fn();

vi.mock('../../store/appStore', () => ({
  useAppStore: () => ({
    setEditing: mockSetEditing,
    flash: mockFlash,
    get editing() {
      return mockEditing;
    },
  }),
}));

describe('useTaskActions saveTask', () => {
  beforeEach(() => {
    mockEditing = null;
    mockSetEditing.mockClear();
    mockFlash.mockClear();
  });

  it('assigns sort_order = 0 when saving a new task to an empty date list', () => {
    const data: UserData = {
      tasks: {},
      taskTypes: [],
      habits: [],
      banks: [],
      transactions: [],
      bills: [],
      debts: [],
      privacy: { cal: true, notes: true, links: true, habits: true, money: true },
      linkCategories: [],
      links: [],
      notes: [],
    };
    const setActiveData = vi.fn();

    const { result } = renderHook(() =>
      useTaskActions({
        data,
        fs: false,
        activeUid: 'user-1',
        setActiveData,
        onComplete: vi.fn(),
      })
    );

    const newTask: Task = {
      id: 't-new',
      title: 'New task',
      emoji: '📌',
      time: null,
      done: false,
    };

    result.current.saveTask(newTask, '2026-06-29');

    // Expected state updater call
    expect(setActiveData).toHaveBeenCalled();
    const updater = setActiveData.mock.calls[0][0];
    const updatedState = updater(data);

    const savedTasks = updatedState.tasks['2026-06-29'];
    expect(savedTasks).toHaveLength(1);
    expect(savedTasks[0]).toEqual(
      expect.objectContaining({
        id: 't-new',
        sort_order: 0,
      })
    );
  });

  it('assigns sort_order = max + 1 when saving a new task to a day with existing tasks', () => {
    const existingTasks: Task[] = [
      { id: 't1', title: 'Task 1', emoji: '📌', time: null, done: false, sort_order: 1 },
      { id: 't2', title: 'Task 2', emoji: '📌', time: null, done: false, sort_order: 3 },
    ];
    const data: UserData = {
      tasks: { '2026-06-29': existingTasks },
      taskTypes: [],
      habits: [],
      banks: [],
      transactions: [],
      bills: [],
      debts: [],
      privacy: { cal: true, notes: true, links: true, habits: true, money: true },
      linkCategories: [],
      links: [],
      notes: [],
    };
    const setActiveData = vi.fn();

    const { result } = renderHook(() =>
      useTaskActions({
        data,
        fs: false,
        activeUid: 'user-1',
        setActiveData,
        onComplete: vi.fn(),
      })
    );

    const newTask: Task = {
      id: 't-new',
      title: 'New task',
      emoji: '📌',
      time: null,
      done: false,
    };

    result.current.saveTask(newTask, '2026-06-29');

    const updater = setActiveData.mock.calls[0][0];
    const updatedState = updater(data);

    const savedTasks = updatedState.tasks['2026-06-29'];
    expect(savedTasks).toHaveLength(3);
    // Should append to the end of the array
    expect(savedTasks[2]).toEqual(
      expect.objectContaining({
        id: 't-new',
        sort_order: 4, // max (1, 3) + 1
      })
    );
  });

  it('assigns sort_order = 1 when existing tasks have undefined sort_order', () => {
    const existingTasks: Task[] = [
      { id: 't1', title: 'Task 1', emoji: '📌', time: null, done: false }, // defaults to 0
    ];
    const data: UserData = {
      tasks: { '2026-06-29': existingTasks },
      taskTypes: [],
      habits: [],
      banks: [],
      transactions: [],
      bills: [],
      debts: [],
      privacy: { cal: true, notes: true, links: true, habits: true, money: true },
      linkCategories: [],
      links: [],
      notes: [],
    };
    const setActiveData = vi.fn();

    const { result } = renderHook(() =>
      useTaskActions({
        data,
        fs: false,
        activeUid: 'user-1',
        setActiveData,
        onComplete: vi.fn(),
      })
    );

    const newTask: Task = {
      id: 't-new',
      title: 'New task',
      emoji: '📌',
      time: null,
      done: false,
    };

    result.current.saveTask(newTask, '2026-06-29');

    const updater = setActiveData.mock.calls[0][0];
    const updatedState = updater(data);

    const savedTasks = updatedState.tasks['2026-06-29'];
    expect(savedTasks).toHaveLength(2);
    expect(savedTasks[1]).toEqual(
      expect.objectContaining({
        id: 't-new',
        sort_order: 1, // max (0) + 1
      })
    );
  });

  it('preserves existing sort_order when editing a task on the same date', () => {
    const existingTasks: Task[] = [
      { id: 't1', title: 'Task 1', emoji: '📌', time: null, done: false, sort_order: 2 },
    ];
    const data: UserData = {
      tasks: { '2026-06-29': existingTasks },
      taskTypes: [],
      habits: [],
      banks: [],
      transactions: [],
      bills: [],
      debts: [],
      privacy: { cal: true, notes: true, links: true, habits: true, money: true },
      linkCategories: [],
      links: [],
      notes: [],
    };
    const setActiveData = vi.fn();

    // Set editing state matching the task edit action
    mockEditing = { type: 'task', item: existingTasks[0], dateKey: '2026-06-29' };

    const { result } = renderHook(() =>
      useTaskActions({
        data,
        fs: false,
        activeUid: 'user-1',
        setActiveData,
        onComplete: vi.fn(),
      })
    );

    const editedTask: Task = {
      id: 't1',
      title: 'Task 1 (Edited)',
      emoji: '📌',
      time: null,
      done: false,
    };

    result.current.saveTask(editedTask, '2026-06-29');

    const updater = setActiveData.mock.calls[0][0];
    const updatedState = updater(data);

    const savedTasks = updatedState.tasks['2026-06-29'];
    expect(savedTasks).toHaveLength(1);
    expect(savedTasks[0]).toEqual(
      expect.objectContaining({
        id: 't1',
        title: 'Task 1 (Edited)',
        sort_order: 2, // preserved
      })
    );
  });

  it('removes task from old date and appends to new date when changing date', () => {
    const taskToMove: Task = { id: 't1', title: 'Task 1', emoji: '📌', time: null, done: false, sort_order: 2 };
    const data: UserData = {
      tasks: {
        '2026-06-28': [taskToMove],
        '2026-06-29': [
          { id: 't2', title: 'Task 2', emoji: '📌', time: null, done: false, sort_order: 5 },
        ],
      },
      taskTypes: [],
      habits: [],
      banks: [],
      transactions: [],
      bills: [],
      debts: [],
      privacy: { cal: true, notes: true, links: true, habits: true, money: true },
      linkCategories: [],
      links: [],
      notes: [],
    };
    const setActiveData = vi.fn();

    // Set editing state
    mockEditing = { type: 'task', item: taskToMove, dateKey: '2026-06-28' };

    const { result } = renderHook(() =>
      useTaskActions({
        data,
        fs: false,
        activeUid: 'user-1',
        setActiveData,
        onComplete: vi.fn(),
      })
    );

    result.current.saveTask({ ...taskToMove, title: 'Task 1 (Moved)' }, '2026-06-29');

    const updater = setActiveData.mock.calls[0][0];
    const updatedState = updater(data);

    // Old day should be empty
    expect(updatedState.tasks['2026-06-28']).toHaveLength(0);

    // New day should have two tasks with the moved task appended at the bottom
    const savedTasks = updatedState.tasks['2026-06-29'];
    expect(savedTasks).toHaveLength(2);
    expect(savedTasks[0].id).toBe('t2');
    expect(savedTasks[1]).toEqual(
      expect.objectContaining({
        id: 't1',
        title: 'Task 1 (Moved)',
        sort_order: 6, // max (5) + 1
      })
    );
  });
});

describe('useTaskActions moveTask', () => {
  it('moves task to a different date at specific index and normalizes sort_order', () => {
    const taskToMove: Task = { id: 't1', title: 'Task 1', emoji: '📌', time: null, done: false, sort_order: 0 };
    const destTask1: Task = { id: 't2', title: 'Task 2', emoji: '📌', time: null, done: false, sort_order: 0 };
    const destTask2: Task = { id: 't3', title: 'Task 3', emoji: '📌', time: null, done: false, sort_order: 1 };

    const data: UserData = {
      tasks: {
        '2026-06-28': [taskToMove],
        '2026-06-29': [destTask1, destTask2],
      },
      taskTypes: [],
      habits: [],
      banks: [],
      transactions: [],
      bills: [],
      debts: [],
      privacy: { cal: true, notes: true, links: true, habits: true, money: true },
      linkCategories: [],
      links: [],
      notes: [],
    };
    const setActiveData = vi.fn();

    const { result } = renderHook(() =>
      useTaskActions({
        data,
        fs: false,
        activeUid: 'user-1',
        setActiveData,
        onComplete: vi.fn(),
      })
    );

    // Move t1 to index 1 of '2026-06-29' (between destTask1 and destTask2)
    result.current.moveTask('t1', '2026-06-28', '2026-06-29', 1);

    expect(setActiveData).toHaveBeenCalled();
    const updater = setActiveData.mock.calls[0][0];
    const updatedState = updater(data);

    expect(updatedState.tasks['2026-06-28']).toHaveLength(0);
    const newDayTasks = updatedState.tasks['2026-06-29'];
    expect(newDayTasks).toHaveLength(3);
    expect(newDayTasks[0].id).toBe('t2');
    expect(newDayTasks[0].sort_order).toBe(0);
    expect(newDayTasks[1].id).toBe('t1');
    expect(newDayTasks[1].sort_order).toBe(1);
    expect(newDayTasks[2].id).toBe('t3');
    expect(newDayTasks[2].sort_order).toBe(2);
  });

  it('reorders tasks on the same date without duplicating items', () => {
    const t1: Task = { id: 't1', title: 'Task 1', emoji: '📌', time: null, done: false, sort_order: 0 };
    const t2: Task = { id: 't2', title: 'Task 2', emoji: '📌', time: null, done: false, sort_order: 1 };
    const t3: Task = { id: 't3', title: 'Task 3', emoji: '📌', time: null, done: false, sort_order: 2 };

    const data: UserData = {
      tasks: {
        '2026-06-29': [t1, t2, t3],
      },
      taskTypes: [],
      habits: [],
      banks: [],
      transactions: [],
      bills: [],
      debts: [],
      privacy: { cal: true, notes: true, links: true, habits: true, money: true },
      linkCategories: [],
      links: [],
      notes: [],
    };
    const setActiveData = vi.fn();

    const { result } = renderHook(() =>
      useTaskActions({
        data,
        fs: false,
        activeUid: 'user-1',
        setActiveData,
        onComplete: vi.fn(),
      })
    );

    // Move t1 from index 0 to index 2 on the same day
    result.current.moveTask('t1', '2026-06-29', '2026-06-29', 2);

    expect(setActiveData).toHaveBeenCalled();
    const updater = setActiveData.mock.calls[0][0];
    const updatedState = updater(data);

    const reordered = updatedState.tasks['2026-06-29'];
    expect(reordered).toHaveLength(3);
    expect(reordered.map((t: Task) => t.id)).toEqual(['t2', 't3', 't1']);
    expect(reordered.map((t: Task) => t.sort_order)).toEqual([0, 1, 2]);
  });
});
