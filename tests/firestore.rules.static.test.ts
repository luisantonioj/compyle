import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const rules = readFileSync('firestore.rules', 'utf8');

describe('Firestore rules privacy mapping', () => {
  it('uses the canonical app privacy keys for feature collections', () => {
    expect(rules).toContain("visibilityAllowed(uid, 'cal')");
    expect(rules).toContain("visibilityAllowed(uid, 'habits')");
    expect(rules).toContain("visibilityAllowed(uid, 'money')");
    expect(rules).toContain("visibilityAllowed(uid, 'links')");
    expect(rules).toContain("visibilityAllowed(uid, 'notes')");
    expect(rules).toContain('match /users/{uid}/habit_categories/{docId}');
  });

  it('does not use old privacy key names in access rules', () => {
    expect(rules).not.toContain("visibilityAllowed(uid, 'tasks')");
    expect(rules).not.toContain("visibilityAllowed(uid, 'budget')");
    expect(rules).not.toContain("visibilityAllowed(uid, 'payments')");
  });

  it('keeps top-level device tokens unreadable to clients', () => {
    expect(rules).toContain('match /device_tokens/{uid}');
    expect(rules).toContain('allow read:  if false;');
  });
});
