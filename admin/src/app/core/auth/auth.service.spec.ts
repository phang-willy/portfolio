import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AuthStateService } from '@/app/core/auth/auth-state.service';
import { AuthService } from '@/app/core/auth/auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, AuthStateService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads registerEnabled from the public auth config', async () => {
    const enabled$ = service.isRegisterEnabled();

    const promise = firstValueFromSafe(enabled$);
    const request = http.expectOne('/api/auth/config');
    expect(request.request.method).toBe('GET');

    request.flush({
      success: true,
      code: 200,
      message: null,
      data: { registerEnabled: true },
    });

    await expect(promise).resolves.toBe(true);
  });

  it('defaults registerEnabled to false when config cannot be loaded', async () => {
    const enabled$ = service.isRegisterEnabled();

    const promise = firstValueFromSafe(enabled$);
    const request = http.expectOne('/api/auth/config');
    request.flush('Server error', { status: 500, statusText: 'Server Error' });

    await expect(promise).resolves.toBe(false);
  });
});

function firstValueFromSafe<T>(source: import('rxjs').Observable<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    source.subscribe({
      next: resolve,
      error: reject,
    });
  });
}
