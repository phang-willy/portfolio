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

  const bodyMessage = readErrorBodyMessage(error.error);
  if (bodyMessage) {
    return bodyMessage;
  }

  return describeStatus(error.status) ?? fallback;
}

export function resolveApiErrorMessage(error: unknown, action: string): string {
  const detail = resolveAuthErrorMessage(error, httpStatusFallback(error));
  return `${action} ${detail}`;
}

function readErrorBodyMessage(body: unknown): string | null {
  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (isRecord(body) && typeof body['message'] === 'string' && body['message'].trim()) {
    return body['message'];
  }

  return null;
}

function describeStatus(status: number): string | null {
  switch (status) {
    case 401:
      return 'Your session expired. Please sign in again.';
    case 403:
      return 'You do not have permission to do this.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please wait and try again.';
    default:
      return null;
  }
}

function httpStatusFallback(error: unknown): string {
  if (!(error instanceof HttpErrorResponse) || !error.status) {
    return 'An unexpected error occurred.';
  }

  const named = describeStatus(error.status);
  if (named) {
    return named;
  }

  const statusText = error.statusText?.trim();
  const suffix = statusText && statusText !== 'Unknown Error' ? ` (${statusText})` : '';
  return `The API returned HTTP ${error.status}${suffix}.`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
