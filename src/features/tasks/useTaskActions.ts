import { useAppStore } from '../../store/appStore';
import { TODAY_KEY } from '../../lib/seed';
import { removeTask, upsertTask } from './taskRepository';
import type { DataSetter } from '../actionTypes';
import type { Task, UserData } from '../../types';

interface TaskActionOptions {
  data: UserData;
  fs: boolean;
  activeUid: string;
  setActiveData: DataSetter;
  onComplete: () => void;
}

export function useTaskActions({ data, fs, activeUid, setActiveData, onComplete }: TaskActionOptions) {
  const store = useAppStore();

  const reorderTasks = (dateKey: string, reorderedTasks: Task[]) => {
    const realTasks = reorderedTasks.filter((t: any) => !t._virtual);
    const ordered = realTasks.map((t, i) => {
      const { _virtual, _originKey, ...cleanTask } = t as any;
      return { ...cleanTask, sort_order: i };
    });
    if (fs) {
      ordered.forEach((t) => void upsertTask(activeUid, t, dateKey));
    } else {
      setActiveData((d) => ({ ...d, tasks: { ...d.tasks, [dateKey]: ordered } }));
    }
  };

  const moveTask = (taskId: string, sourceDate: string, destDate: string, newIndex: number) => {
    const taskToMove = (data.tasks[sourceDate] ?? []).find((t) => t.id === taskId);
    if (!taskToMove) return;

    const { _virtual, _originKey, ...cleanTask } = taskToMove as any;
    const task = cleanTask as Task;
    const newSourceTasks = (data.tasks[sourceDate] ?? []).filter((t) => t.id !== taskId);
    const newDestTasks = [...(data.tasks[destDate] ?? [])];

    newDestTasks.splice(newIndex, 0, task);

    const orderedSource = newSourceTasks.map((t, i) => ({ ...t, sort_order: i }));
    const orderedDest = newDestTasks.map((t, i) => ({ ...t, sort_order: i }));

    if (fs) {
      orderedDest.forEach((t) => void upsertTask(activeUid, t, destDate));
      orderedSource.forEach((t) => void upsertTask(activeUid, t, sourceDate));
    } else {
      setActiveData((d) => ({
        ...d,
        tasks: {
          ...d.tasks,
          [sourceDate]: orderedSource,
          [destDate]: orderedDest,
        },
      }));
    }
  };

  const saveTask = (task: Task, dateKey: string) => {
    if (fs) {
      void upsertTask(activeUid, task, dateKey);
    } else {
      setActiveData((d) => {
        const day = d.tasks[dateKey] ?? [];
        const existed = day.find((t) => t.id === task.id);
        const newDay = existed ? day.map((t) => (t.id === task.id ? task : t)) : [...day, task];
        return { ...d, tasks: { ...d.tasks, [dateKey]: newDay } };
      });
    }
    store.setEditing(null);
    store.flash(store.editing && 'item' in store.editing && store.editing.item ? 'Task updated' : 'Task added');
  };

  const deleteTask = (taskId: string, dateKey: string) => {
    const removed = (data.tasks[dateKey] ?? []).find((t) => t.id === taskId);
    store.setEditing(null);
    if (fs) {
      void removeTask(activeUid, taskId);
    } else {
      setActiveData((d) => {
        const day = d.tasks[dateKey] ?? [];
        return { ...d, tasks: { ...d.tasks, [dateKey]: day.filter((t) => t.id !== taskId) } };
      });
    }
    store.flash('Task deleted', 'Undo', () => {
      if (removed) saveTask(removed, dateKey);
      store.setToast(null);
    });
  };

  const checkTask = (taskId: string, dateKey = TODAY_KEY) => {
    if (fs) {
      const task = (data.tasks[dateKey] ?? []).find((t) => t.id === taskId);
      if (!task) return;
      const nowDone = !task.done;
      if (nowDone) onComplete();
      void upsertTask(activeUid, { ...task, done: nowDone }, dateKey);
    } else {
      setActiveData((d) => {
        const dayTasks = (d.tasks[dateKey] ?? []).map((t) =>
          t.id === taskId ? { ...t, done: !t.done } : t,
        );
        const nowDone = dayTasks.find((t) => t.id === taskId)?.done;
        if (nowDone) onComplete();
        return { ...d, tasks: { ...d.tasks, [dateKey]: dayTasks } };
      });
    }
  };

  return { reorderTasks, moveTask, saveTask, deleteTask, checkTask };
}
