import { Observable } from 'rxjs';

let refreshSessionRequest$: Observable<void> | null = null;
let refreshDisabled = false;

export function getRefreshSessionRequestCache(): Observable<void> | null {
  return refreshSessionRequest$;
}

export function setRefreshSessionRequestCache(request: Observable<void> | null): void {
  refreshSessionRequest$ = request;
}

export function isRefreshDisabled(): boolean {
  return refreshDisabled;
}

export function disableRefresh(): void {
  refreshDisabled = true;
  refreshSessionRequest$ = null;
}

export function resetAuthRefreshState(): void {
  refreshSessionRequest$ = null;
  refreshDisabled = false;
}
