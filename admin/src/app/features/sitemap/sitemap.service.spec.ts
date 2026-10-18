import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SitemapService } from '@/app/features/sitemap/sitemap.service';

describe('SitemapService', () => {
  let service: SitemapService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SitemapService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SitemapService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('asks the admin API to generate the sitemap', () => {
    service.generate().subscribe((result) => {
      expect(result.urlCount).toBe(8);
    });

    const request = http.expectOne('/api/admin/sitemap');
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    request.flush({
      success: true,
      code: 200,
      message: 'OK',
      data: { urlCount: 8 },
    });
  });
});
