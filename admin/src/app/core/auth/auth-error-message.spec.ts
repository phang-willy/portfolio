import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';

import { resolveApiErrorMessage, resolveAuthErrorMessage } from './auth-error-message';

describe('resolveAuthErrorMessage', () => {
  it('explains when the API cannot be reached', () => {
    const error = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error', url: '/api' });
    expect(resolveAuthErrorMessage(error, 'Fallback')).toContain('Unable to reach the API');
  });

  it('uses the API error message when present', () => {
    const error = new HttpErrorResponse({
      status: 500,
      statusText: 'Error',
      error: { success: false, code: 500, message: 'Database is unavailable' },
    });
    expect(resolveAuthErrorMessage(error, 'Fallback')).toBe('Database is unavailable');
  });
});

describe('resolveApiErrorMessage', () => {
  it('prefixes the action with the HTTP status when the body has no message', () => {
    const error = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });
    expect(resolveApiErrorMessage(error, 'Unable to load the email queue.')).toBe(
      'Unable to load the email queue. The API returned HTTP 500 (Internal Server Error).',
    );
  });

  it('explains a forbidden response', () => {
    const error = new HttpErrorResponse({ status: 403, statusText: 'Forbidden' });
    expect(resolveApiErrorMessage(error, 'Unable to load the email queue.')).toBe(
      'Unable to load the email queue. You do not have permission to do this.',
    );
  });
});
