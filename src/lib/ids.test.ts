import { describe, expect, it } from 'vitest';
import { createId } from './ids';

describe('createId', () => {
  it('prefixes generated identifiers with the domain prefix', () => {
    expect(createId('task')).toMatch(/^task_/);
  });

  it('generates unique values across rapid calls', () => {
    const ids = Array.from({ length: 50 }, () => createId('x'));
    expect(new Set(ids)).toHaveLength(ids.length);
  });
});
