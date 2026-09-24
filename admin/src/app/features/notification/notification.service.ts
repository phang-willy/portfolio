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

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly authState = inject(AuthStateService);
  private readonly http = inject(HttpClient);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private stream: EventSource | null = null;
  private started = false;
  private countRevision = 0;

  readonly notifications = signal<readonly AdminNotification[]>([]);
  readonly unreadCount = signal(0);
  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);

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
    this.notifications.set([]);
    this.unreadCount.set(0);
  }

  load(): void {
    if (!isAdminRole(this.authState.getCurrentUser()?.role)) {
      return;
    }
    this.isLoading.set(this.notifications().length === 0);
    this.loadError.set(null);
    this.http
      .get<PaginatedApiResponse<AdminNotification>>(API_URL, {
        params: { page: 0, size: 50 },
        withCredentials: true,
      })
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.notifications.set(response.data);
        },
        error: () => {
          this.isLoading.set(false);
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
