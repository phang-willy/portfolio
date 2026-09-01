import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, tap } from 'rxjs';

import { AuthStateService } from '@/app/core/auth/auth-state.service';
import { resolveApiErrorMessage } from '@/app/core/auth/auth-error-message';
import { ApiResponse, PaginatedApiResponse } from '@/app/shared/models/api-response.model';
import {
  EmailQueueAdminListItem,
  EmailQueueFailedCount,
  EmailQueueRealtimeEvent,
  EmailQueueResendInput,
  PageResponse,
} from '@/app/shared/models/email-queue.model';
import { environment } from '@/environments/environment';

const API_URL = environment.apiUrl.replace(/\/+$/, '');
const STREAM_URL = `${API_URL}/admin/email-queue/stream`;
const REALTIME_EVENT = 'email-queue';

@Injectable({ providedIn: 'root' })
export class EmailQueueService {
  private readonly authState = inject(AuthStateService);
  private readonly http = inject(HttpClient);
  private readonly ngZone = inject(NgZone);

  private stream: EventSource | null = null;
  private started = false;
  private hasOpenedStream = false;

  readonly emails = signal<readonly EmailQueueAdminListItem[]>([]);
  readonly failedCount = signal(0);
  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);

  constructor() {
    this.authState.currentUser$.subscribe((user) => {
      if (!user) {
        this.disconnect();
      }
    });
  }

  ensureRealtime(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.refreshSnapshot();
    this.openStream();
  }

  disconnect(): void {
    this.started = false;
    this.hasOpenedStream = false;
    this.stream?.close();
    this.stream = null;
  }

  getEmails(page = 0, size = 50): Observable<PageResponse<EmailQueueAdminListItem>> {
    return this.http
      .get<PaginatedApiResponse<EmailQueueAdminListItem>>(`${API_URL}/admin/email-queue`, {
        params: { page, size },
        withCredentials: true,
      })
      .pipe(map((response) => ({ data: response.data, pagination: response.pagination })));
  }

  getFailedCount(): Observable<number> {
    return this.http
      .get<ApiResponse<EmailQueueFailedCount>>(`${API_URL}/admin/email-queue/failed-count`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => response.data.count),
        catchError(() => of(0)),
      );
  }

  resendEmail(
    id: string,
    payload: EmailQueueResendInput = {},
  ): Observable<EmailQueueAdminListItem> {
    return this.http
      .put<ApiResponse<EmailQueueAdminListItem>>(
        `${API_URL}/admin/email-queue/resend/${id}`,
        payload,
        { withCredentials: true },
      )
      .pipe(
        map((response) => response.data),
        tap((email) => {
          if (email) {
            this.upsertEmail(email);
          }
        }),
      );
  }

  private refreshSnapshot(): void {
    this.isLoading.set(this.emails().length === 0);
    this.loadError.set(null);

    forkJoin({
      emails: this.getEmails(0, 200),
      failedCount: this.getFailedCount(),
    })
      .pipe(
        catchError((error: unknown) => {
          this.loadError.set(resolveApiErrorMessage(error, 'Unable to load the email queue.'));
          return of(null);
        }),
      )
      .subscribe((snapshot) => {
        this.isLoading.set(false);
        if (!snapshot) {
          return;
        }

        this.emails.set(snapshot.emails.data);
        this.failedCount.set(snapshot.failedCount);
      });
  }

  private openStream(): void {
    if (typeof EventSource === 'undefined') {
      return;
    }

    this.stream?.close();
    this.stream = new EventSource(STREAM_URL, { withCredentials: true });
    this.stream.addEventListener(REALTIME_EVENT, (event: MessageEvent<string>) => {
      this.ngZone.run(() => this.applyRealtimeEvent(event.data));
    });
    this.stream.onopen = () => {
      this.ngZone.run(() => {
        if (this.hasOpenedStream) {
          this.refreshSnapshot();
        }
        this.hasOpenedStream = true;
      });
    };
    this.stream.onerror = () => {
      this.hasOpenedStream = true;
    };
  }

  private applyRealtimeEvent(raw: string): void {
    const payload = parseRealtimeEvent(raw);
    if (!payload) {
      return;
    }

    this.failedCount.set(payload.failedCount);
    if (payload.email) {
      this.upsertEmail(payload.email);
    }
  }

  private upsertEmail(email: EmailQueueAdminListItem): void {
    this.emails.update((items) => {
      const index = items.findIndex((item) => item.id === email.id);
      if (index === -1) {
        return [email, ...items];
      }

      const next = [...items];
      next[index] = email;
      return next;
    });
  }
}

function parseRealtimeEvent(raw: string): EmailQueueRealtimeEvent | null {
  try {
    const payload = JSON.parse(raw) as EmailQueueRealtimeEvent;
    if (!payload || typeof payload.failedCount !== 'number') {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
