import { useAppStore } from '../../store/appStore';
import { removeNote, upsertNote } from '../../lib/db';
import type { DataSetter } from '../actionTypes';
import type { Note } from '../../types';

interface NoteActionOptions {
  fs: boolean;
  activeUid: string;
  setActiveData: DataSetter;
}

export function useNoteActions({ fs, activeUid, setActiveData }: NoteActionOptions) {
  const store = useAppStore();

  const reorderNotes = (reorderedNotes: Note[]) => {
    const ordered = reorderedNotes.map((n, i) => ({ ...n, sort_order: i }));
    if (fs) {
      ordered.forEach((n) => void upsertNote(activeUid, n));
    } else {
      setActiveData((d) => ({ ...d, notes: ordered }));
    }
  };

  const updateNoteContent = (note: Note) => {
    if (fs) {
      void upsertNote(activeUid, note);
    } else {
      setActiveData((d) => ({ ...d, notes: d.notes.map((n) => (n.id === note.id ? note : n)) }));
    }
  };

  const saveNote = (note: Note) => {
    if (fs) {
      void upsertNote(activeUid, note);
    } else {
      setActiveData((d) => {
        const existed = d.notes.find((n) => n.id === note.id);
        const notes = existed
          ? d.notes.map((n) => (n.id === note.id ? note : n))
          : [note, ...d.notes];
        return { ...d, notes };
      });
    }
    store.setEditing(null);
    store.flash(store.editing && 'item' in store.editing && store.editing.item ? 'Note saved' : 'Note created');
  };

  const deleteNote = (id: string) => {
    store.setEditing(null);
    if (fs) {
      void removeNote(activeUid, id);
    } else {
      setActiveData((d) => ({ ...d, notes: d.notes.filter((n) => n.id !== id) }));
    }
    store.flash('Note deleted');
  };

  const archiveNote = (note: Note) => {
    const updated = { ...note, archived: true };
    store.setEditing(null);
    if (fs) {
      void upsertNote(activeUid, updated);
    } else {
      setActiveData((d) => ({ ...d, notes: d.notes.map((n) => n.id === note.id ? updated : n) }));
    }
    store.flash('Note archived', 'Undo', () => {
      const restored = { ...note, archived: false };
      if (fs) void upsertNote(activeUid, restored);
      else setActiveData((d) => ({ ...d, notes: d.notes.map((n) => n.id === note.id ? restored : n) }));
      store.setToast(null);
    });
  };

  const restoreNote = (note: Note) => {
    const updated = { ...note, archived: false };
    store.setEditing(null);
    if (fs) {
      void upsertNote(activeUid, updated);
    } else {
      setActiveData((d) => ({ ...d, notes: d.notes.map((n) => n.id === note.id ? updated : n) }));
    }
    store.flash('Note restored');
  };

  return { reorderNotes, updateNoteContent, saveNote, deleteNote, archiveNote, restoreNote };
}

