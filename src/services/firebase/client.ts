import { collection, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const userCollection = (uid: string, name: string) => collection(db!, 'users', uid, name);
export const userDoc = (uid: string, name: string, id: string) => doc(db!, 'users', uid, name, id);
export const rootUserDoc = (uid: string) => doc(db!, 'users', uid);
export const userSettingsDoc = (uid: string, name: string, id: string) => doc(db!, 'users', uid, name, id);
export const topLevelDoc = (collectionName: string, id: string) => doc(db!, collectionName, id);

export const stripUndefined = (obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

