import { describe, expect, it } from 'vitest';

import { serviceHref } from '@/app/shared/models/service-health.model';

describe('serviceHref', () => {
  it('links http services and leaves host ports as text', () => {
    expect(serviceHref('http://localhost:3000')).toBe('http://localhost:3000/');
    expect(serviceHref('https://example.com/health')).toBe('https://example.com/health');
    expect(serviceHref('postgres:5432')).toBeNull();
    expect(serviceHref('maildev:1025')).toBeNull();
  });
});
