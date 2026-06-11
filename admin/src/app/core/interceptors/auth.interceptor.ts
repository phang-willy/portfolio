import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';

import {
  disableRefresh,
  getRefreshSessionRequestCache,
  isRefreshDisabled,
  setRefreshSessionRequestCache,
} from '@/app/core/auth/auth-refresh.state';
import { AuthService } from '@/app/core/auth/auth.service';
import { environment } from '@/environments/environment';

const API_URL = environment.apiUrl.replace(/\/+$/, '');
const API_BASE_PATH = getUrlPath(API_URL);
const REFRESH_BYPASS_PATHS = new Set([
  `${API_BASE_PATH}/auth/config`,
  `${API_BASE_PATH}/auth/login`,
  `${API_BASE_PATH}/auth/logout`,
  `${API_BASE_PATH}/auth/refresh`,
  `${API_BASE_PATH}/auth/me`,
  `${API_BASE_PATH}/auth/register`,
  `${API_BASE_PATH}/auth/verify-2fa`,
  `${API_BASE_PATH}/auth/forgot-password`,
  `${API_BASE_PATH}/auth/reset-password`,
  `${API_BASE_PATH}/auth/verify-email`,
]);

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);

  const apiRequest = isApiRequest(request.url);
  const credentialsRequest = apiRequest ? request.clone({ withCredentials: true }) : request;

  return next(credentialsRequest).pipe(
    catchError((error: unknown) => {
      if (!shouldRefreshSession(error, credentialsRequest)) {
        return throwError(() => error);
      }

      return getRefreshSessionRequest(auth).pipe(
        switchMap(() =>
          next(credentialsRequest).pipe(
            catchError((retryError: unknown) => {
              disableRefreshAndClearSession(auth, retryError);
              return throwError(() => retryError);
            }),
          ),
        ),
        catchError((refreshError: unknown) => {
          disableRefreshAndClearSession(auth, refreshError);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

function disableRefreshAndClearSession(auth: AuthService, error: unknown): void {
  disableRefresh();

  if (error instanceof HttpErrorResponse && error.status === 401) {
    auth.clearSession();
  }
}

function getRefreshSessionRequest(auth: AuthService): Observable<void> {
  let refreshSessionRequest$ = getRefreshSessionRequestCache();

  if (!refreshSessionRequest$) {
    refreshSessionRequest$ = auth.refresh().pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      finalize(() => {
        setRefreshSessionRequestCache(null);
      }),
    );
    setRefreshSessionRequestCache(refreshSessionRequest$);
  }

  return refreshSessionRequest$;
}

function shouldRefreshSession(
  error: unknown,
  request: HttpRequest<unknown>,
): error is HttpErrorResponse {
  return (
    !isRefreshDisabled() &&
    error instanceof HttpErrorResponse &&
    error.status === 401 &&
    isApiRequest(request.url) &&
    !isRefreshBypassRequest(request.url)
  );
}

function isApiRequest(url: string): boolean {
  const requestUrl = createUrl(url);

  if (!requestUrl) {
    return false;
  }

  const isApiPath =
    requestUrl.pathname === API_BASE_PATH || requestUrl.pathname.startsWith(`${API_BASE_PATH}/`);
  if (!isApiPath) {
    return false;
  }

  if (isRelativeUrl(url)) {
    return true;
  }

  const apiUrl = createUrl(API_URL);
  return Boolean(apiUrl && requestUrl.origin === apiUrl.origin);
}

function isRefreshBypassRequest(url: string): boolean {
  return REFRESH_BYPASS_PATHS.has(getUrlPath(url));
}

function getUrlPath(url: string): string {
  return createUrl(url)?.pathname.replace(/\/+$/, '') || url.replace(/\/+$/, '');
}

function createUrl(url: string): URL | null {
  try {
    return new URL(url, typeof location === 'undefined' ? 'http://localhost' : location.origin);
  } catch {
    return null;
  }
}

function isRelativeUrl(url: string): boolean {
  return !/^[a-z][a-z\d+\-.]*:\/\//i.test(url);
}
