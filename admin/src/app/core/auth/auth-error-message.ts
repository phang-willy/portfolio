import { HttpErrorResponse } from '@angular/common/http';

export function resolveAuthErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
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
