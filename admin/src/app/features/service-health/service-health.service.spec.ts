import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthStateService } from '@/app/core/auth/auth-state.service';
import { ServiceHealthService } from '@/app/features/service-health/service-health.service';
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

describe('ServiceHealthService', () => {
  let service: ServiceHealthService;
  let http: HttpTestingController;
  let authState: AuthStateService;

  beforeEach(() => {
    MockEventSource.instances = [];
    vi.stubGlobal('EventSource', MockEventSource);

    TestBed.configureTestingModule({
      providers: [ServiceHealthService, AuthStateService, provideHttpClient(), provideHttpClientTesting()],
    });

    authState = TestBed.inject(AuthStateService);
    service = TestBed.inject(ServiceHealthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.unstubAllGlobals();
  });

  it('replaces the dashboard checks from the realtime snapshot', () => {
    authState.setUser(ADMIN);

    http.expectOne('/api/admin/service-health').flush({
      success: true,
      code: 200,
      message: 'OK',
      data: [],
    });

    MockEventSource.instances[0]?.emit(
      'service-health',
      JSON.stringify({
        checks: [
          {
            code: 'front',
            service: 'Front',
            endpoint: 'http://localhost:3000',
            status: 'DOWN',
            checkedAt: '2026-09-24T12:00:00Z',
          },
        ],
      }),
    );

    expect(MockEventSource.instances[0]?.url).toBe('/api/admin/service-health/stream');
    expect(service.checks()).toEqual([
      {
        code: 'front',
        service: 'Front',
        endpoint: 'http://localhost:3000',
        status: 'DOWN',
        checkedAt: '2026-09-24T12:00:00Z',
      },
    ]);
    expect(service.summary()).toEqual({
      label: 'API health',
      value: 'DOWN',
      detail: 'Front',
      tone: 'red',
    });
  });

  it('ignores malformed realtime payloads', () => {
    authState.setUser(ADMIN);
    http.expectOne('/api/admin/service-health').flush({
      success: true,
      code: 200,
      message: 'OK',
      data: [],
    });

    MockEventSource.instances[0]?.emit('service-health', '{');

    expect(service.checks()).toEqual([]);
    expect(service.summary().value).toBe('…');
  });

  it('keeps the restart counter until the procedure finishes', async () => {
    vi.useFakeTimers();
    try {
      authState.setUser(ADMIN);
      http.expectOne('/api/admin/service-health').flush({
        success: true,
        code: 200,
        message: 'OK',
        data: [],
      });

      service.startRestart('front');
      expect(service.restartProgress()['front']).toMatchObject({ attempt: 1, maxAttempts: 5, running: true });

      const start = http.expectOne('/api/admin/service-health/restart/front');
      expect(start.request.body).toEqual({ website: '' });
      start.flush({
        success: true,
        code: 200,
        message: 'OK',
        data: { code: 'front', attempt: 1, maxAttempts: 5, running: true, status: 'DOWN' },
      });

      await vi.advanceTimersByTimeAsync(1000);
      http.expectOne('/api/admin/service-health/restart/front').flush({
        success: true,
        code: 200,
        message: 'OK',
        data: { code: 'front', attempt: 2, maxAttempts: 5, running: true, status: 'DOWN' },
      });
      expect(service.restartProgress()['front']?.attempt).toBe(2);

      await vi.advanceTimersByTimeAsync(1000);
      http.expectOne('/api/admin/service-health/restart/front').flush({
        success: true,
        code: 200,
        message: 'OK',
        data: { code: 'front', attempt: 2, maxAttempts: 5, running: false, status: 'UP' },
      });
      expect(service.restartProgress()['front']).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });
});
