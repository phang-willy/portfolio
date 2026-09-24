import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, NgZone, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, Subscription, catchError, map, switchMap, timer } from 'rxjs';

import { AuthStateService } from '@/app/core/auth/auth-state.service';
import { ApiResponse } from '@/app/shared/models/api-response.model';
import { ServiceHealthCheck, ServiceHealthSnapshot, ServiceHealthSummary, ServiceRestartProgress } from '@/app/shared/models/service-health.model';
import { isAdminRole } from '@/app/shared/models/user-role';
import { environment } from '@/environments/environment';

const API_URL = `${environment.apiUrl.replace(/\/+$/, '')}/admin/service-health`;
const RESTART_ATTEMPTS = 5;
const RESTART_OFFLINE_STEP_MILLIS = 12000;

@Injectable({ providedIn: 'root' })
export class ServiceHealthService {
  private readonly authState = inject(AuthStateService);
  private readonly http = inject(HttpClient);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private stream: EventSource | null = null;
  private started = false;
  private readonly restartPolls = new Map<string, Subscription>();
  private readonly restartStartedAt = new Map<string, number>();

  readonly checks = signal<readonly ServiceHealthCheck[]>([]);
  readonly restartProgress = signal<Readonly<Record<string, ServiceRestartProgress>>>({});
  readonly summary = computed<ServiceHealthSummary>(() => summarize(this.checks()));

  constructor() {
    this.authState.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      if (!isAdminRole(user?.role)) {
        this.disconnect();
        return;
      }
      this.ensureRealtime();
    });
    this.destroyRef.onDestroy(() => this.disconnect());
  }

  startRestart(code: string): void {
    if (this.restartProgress()[code]) {
      return;
    }
    const startedAt = Date.now();
    this.restartStartedAt.set(code, startedAt);
    this.restartProgress.update((current) => ({
      ...current,
      [code]: { code, attempt: 1, maxAttempts: RESTART_ATTEMPTS, running: true, status: 'DOWN' },
    }));
    this.http
      .post<ApiResponse<ServiceRestartProgress>>(`${API_URL}/restart/${code}`, { website: '' }, { withCredentials: true })
      .pipe(map((response) => response.data))
      .subscribe({
        next: (progress) => this.storeRestart(code, progress),
        error: () => this.advanceLocalRestart(code),
      });
    this.pollRestart(code);
  }

  ensureRealtime(): void {
    if (this.started || !isAdminRole(this.authState.getCurrentUser()?.role)) {
      return;
    }
    this.started = true;
    this.refresh();
    this.openStream();
  }

  disconnect(): void {
    this.started = false;
    this.stream?.close();
    this.stream = null;
    this.checks.set([]);
    for (const code of [...this.restartPolls.keys()]) {
      this.stopRestart(code);
    }
  }

  private pollRestart(code: string): void {
    if (this.restartPolls.has(code)) {
      return;
    }
    const subscription = timer(1000, 1000)
      .pipe(
        switchMap(() => this.fetchRestart(code)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((progress) => this.storeRestart(code, progress));
    this.restartPolls.set(code, subscription);
  }

  private fetchRestart(code: string): Observable<ServiceRestartProgress | null> {
    return this.http
      .get<ApiResponse<ServiceRestartProgress>>(`${API_URL}/restart/${code}`, { withCredentials: true })
      .pipe(
        map((response) => response.data ?? null),
        catchError(() => {
          this.advanceLocalRestart(code);
          return EMPTY;
        }),
      );
  }

  private storeRestart(code: string, progress: ServiceRestartProgress | null | undefined): void {
    if (!progress?.running) {
      this.stopRestart(code);
      return;
    }
    this.restartProgress.update((current) => ({ ...current, [code]: progress }));
  }

  private advanceLocalRestart(code: string): void {
    const current = this.restartProgress()[code];
    if (!current) {
      return;
    }
    const startedAt = this.restartStartedAt.get(code) ?? Date.now();
    const elapsed = Date.now() - startedAt;
    if (elapsed >= RESTART_ATTEMPTS * RESTART_OFFLINE_STEP_MILLIS) {
      this.stopRestart(code);
      return;
    }
    const attempt = Math.min(RESTART_ATTEMPTS, 1 + Math.floor(elapsed / RESTART_OFFLINE_STEP_MILLIS));
    this.restartProgress.update((state) => ({
      ...state,
      [code]: { ...current, attempt },
    }));
  }

  private stopRestart(code: string): void {
    this.restartPolls.get(code)?.unsubscribe();
    this.restartPolls.delete(code);
    this.restartStartedAt.delete(code);
    this.restartProgress.update((current) => {
      const next = { ...current };
      delete next[code];
      return next;
    });
  }

  private refresh(): void {
    this.http
      .get<ApiResponse<ServiceHealthCheck[]>>(API_URL, { withCredentials: true })
      .pipe(map((response) => response.data ?? []))
      .subscribe({
        next: (checks) => this.checks.set(checks),
        error: () => {
          // Keep the last snapshot until the stream recovers.
        },
      });
  }

  private openStream(): void {
    if (typeof EventSource === 'undefined') {
      return;
    }

    const stream = new EventSource(`${API_URL}/stream`, { withCredentials: true });
    this.stream = stream;
    stream.addEventListener('service-health', (event: MessageEvent<string>) => {
      if (this.stream === stream) {
        this.ngZone.run(() => this.applySnapshot(event.data));
      }
    });
  }

  private applySnapshot(raw: string): void {
    const snapshot = parseSnapshot(raw);
    if (!snapshot) {
      return;
    }
    this.checks.set(snapshot.checks);
  }
}

function summarize(checks: readonly ServiceHealthCheck[]): ServiceHealthSummary {
  const down = checks.filter((check) => check.status === 'DOWN');
  if (checks.length === 0) {
    return { label: 'API health', value: '…', detail: 'Checking services', tone: 'amber' };
  }
  if (down.length === 0) {
    const api = checks.find((check) => check.code === 'api');
    return {
      label: 'API health',
      value: 'UP',
      detail: api?.endpoint ?? `${checks.length} services`,
      tone: 'green',
    };
  }
  return {
    label: 'API health',
    value: 'DOWN',
    detail: down.length === 1 ? down[0].service : `${down.length} services down`,
    tone: 'red',
  };
}

function parseSnapshot(raw: string): ServiceHealthSnapshot | null {
  try {
    const payload = JSON.parse(raw) as ServiceHealthSnapshot;
    if (!payload || !Array.isArray(payload.checks)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
