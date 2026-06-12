import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { StackService } from '@/app/features/stacks/stack.service';

describe('StackService', () => {
  let service: StackService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StackService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(StackService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('sends the honeypot field in the delete request body', () => {
    service.deleteStack('stack-id', { website: '' }).subscribe();

    const request = http.expectOne('/api/admin/stacks/stack-id');
    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toEqual({ website: '' });
    expect(request.request.withCredentials).toBe(true);

    request.flush({
      success: true,
      code: 200,
      message: 'Stack deleted',
      data: null,
    });
  });
});
