import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminPage } from '@/app/features/admin/admin-page';
import { AuthStateService } from '@/app/core/auth/auth-state.service';
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
  role: 'ADMIN',
};

describe('AdminPage', () => {
  let fixture: ComponentFixture<AdminPage>;
  let http: HttpTestingController;

  beforeEach(() => {
    MockEventSource.instances = [];
    vi.stubGlobal('EventSource', MockEventSource);

    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });

    TestBed.inject(AuthStateService).setUser(ADMIN);
    fixture = TestBed.createComponent(AdminPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    vi.unstubAllGlobals();
  });

  it('shows live counts and hides placeholder metrics', () => {
    const textBefore = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(textBefore).not.toContain('Deployments');
    expect(textBefore).not.toContain('3 drafts');
    expect(textBefore).toContain('Loading projects');

    http.expectOne('/api/admin/contact/unread-count').flush({
      success: true,
      code: 200,
      message: 'OK',
      data: { count: 2 },
    });
    http.expectOne('/api/admin/service-health').flush({
      success: true,
      code: 200,
      message: 'OK',
      data: [
        {
          code: 'api',
          service: 'API',
          endpoint: 'http://localhost:8080/api/health',
          status: 'UP',
          checkedAt: '2026-10-02T12:00:00Z',
          restartable: false,
        },
      ],
    });
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
      data: { count: 1 },
    });
    http.expectOne('/api/admin/project?page=0&size=1').flush({
      success: true,
      code: 200,
      message: 'OK',
      data: [],
      pagination: { page: 0, size: 1, totalItems: 4, totalPages: 4 },
    });

    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('2 unread enquiries');
    expect(text).toContain('4 projects');
    expect(text).toContain('1 failed email');
    expect(text).toContain('UP');
    expect(text).not.toContain('Deployments');
  });

  it('does not present an unknown failed count as zero', () => {
    const textBefore = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(textBefore).toContain('Loading failed count');
    expect(textBefore).not.toContain('0 failed emails');

    flushDashboard({ failedCountStatus: 500 });
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Unable to load failed count');
    expect(text).not.toContain('0 failed emails');

    const emailStream = MockEventSource.instances.find((stream) =>
      stream.url.endsWith('/admin/email-queue/stream'),
    );
    emailStream?.emit(
      'email-queue',
      JSON.stringify({
        email: null,
        failedCount: 2,
      }),
    );
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('2 failed emails');
  });
});

function flushDashboard(options: { failedCountStatus?: number; failedCount?: number } = {}): void {
  const http = TestBed.inject(HttpTestingController);
  http.expectOne('/api/admin/contact/unread-count').flush({
    success: true,
    code: 200,
    message: 'OK',
    data: { count: 0 },
  });
  http.expectOne('/api/admin/service-health').flush({
    success: true,
    code: 200,
    message: 'OK',
    data: [],
  });
  http.expectOne('/api/admin/email-queue?page=0&size=200').flush({
    success: true,
    code: 200,
    message: 'OK',
    data: [],
    pagination: { page: 0, size: 200, totalItems: 0, totalPages: 0 },
  });
  const failedCount = http.expectOne('/api/admin/email-queue/failed-count');
  if (options.failedCountStatus) {
    failedCount.flush(
      { success: false, code: options.failedCountStatus, message: 'Error', data: null },
      { status: options.failedCountStatus, statusText: 'Error' },
    );
  } else {
    failedCount.flush({
      success: true,
      code: 200,
      message: 'OK',
      data: { count: options.failedCount ?? 0 },
    });
  }
  http.expectOne('/api/admin/project?page=0&size=1').flush({
    success: true,
    code: 200,
    message: 'OK',
    data: [],
    pagination: { page: 0, size: 1, totalItems: 0, totalPages: 0 },
  });
}
