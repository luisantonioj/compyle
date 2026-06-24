import { deleteDoc, setDoc } from 'firebase/firestore';
import { stripUndefined, userDoc } from '../../services/firebase/client';
import type { Note } from '../../types';

export const upsertNote = (uid: string, note: Note) =>
  setDoc(userDoc(uid, 'notes', note.id), stripUndefined(note as unknown as Record<string, unknown>));

export const removeNote = (uid: string, id: string) =>
  deleteDoc(userDoc(uid, 'notes', id));

export function normalizeNoteDoc(data: Record<string, unknown>): Note | null {
  if (typeof data.id !== 'string' || typeof data.title !== 'string') return null;
  return {
    id: data.id,
    title: data.title,
    content: typeof data.content === 'string' ? data.content : '',
    updated_at: typeof data.updated_at === 'number' ? data.updated_at : 0,
    sort_order: typeof data.sort_order === 'number' ? data.sort_order : undefined,
    archived: typeof data.archived === 'boolean' ? data.archived : undefined,
  };
}

