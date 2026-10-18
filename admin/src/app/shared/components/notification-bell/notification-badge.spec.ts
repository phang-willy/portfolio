import { describe, expect, it } from 'vitest';

import { notificationBadgeLabel } from '@/app/shared/components/notification-bell/notification-badge';

describe('notificationBadgeLabel', () => {
  it('hides a zero count and caps the badge at 10+', () => {
    expect(notificationBadgeLabel(0)).toBeNull();
    expect(notificationBadgeLabel(1)).toBe('1');
    expect(notificationBadgeLabel(9)).toBe('9');
    expect(notificationBadgeLabel(10)).toBe('10+');
    expect(notificationBadgeLabel(24)).toBe('10+');
  });
});
