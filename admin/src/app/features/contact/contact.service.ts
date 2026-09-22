import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, NgZone, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, Subscription, map, takeUntil, tap } from 'rxjs';

import { AuthStateService } from '@/app/core/auth/auth-state.service';
import { isAdminRole } from '@/app/shared/models/user-role';
import { ApiResponse, PaginatedApiResponse } from '@/app/shared/models/api-response.model';
import {
  ContactAdminDetail,
  ContactAdminListItem,
  ContactListQuery,
  ContactPage,
  ContactPresenceEvent,
  ContactPresenceState,
  ContactRealtimeEvent,
  ContactReplyInput,
} from '@/app/shared/models/contact.model';
import { environment } from '@/environments/environment';

const API_URL = `${environment.apiUrl.replace(/\/+$/, '')}/admin/contact`;

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly authState = inject(AuthStateService);
  private readonly http = inject(HttpClient);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changesSubject = new Subject<ContactAdminListItem | null>();
  private readonly presenceSubject = new Subject<ContactPresenceEvent>();
  private readonly sessionEndedSubject = new Subject<void>();
  private stream: EventSource | null = null;
  private countRequest?: Subscription;
  private started = false;
  private countRevision = 0;

  readonly unreadCount = signal(0);
  readonly changes$ = this.changesSubject.asObservable();
  readonly presence$ = this.presenceSubject.asObservable();
  readonly sessionEnded$ = this.sessionEndedSubject.asObservable();

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
    if (typeof EventSource === 'undefined') {
      return;
    }

    const stream = new EventSource(`${API_URL}/stream`, { withCredentials: true });
    this.stream = stream;
    stream.addEventListener('contact', (event: MessageEvent<string>) => {
      if (this.stream === stream) {
        this.ngZone.run(() => this.applyRealtimeEvent(event.data));
      }
    });
    stream.addEventListener('presence', (event: MessageEvent<string>) => {
      if (this.stream === stream) {
        this.ngZone.run(() => this.applyPresenceEvent(event.data));
      }
    });
    stream.onopen = () => {
      if (this.stream === stream) {
        this.ngZone.run(() => {
          // Also resync on the first open: a change may precede stream registration.
          this.refreshUnreadCount();
          this.changesSubject.next(null);
        });
      }
    };
  }

  disconnect(): void {
    this.started = false;
    this.stream?.close();
    this.stream = null;
    this.countRequest?.unsubscribe();
    this.countRevision++;
    this.sessionEndedSubject.next();
    this.unreadCount.set(0);
  }

  getContacts(query: ContactListQuery): Observable<ContactPage> {
    const params: Record<string, string | number> = { page: query.page, size: query.size };
    if (query.search.trim()) params['search'] = query.search.trim();
    if (query.status) params['status'] = query.status;
    return this.http
      .get<PaginatedApiResponse<ContactAdminListItem>>(API_URL, { params, withCredentials: true })
      .pipe(
        map(({ data, pagination }) => ({ data, pagination })),
        takeUntil(this.sessionEnded$),
      );
  }

  getContact(id: string): Observable<ContactAdminDetail> {
    return this.http
      .get<ApiResponse<ContactAdminDetail>>(`${API_URL}/${encodeURIComponent(id)}`, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data), takeUntil(this.sessionEnded$));
  }

  markRead(id: string): Observable<ContactAdminDetail> {
    return this.http
      .put<ApiResponse<ContactAdminDetail>>(
        `${API_URL}/${encodeURIComponent(id)}/read`,
        { website: '' },
        { withCredentials: true },
      )
      .pipe(
        map((response) => response.data),
        tap(() => this.refreshUnreadCount()),
        takeUntil(this.sessionEnded$),
      );
  }

  reply(id: string, payload: ContactReplyInput): Observable<ContactAdminDetail> {
    return this.http
      .post<ApiResponse<ContactAdminDetail>>(`${API_URL}/${encodeURIComponent(id)}/reply`, payload, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data), takeUntil(this.sessionEnded$));
  }

  heartbeat(id: string, sessionId: string): Observable<ContactPresenceState> {
    return this.http
      .put<ApiResponse<ContactPresenceState>>(
        `${API_URL}/${encodeURIComponent(id)}/presence`,
        { sessionId, website: '' },
        { withCredentials: true },
      )
      .pipe(map((response) => response.data), takeUntil(this.sessionEnded$));
  }

  leave(id: string, sessionId: string): Observable<ContactPresenceState> {
    return this.http
      .delete<ApiResponse<ContactPresenceState>>(
        `${API_URL}/${encodeURIComponent(id)}/presence`,
        { params: { sessionId }, withCredentials: true },
      )
      .pipe(map((response) => response.data), takeUntil(this.sessionEnded$));
  }

  private refreshUnreadCount(): void {
    if (!this.started) return;
    this.countRequest?.unsubscribe();
    const revision = this.countRevision;
    this.countRequest = this.http
      .get<ApiResponse<{ count: number }>>(`${API_URL}/unread-count`, { withCredentials: true })
      .pipe(takeUntil(this.sessionEnded$))
      .subscribe({
        next: ({ data }) => {
          // An SSE count received while this request was running is more recent.
          if (revision === this.countRevision) this.unreadCount.set(data.count);
        },
        error: () => {
          // Keep the last known count until the stream or next snapshot recovers.
        },
      });
  }

  private applyRealtimeEvent(raw: string): void {
    const payload = parseContactEvent(raw);
    if (!payload) return;
    this.countRevision++;
    this.unreadCount.set(payload.unreadCount);
    this.changesSubject.next(payload.contact);
  }
  private applyPresenceEvent(raw: string): void {
    const payload = parsePresenceEvent(raw);
    if (payload) {
      this.presenceSubject.next(payload);
    }
  }
}

function parseContactEvent(raw: string): ContactRealtimeEvent | null {
  try {
    const payload = JSON.parse(raw) as ContactRealtimeEvent;
    if (!payload || !Number.isSafeInteger(payload.unreadCount) || payload.unreadCount < 0) return null;
    if (payload.contact != null && typeof payload.contact.id !== 'string') return null;
    return { ...payload, contact: payload.contact ?? null };
  } catch {
    return null;
  }
}

function parsePresenceEvent(raw: string): ContactPresenceEvent | null {
  try {
    const payload = JSON.parse(raw) as ContactPresenceEvent;
    if (!payload || typeof payload.contactId !== 'string' || !Array.isArray(payload.viewers)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
