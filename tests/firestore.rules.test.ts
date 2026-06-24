import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'compyle-rules-test',
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

describe('Firestore security rules', () => {
  it('allows owners to access their task documents', async () => {
    const ownerDb = testEnv.authenticatedContext('owner').firestore();
    await assertSucceeds(setDoc(doc(ownerDb, 'users/owner/tasks/task-1'), { title: 'Mine' }));
    await assertSucceeds(getDoc(doc(ownerDb, 'users/owner/tasks/task-1')));
  });

  it('blocks unlinked users from reading another user task', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/owner/tasks/task-1'), { title: 'Private' });
    });

    const strangerDb = testEnv.authenticatedContext('stranger').firestore();
    await assertFails(getDoc(doc(strangerDb, 'users/owner/tasks/task-1')));
  });

  it('allows linked partners when matching privacy is visible', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users/owner'), { partnerId: 'partner' });
      await setDoc(doc(db, 'users/owner/tracker_visibility/settings'), { cal: true });
      await setDoc(doc(db, 'users/owner/tasks/task-1'), { title: 'Shared' });
    });

    const partnerDb = testEnv.authenticatedContext('partner').firestore();
    await assertSucceeds(getDoc(doc(partnerDb, 'users/owner/tasks/task-1')));
  });

  it('blocks linked partners when matching privacy is hidden', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users/owner'), { partnerId: 'partner' });
      await setDoc(doc(db, 'users/owner/tracker_visibility/settings'), { cal: false });
      await setDoc(doc(db, 'users/owner/tasks/task-1'), { title: 'Hidden' });
    });

    const partnerDb = testEnv.authenticatedContext('partner').firestore();
    await assertFails(getDoc(doc(partnerDb, 'users/owner/tasks/task-1')));
  });

  it('keeps top-level device tokens unreadable to clients', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'device_tokens/owner'), { endpoint: 'secret' });
    });

    const ownerDb = testEnv.authenticatedContext('owner').firestore();
    await assertFails(getDoc(doc(ownerDb, 'device_tokens/owner')));
  });
});
