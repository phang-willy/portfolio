import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, NgZone, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, forkJoin, map, of, tap } from 'rxjs';

import { AuthStateService } from '@/app/core/auth/auth-state.service';
import { ApiResponse, PaginatedApiResponse } from '@/app/shared/models/api-response.model';
import { AdminNotification } from '@/app/shared/models/notification.model';
import { isAdminRole } from '@/app/shared/models/user-role';
import { environment } from '@/environments/environment';

const API_URL = `${environment.apiUrl.replace(/\/+$/, '')}/admin/notification`;
const READ_PAGE_SIZE = 10;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly authState = inject(AuthStateService);
  private readonly http = inject(HttpClient);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private stream: EventSource | null = null;
  private started = false;
  private countRevision = 0;
  private loadGeneration = 0;
  private readPage = 0;

  readonly notifications = signal<readonly AdminNotification[]>([]);
  readonly unreadCount = signal(0);
  readonly isLoading = signal(false);
  readonly isLoadingMore = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly nextReadCount = signal(0);

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

  ensureRealtime(): void {
    if (this.started || !isAdminRole(this.authState.getCurrentUser()?.role)) {
      return;
    }
    this.started = true;
    this.refreshUnreadCount();
    this.openStream();
  }

  disconnect(): void {
    this.started = false;
    this.stream?.close();
    this.stream = null;
    this.countRevision++;
    this.loadGeneration++;
    this.readPage = 0;
    this.notifications.set([]);
    this.unreadCount.set(0);
    this.nextReadCount.set(0);
    this.isLoadingMore.set(false);
  }

  load(): void {
    if (!isAdminRole(this.authState.getCurrentUser()?.role)) {
      return;
    }
    const generation = ++this.loadGeneration;
    this.isLoading.set(this.notifications().length === 0);
    this.isLoadingMore.set(false);
    this.loadError.set(null);
    this.fetchPage(0, generation, false);
  }

  loadMore(): void {
    if (this.nextReadCount() === 0 || this.isLoading() || this.isLoadingMore()) {
      return;
    }
    const generation = this.loadGeneration;
    this.isLoadingMore.set(true);
    this.loadError.set(null);
    this.fetchPage(this.readPage + 1, generation, true);
  }

  private fetchPage(page: number, generation: number, append: boolean): void {
    this.http
      .get<PaginatedApiResponse<AdminNotification>>(API_URL, {
        params: { page, size: READ_PAGE_SIZE },
        withCredentials: true,
      })
      .subscribe({
        next: (response) => {
          if (generation !== this.loadGeneration) {
            return;
          }
          const incoming = response.data ?? [];
          this.readPage = response.pagination?.page ?? page;
          this.nextReadCount.set(nextReadBatchSize(response.pagination));
          this.notifications.update((items) => (append ? appendUnique(items, incoming) : incoming));
          this.isLoading.set(false);
          this.isLoadingMore.set(false);
        },
        error: () => {
          if (generation !== this.loadGeneration) {
            return;
          }
          this.isLoading.set(false);
          this.isLoadingMore.set(false);
          this.loadError.set('Unable to load notifications.');
        },
      });
  }

  markRead(id: string): Observable<AdminNotification> {
    const current = this.notifications().find((item) => item.id === id);
    return this.http
      .put<ApiResponse<AdminNotification>>(`${API_URL}/read/${encodeURIComponent(id)}`, { website: '' }, {
        withCredentials: true,
      })
      .pipe(
        map((response) => response.data),
        tap((notification) => {
          if (!notification) {
            return;
          }
          this.notifications.update((items) =>
            items.map((item) => (item.id === id ? notification : item)),
          );
          if (current && !current.read) {
            this.countRevision++;
            this.unreadCount.update((count) => Math.max(0, count - 1));
          }
        }),
      );
  }

  markReadMany(ids: readonly string[]): Observable<readonly AdminNotification[]> {
    const unreadIds = ids.filter((id) => {
      const current = this.notifications().find((item) => item.id === id);
      return current != null && !current.read;
    });
    if (unreadIds.length === 0) {
      return of([]);
    }
    return forkJoin(unreadIds.map((id) => this.markRead(id)));
  }

  markAllRead(): Observable<void> {
    return this.http
      .put<ApiResponse<{ count: number }>>(`${API_URL}/read`, { website: '' }, { withCredentials: true })
      .pipe(
        tap(() => {
          this.countRevision++;
          this.unreadCount.set(0);
          this.notifications.update((items) => items.map((item) => (item.read ? item : { ...item, read: true })));
        }),
        map(() => undefined),
      );
  }

  private refreshUnreadCount(): void {
    const revision = this.countRevision;
    this.http
      .get<ApiResponse<{ count: number }>>(`${API_URL}/unread-count`, { withCredentials: true })
      .subscribe({
        next: ({ data }) => {
          if (revision === this.countRevision) {
            this.unreadCount.set(data.count);
          }
        },
        error: () => {
          // Keep the last count until the next snapshot.
        },
      });
  }

  private openStream(): void {
    if (typeof EventSource === 'undefined') {
      return;
    }

    const stream = new EventSource(`${API_URL}/stream`, { withCredentials: true });
    this.stream = stream;
    stream.addEventListener('notification', (event: MessageEvent<string>) => {
      if (this.stream === stream) {
        this.ngZone.run(() => this.applyNotification(event.data));
      }
    });
  }

  private applyNotification(raw: string): void {
    const notification = parseNotification(raw);
    if (!notification || this.notifications().some((item) => item.id === notification.id)) {
      return;
    }
    this.notifications.update((items) => [notification, ...items]);
    if (!notification.read) {
      this.countRevision++;
      this.unreadCount.update((count) => count + 1);
    }
  }
}

function nextReadBatchSize(
  pagination: PaginatedApiResponse<AdminNotification>['pagination'] | undefined,
): number {
  if (!pagination) {
    return 0;
  }
  const loadedRead = (pagination.page + 1) * pagination.size;
  const remaining = Math.max(0, pagination.totalItems - loadedRead);
  return Math.min(pagination.size, remaining);
}

function appendUnique(
  current: readonly AdminNotification[],
  incoming: readonly AdminNotification[],
): readonly AdminNotification[] {
  const seen = new Set(current.map((item) => item.id));
  const next = incoming.filter((item) => !seen.has(item.id));
  return next.length === 0 ? current : current.concat(next);
}

function parseNotification(raw: string): AdminNotification | null {
  try {
    const payload = JSON.parse(raw) as AdminNotification;
    if (!payload?.id || !payload.title) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
