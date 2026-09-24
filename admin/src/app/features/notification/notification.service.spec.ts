import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthStateService } from '@/app/core/auth/auth-state.service';
import { NotificationService } from '@/app/features/notification/notification.service';
import { AdminNotification } from '@/app/shared/models/notification.model';
import { User } from '@/app/shared/models/user.model';

class MockEventSource {
  static instances: MockEventSource[] = [];

  readonly url: string;
  readonly init?: EventSourceInit;
  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  private readonly listeners = new Map<string, (event: MessageEvent<string>) => void>();

  constructor(url: string, init?: EventSourceInit) {
    this.url = url;
    this.init = init;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: (event: MessageEvent<string>) => void): void {
    this.listeners.set(type, listener);
  }

  close(): void {}

  emit(type: string, data: string): void {
    this.listeners.get(type)?.({ data } as MessageEvent<string>);
  }
}

const ADMIN: User = {
  id: 'admin-id',
  firstname: 'Willy',
  lastname: 'Admin',
  email: 'admin@example.com',
  role: 'SUPER_ADMIN',
};

const ALERT: AdminNotification = {
  id: 'notification-id',
  serviceCode: 'front',
  title: 'Front is down',
  message: 'Front (http://localhost:3000) is not responding.',
  createdAt: '2026-09-24T12:00:00Z',
  read: false,
};

describe('NotificationService', () => {
  let service: NotificationService;
  let http: HttpTestingController;
  let authState: AuthStateService;

  beforeEach(() => {
    MockEventSource.instances = [];
    vi.stubGlobal('EventSource', MockEventSource);

    TestBed.configureTestingModule({
      providers: [NotificationService, AuthStateService, provideHttpClient(), provideHttpClientTesting()],
    });

    authState = TestBed.inject(AuthStateService);
    service = TestBed.inject(NotificationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.unstubAllGlobals();
  });

  it('does not open a stream for a regular user', () => {
    authState.setUser({ ...ADMIN, role: 'USER' });

    http.expectNone('/api/admin/notification/unread-count');
    expect(MockEventSource.instances).toHaveLength(0);
  });

  it('counts a realtime outage once for admins', () => {
    authState.setUser(ADMIN);
    http.expectOne('/api/admin/notification/unread-count').flush({
      success: true,
      code: 200,
      message: 'OK',
      data: { count: 0 },
    });

    const stream = MockEventSource.instances[0];
    expect(stream?.url).toBe('/api/admin/notification/stream');
    expect(stream?.init?.withCredentials).toBe(true);
    stream?.emit('notification', JSON.stringify(ALERT));
    stream?.emit('notification', JSON.stringify(ALERT));

    expect(service.unreadCount()).toBe(1);
    expect(service.notifications()).toEqual([ALERT]);
  });

  it('marks a notification as read with an empty honeypot', () => {
    authState.setUser(ADMIN);
    http.expectOne('/api/admin/notification/unread-count').flush({
      success: true,
      code: 200,
      message: 'OK',
      data: { count: 0 },
    });
    MockEventSource.instances[0]?.emit('notification', JSON.stringify(ALERT));

    service.markRead(ALERT.id).subscribe();

    const request = http.expectOne('/api/admin/notification/read/notification-id');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ website: '' });
    request.flush({
      success: true,
      code: 200,
      message: 'OK',
      data: { ...ALERT, read: true },
    });

    expect(service.unreadCount()).toBe(0);
    expect(service.notifications()[0]?.read).toBe(true);
  });

  it('marks several notifications as read', () => {
    authState.setUser(ADMIN);
    http.expectOne('/api/admin/notification/unread-count').flush({
      success: true,
      code: 200,
      message: 'OK',
      data: { count: 0 },
    });
    const second = { ...ALERT, id: 'notification-2', title: 'API is down' };
    MockEventSource.instances[0]?.emit('notification', JSON.stringify(ALERT));
    MockEventSource.instances[0]?.emit('notification', JSON.stringify(second));

    service.markReadMany([ALERT.id, second.id]).subscribe();

    const requests = http.match((candidate) => candidate.url.startsWith('/api/admin/notification/read/'));
    expect(requests.map((request) => request.request.url).sort()).toEqual([
      '/api/admin/notification/read/notification-2',
      '/api/admin/notification/read/notification-id',
    ]);
    for (const request of requests) {
      expect(request.request.body).toEqual({ website: '' });
      const id = request.request.url.endsWith('notification-2') ? second.id : ALERT.id;
      request.flush({
        success: true,
        code: 200,
        message: 'OK',
        data: { ...(id === second.id ? second : ALERT), read: true },
      });
    }

    expect(service.unreadCount()).toBe(0);
    expect(service.notifications().every((item) => item.read)).toBe(true);
  });
});
