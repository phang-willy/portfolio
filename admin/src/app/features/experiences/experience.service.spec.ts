import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ExperienceService } from '@/app/features/experiences/experience.service';

describe('ExperienceService', () => {
  let service: ExperienceService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExperienceService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ExperienceService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('lists experiences with pagination params', () => {
    service.getExperiences(1, 25).subscribe((response) => {
      expect(response.data).toEqual([]);
      expect(response.pagination.page).toBe(1);
    });

    const request = http.expectOne('/api/admin/experience?page=1&size=25');
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);

    request.flush({
      success: true,
      code: 200,
      message: 'OK',
      data: [],
      pagination: { page: 1, size: 25, totalItems: 0, totalPages: 0 },
    });
  });

  it('creates an experience with credentials', () => {
    const payload = {
      company: 'Logistib',
      yearStart: 2020,
      yearEnd: 2022,
      contractTypeId: null,
      fr: { role: 'Intégrateur Web', summary: '', content: '' },
      en: { role: 'Web integrator', summary: '', content: '' },
      website: '',
    };

    service.createExperience(payload).subscribe((detail) => {
      expect(detail.company).toBe('Logistib');
    });

    const request = http.expectOne('/api/admin/experience');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    expect(request.request.withCredentials).toBe(true);

    request.flush({
      success: true,
      code: 200,
      message: 'OK',
      data: {
        id: 'exp-id',
        company: 'Logistib',
        yearStart: 2020,
        yearEnd: 2022,
        contractTypeId: null,
        slugFr: 'logistib-integrateur-web-2020-2022-fr',
        slugEn: 'logistib-web-integrator-2020-2022-en',
        fr: payload.fr,
        en: payload.en,
      },
    });
  });

  it('sends the honeypot field in the delete request body', () => {
    service.deleteExperience('exp-id', { website: '' }).subscribe();

    const request = http.expectOne('/api/admin/experience/exp-id');
    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toEqual({ website: '' });
    expect(request.request.withCredentials).toBe(true);

    request.flush({
      success: true,
      code: 200,
      message: 'Experience deleted',
      data: null,
    });
  });

  it('deactivates an experience with honeypot payload', () => {
    service.deactivateExperience('exp-id', { website: '' }).subscribe();

    const request = http.expectOne('/api/admin/experience/deactivate/exp-id');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ website: '' });
    expect(request.request.withCredentials).toBe(true);

    request.flush({
      success: true,
      code: 200,
      message: 'Experience deactivated',
      data: null,
    });
  });
});
