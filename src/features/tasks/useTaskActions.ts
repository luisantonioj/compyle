import { useAppStore } from '../../store/appStore';
import { TODAY_KEY } from '../../lib/seed';
import { removeTask, upsertTask, upsertTaskType } from './taskRepository';
import type { DataSetter } from '../actionTypes';
import type { Task, TaskType, UserData } from '../../types';

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
    let actualSource = sourceDate;
    let taskToMove = (data.tasks[actualSource] ?? []).find((t) => t.id === taskId);
    if (!taskToMove) {
      for (const [dk, dayTasks] of Object.entries(data.tasks)) {
        const found = dayTasks.find((t) => t.id === taskId);
        if (found) {
          taskToMove = found;
          actualSource = dk;
          break;
        }
      }
    }
    if (!taskToMove) return;

    const { _virtual, _originKey, ...cleanTask } = taskToMove as any;
    const task = cleanTask as Task;

    if (actualSource === destDate) {
      const currentTasks = [...(data.tasks[destDate] ?? [])];
      const oldIndex = currentTasks.findIndex((t) => t.id === taskId);
      if (oldIndex === -1) return;
      const safeIndex = Math.max(0, Math.min(newIndex, currentTasks.length - 1));
      const reordered = [...currentTasks];
      const [item] = reordered.splice(oldIndex, 1);
      reordered.splice(safeIndex, 0, item);
      reorderTasks(destDate, reordered);
      return;
    }

    const newSourceTasks = (data.tasks[actualSource] ?? []).filter((t) => t.id !== taskId);
    const newDestTasks = (data.tasks[destDate] ?? []).filter((t) => t.id !== taskId);
    const safeIndex = Math.max(0, Math.min(newIndex, newDestTasks.length));

    newDestTasks.splice(safeIndex, 0, task);

    const orderedSource = newSourceTasks.map((t, i) => ({ ...t, sort_order: i }));
    const orderedDest = newDestTasks.map((t, i) => ({ ...t, sort_order: i }));

    if (fs) {
      orderedDest.forEach((t) => void upsertTask(activeUid, t, destDate));
      orderedSource.forEach((t) => void upsertTask(activeUid, t, actualSource));
    } else {
      setActiveData((d) => ({
        ...d,
        tasks: {
          ...d.tasks,
          [actualSource]: orderedSource,
          [destDate]: orderedDest,
        },
      }));
    }
  };

  const saveTask = (task: Task, dateKey: string) => {
    const oldDateKey = store.editing && store.editing.type === 'task' ? store.editing.dateKey : undefined;
    const isDateChanged = oldDateKey && oldDateKey !== dateKey;

    const dayTasks = data.tasks[dateKey] ?? [];
    const existed = dayTasks.find((t) => t.id === task.id);

    let finalTask = { ...task };
    if (existed && !isDateChanged) {
      finalTask.sort_order = task.sort_order !== undefined ? task.sort_order : existed.sort_order;
    } else {
      const maxSortOrder = dayTasks.reduce((max, t) => {
        const so = t.sort_order ?? 0;
        return so > max ? so : max;
      }, -1);
      finalTask.sort_order = maxSortOrder + 1;
    }

    if (fs) {
      void upsertTask(activeUid, finalTask, dateKey);
    } else {
      setActiveData((d) => {
        let updatedTasks = { ...d.tasks };
        if (isDateChanged && oldDateKey) {
          const oldDay = updatedTasks[oldDateKey] ?? [];
          updatedTasks[oldDateKey] = oldDay.filter((t) => t.id !== task.id);
        }

        const day = updatedTasks[dateKey] ?? [];
        const existedInD = day.find((t) => t.id === finalTask.id);
        const newDay = existedInD
          ? day.map((t) => (t.id === finalTask.id ? finalTask : t))
          : [...day, finalTask];

        updatedTasks[dateKey] = newDay;
        return { ...d, tasks: updatedTasks };
      });
    }
    store.setEditing(null);
    store.flash(store.editing && 'item' in store.editing && store.editing.item ? 'Task updated' : 'Task added');
  };

  const saveTaskType = (taskType: TaskType) => {
    if (fs) {
      void upsertTaskType(activeUid, taskType);
    } else {
      setActiveData((d) => ({
        ...d,
        taskTypes: d.taskTypes.some((type) => type.id === taskType.id)
          ? d.taskTypes.map((type) => type.id === taskType.id ? taskType : type)
          : [...d.taskTypes, taskType],
      }));
    }
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

  return { reorderTasks, moveTask, saveTask, saveTaskType, deleteTask, checkTask };
}
