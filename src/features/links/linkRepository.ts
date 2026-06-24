import { deleteDoc, setDoc } from 'firebase/firestore';
import { stripUndefined, userDoc } from '../../services/firebase/client';
import type { LinkCategory, LinkItem } from '../../types';

export const upsertLinkCategory = (uid: string, cat: LinkCategory) =>
  setDoc(userDoc(uid, 'link_categories', cat.id), stripUndefined(cat as unknown as Record<string, unknown>));

export const removeLinkCategory = (uid: string, id: string) =>
  deleteDoc(userDoc(uid, 'link_categories', id));

export const upsertLink = (uid: string, link: LinkItem) =>
  setDoc(userDoc(uid, 'links', link.id), stripUndefined(link as unknown as Record<string, unknown>));

export const removeLink = (uid: string, id: string) =>
  deleteDoc(userDoc(uid, 'links', id));

export function normalizeLinkCategoryDoc(data: Record<string, unknown>): LinkCategory | null {
  if (typeof data.id !== 'string' || typeof data.name !== 'string') return null;
  return {
    id: data.id,
    name: data.name,
    color: typeof data.color === 'string' ? data.color : '#8f1d2b',
    sort_order: typeof data.sort_order === 'number' ? data.sort_order : undefined,
    archived: typeof data.archived === 'boolean' ? data.archived : undefined,
  };
}

export function normalizeLinkDoc(data: Record<string, unknown>): LinkItem | null {
  if (typeof data.id !== 'string' || typeof data.title !== 'string') return null;
  return {
    id: data.id,
    categoryId: typeof data.categoryId === 'string' ? data.categoryId : '',
    title: data.title,
    url: typeof data.url === 'string' ? data.url : '',
    description: typeof data.description === 'string' ? data.description : undefined,
    customEmoji: typeof data.customEmoji === 'string' ? data.customEmoji : undefined,
    customImageUrl: typeof data.customImageUrl === 'string' ? data.customImageUrl : undefined,
    sort_order: typeof data.sort_order === 'number' ? data.sort_order : undefined,
    archived: typeof data.archived === 'boolean' ? data.archived : undefined,
  };
}

