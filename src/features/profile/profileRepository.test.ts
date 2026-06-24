import { describe, expect, it } from 'vitest';
import { normalizePrivacyDoc, normalizeUserProfile } from './profileRepository';

describe('profile repository normalization', () => {
  it('maps missing privacy keys to visible and false keys to hidden', () => {
    expect(normalizePrivacyDoc({ cal: false, money: false })).toEqual({
      cal: false,
      notes: true,
      links: true,
      habits: true,
      money: false,
    });
  });

  it('keeps profile fields predictable when Firestore data is malformed', () => {
    expect(normalizeUserProfile('user-1', { displayName: 42, email: 'u@example.com', partnerId: null })).toEqual({
      uid: 'user-1',
      displayName: '',
      email: 'u@example.com',
      partnerId: null,
      initial: undefined,
    });
  });
});
