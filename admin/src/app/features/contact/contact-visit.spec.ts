import { afterEach, describe, expect, it } from 'vitest';

import {
  clearOpenContactVisit,
  contactVisitStorageKey,
  hasOpenContactVisit,
  isContactDetailUrl,
  markOpenContactVisit,
} from './contact-visit';

describe('contact visit tracking', () => {
  afterEach(() => {
    sessionStorage.removeItem(contactVisitStorageKey('contact-id'));
  });

  it('remembers an open visit in the same tab', () => {
    expect(hasOpenContactVisit('contact-id')).toBe(false);

    markOpenContactVisit('contact-id');

    expect(hasOpenContactVisit('contact-id')).toBe(true);
    clearOpenContactVisit('contact-id');
    expect(hasOpenContactVisit('contact-id')).toBe(false);
  });

  it('treats the enquiry url as the same page across query params', () => {
    expect(isContactDetailUrl('/admin/contact/contact-id', 'contact-id')).toBe(true);
    expect(isContactDetailUrl('/admin/contact/contact-id?x=1', 'contact-id')).toBe(true);
    expect(isContactDetailUrl('/admin/contact', 'contact-id')).toBe(false);
    expect(isContactDetailUrl('/admin/contact/other-id', 'contact-id')).toBe(false);
  });
});
