import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthStateService } from '@/app/core/auth/auth-state.service';
import { EmailQueueService } from '@/app/features/email-queue/email-queue.service';
import { EmailQueueAdminListItem } from '@/app/shared/models/email-queue.model';

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

describe('EmailQueueService', () => {
  let service: EmailQueueService;
  let http: HttpTestingController;

  const item: EmailQueueAdminListItem = {
    id: 'email-id',
    recipient: 'user@example.com',
    subject: 'Verify your email',
    status: 'SENT',
    attempts: 1,
    maxAttempts: 3,
    lastError: null,
    scheduledAt: '2026-01-01T10:00:00.000Z',
    sentAt: '2026-01-01T10:01:00.000Z',
    createdAt: '2026-01-01T10:00:00.000Z',
  };

  beforeEach(() => {
    MockEventSource.instances = [];
    vi.stubGlobal('EventSource', MockEventSource);

    TestBed.configureTestingModule({
      providers: [EmailQueueService, AuthStateService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(EmailQueueService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.unstubAllGlobals();
  });

  it('lists email queue items with pagination params and does not request a body field', () => {
    service.getEmails(0, 200).subscribe((response) => {
      expect(response.data).toEqual([item]);
      expect(response.pagination.totalItems).toBe(1);
      expect(item).not.toHaveProperty('body');
    });

    const request = http.expectOne('/api/admin/email-queue?page=0&size=200');
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);

    request.flush({
      success: true,
      code: 200,
      message: 'OK',
      data: [item],
      pagination: { page: 0, size: 200, totalItems: 1, totalPages: 1 },
    });
  });

  it('loads the failed email count', () => {
    service.getFailedCount().subscribe((count) => {
      expect(count).toBe(3);
    });

    const request = http.expectOne('/api/admin/email-queue/failed-count');
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);

    request.flush({
      success: true,
      code: 200,
      message: 'OK',
      data: { count: 3 },
    });
  });

  it('returns 0 when the failed count request fails', () => {
    service.getFailedCount().subscribe((count) => {
      expect(count).toBe(0);
    });

    const request = http.expectOne('/api/admin/email-queue/failed-count');
    request.flush(
      { success: false, code: 500, message: 'Error', data: null },
      { status: 500, statusText: 'Error' },
    );
  });

  it('upserts realtime emails and failed count from the SSE stream', () => {
    service.ensureRealtime();

    http.expectOne('/api/admin/email-queue?page=0&size=200').flush({
      success: true,
      code: 200,
      message: 'OK',
      data: [],
      pagination: { page: 0, size: 200, totalItems: 0, totalPages: 0 },
    });
    http.expectOne('/api/admin/email-queue/failed-count').flush({
      success: true,
      code: 200,
      message: 'OK',
      data: { count: 0 },
    });

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0]?.url).toBe('/api/admin/email-queue/stream');
    expect(MockEventSource.instances[0]?.init?.withCredentials).toBe(true);

    const pending: EmailQueueAdminListItem = { ...item, status: 'PENDING', sentAt: null, attempts: 0 };
    MockEventSource.instances[0]?.emit(
      'email-queue',
      JSON.stringify({ email: pending, failedCount: 0 }),
    );

    expect(service.emails()).toEqual([pending]);
    expect(service.failedCount()).toBe(0);

    const failed: EmailQueueAdminListItem = {
      ...pending,
      status: 'FAILED',
      attempts: 3,
      lastError: [{ at: '2026-01-01T10:00:00.000Z', message: 'boom' }],
    };
    MockEventSource.instances[0]?.emit(
      'email-queue',
      JSON.stringify({ email: failed, failedCount: 1 }),
    );

    expect(service.emails()).toEqual([failed]);
    expect(service.failedCount()).toBe(1);
  });

  it('resends a failed email and upserts the returned item', () => {
    const pending: EmailQueueAdminListItem = {
      ...item,
      status: 'PENDING',
      sentAt: null,
      attempts: 0,
      lastError: [{ at: '2026-01-01T10:00:00.000Z', message: 'boom' }],
    };

    service.resendEmail('email-id', { website: '' }).subscribe((response) => {
      expect(response).toEqual(pending);
    });

    const request = http.expectOne('/api/admin/email-queue/resend/email-id');
    expect(request.request.method).toBe('PUT');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toEqual({ website: '' });

    request.flush({
      success: true,
      code: 200,
      message: 'OK',
      data: pending,
    });

    expect(service.emails()).toEqual([pending]);
  });

  it('explains why the email queue failed to load', () => {
    service.ensureRealtime();

    http.expectOne('/api/admin/email-queue/failed-count').flush({
      success: true,
      code: 200,
      message: 'OK',
      data: { count: 0 },
    });
    http.expectOne('/api/admin/email-queue?page=0&size=200').flush(
      { success: false, code: 500, message: 'Database is unavailable', data: null },
      { status: 500, statusText: 'Internal Server Error' },
    );

    expect(service.loadError()).toBe(
      'Unable to load the email queue. Database is unavailable',
    );
    expect(service.emails()).toEqual([]);
  });
});
