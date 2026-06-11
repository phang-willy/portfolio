import { describe, expect, it } from 'vitest';

import { HONEYPOT_FIELD_NAME, isHoneypotFilled } from '@/app/shared/utils/honeypot';

describe('honeypot', () => {
  it('exposes the website field name', () => {
    expect(HONEYPOT_FIELD_NAME).toBe('website');
  });

  it('detects filled honeypot values', () => {
    expect(isHoneypotFilled(undefined)).toBe(false);
    expect(isHoneypotFilled(null)).toBe(false);
    expect(isHoneypotFilled('')).toBe(false);
    expect(isHoneypotFilled('   ')).toBe(false);
    expect(isHoneypotFilled('https://spam.example')).toBe(true);
  });
});
