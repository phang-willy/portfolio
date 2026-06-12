import { HttpErrorResponse } from '@angular/common/http';

export function resolveAuthErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  if (error.status === 0) {
    return 'Unable to reach the API. Make sure the backend is running on port 8000.';
  }

  if (error.status >= 502 && error.status <= 504) {
    return 'The API is temporarily unavailable. Check that the backend is running.';
  }

  const body = error.error;
  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (isRecord(body) && typeof body['message'] === 'string' && body['message'].trim()) {
    return body['message'];
  }

  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
