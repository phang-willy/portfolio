import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { UserAdminService } from '@/app/features/users/user-admin.service';
import { UserAdminListItem } from '@/app/shared/models/user-admin.model';

function user(id: string): UserAdminListItem {
  return {
    id,
    email: `${id}@example.com`,
    role: 'USER',
    lastname: 'DOE',
    firstname: id,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    deactivatedAt: null,
  };
}

function page(pageIndex: number, totalPages: number, data: readonly UserAdminListItem[]) {
  return {
    success: true,
    code: 200,
    message: null,
    data,
    pagination: {
      page: pageIndex,
      size: 200,
      totalItems: totalPages * data.length || data.length,
      totalPages,
    },
  };
}

describe('UserAdminService', () => {
  let service: UserAdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserAdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads every user page before returning the list', () => {
    let ids: string[] = [];
    service.getUsers().subscribe((response) => {
      ids = response.data.map((item) => item.id);
    });

    http
      .expectOne((request) => request.url === '/api/admin/user' && request.params.get('page') === '0')
      .flush(page(0, 2, [user('a')]));
    http
      .expectOne((request) => request.url === '/api/admin/user' && request.params.get('page') === '1')
      .flush(page(1, 2, [user('b')]));

    expect(ids).toEqual(['a', 'b']);
    http.expectNone((request) => request.params.get('page') === '2');
  });
});
