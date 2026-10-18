import { afterEach, describe, expect, it } from 'vitest';

import {
  clearPresenceSessionId,
  isPresenceReadOnly,
  occupantForUser,
  presenceSessionId,
  presenceSessionStorageKey,
} from './contact-presence';

describe('contact presence helpers', () => {
  afterEach(() => {
    sessionStorage.removeItem(presenceSessionStorageKey('contact-id'));
  });

  it('reuses the same session id after a tab reload', () => {
    const first = presenceSessionId('contact-id');
    const second = presenceSessionId('contact-id');

    expect(second).toBe(first);
    clearPresenceSessionId('contact-id');
    expect(presenceSessionId('contact-id')).not.toBe(first);
  });

  it('marks a later viewer as read-only and exposes the occupant', () => {
    const viewers = [
      { userId: 'owner-id', name: 'Willy Admin', joinedAt: '2026-09-21T21:00:00.000Z' },
      { userId: 'guest-id', name: 'Léa Admin', joinedAt: '2026-09-21T21:05:00.000Z' },
    ];

    expect(isPresenceReadOnly(viewers, 'guest-id')).toBe(true);
    expect(isPresenceReadOnly(viewers, 'owner-id')).toBe(false);
    expect(occupantForUser(viewers, 'guest-id')?.name).toBe('Willy Admin');
  });
});
