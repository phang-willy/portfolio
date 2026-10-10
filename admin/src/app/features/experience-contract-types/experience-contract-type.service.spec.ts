import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ExperienceContractTypeService } from '@/app/features/experience-contract-types/experience-contract-type.service';

describe('ExperienceContractTypeService', () => {
  let service: ExperienceContractTypeService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExperienceContractTypeService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ExperienceContractTypeService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('lists contract types with pagination params', () => {
    service.getContractTypes(0, 50).subscribe((response) => {
      expect(response.data).toEqual([]);
      expect(response.pagination.size).toBe(50);
    });

    const request = http.expectOne('/api/admin/experience-contract-type?page=0&size=50');
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);

    request.flush({
      success: true,
      code: 200,
      message: 'OK',
      data: [],
      pagination: { page: 0, size: 50, totalItems: 0, totalPages: 0 },
    });
  });

  it('creates a contract type with credentials', () => {
    const payload = {
      fr: { title: 'Alternance' },
      en: { title: 'Work-study' },
      website: '',
    };

    service.createContractType(payload).subscribe((detail) => {
      expect(detail.slug).toBe('alternance');
    });

    const request = http.expectOne('/api/admin/experience-contract-type');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    expect(request.request.withCredentials).toBe(true);

    request.flush({
      success: true,
      code: 200,
      message: 'OK',
      data: {
        id: 'ct-id',
        slug: 'alternance',
        codeFr: 'alternance-fr',
        codeEn: 'work-study-en',
        fr: payload.fr,
        en: payload.en,
      },
    });
  });

  it('sends the honeypot field in the delete request body', () => {
    service.deleteContractType('ct-id', { website: '' }).subscribe();

    const request = http.expectOne('/api/admin/experience-contract-type/ct-id');
    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toEqual({ website: '' });
    expect(request.request.withCredentials).toBe(true);

    request.flush({
      success: true,
      code: 200,
      message: 'Experience contract type deleted',
      data: null,
    });
  });

  it('deactivates a contract type with honeypot payload', () => {
    service.deactivateContractType('ct-id', { website: '' }).subscribe();

    const request = http.expectOne('/api/admin/experience-contract-type/deactivate/ct-id');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ website: '' });
    expect(request.request.withCredentials).toBe(true);

    request.flush({
      success: true,
      code: 200,
      message: 'Experience contract type deactivated',
      data: null,
    });
  });
});
