import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiResponse, PaginatedApiResponse } from '@/app/shared/models/api-response.model';
import {
  EmailAvailability,
  UserAdminDetail,
  UserAdminListItem,
  UserAdminUpdateInput,
  UserPage,
} from '@/app/shared/models/user-admin.model';
import { environment } from '@/environments/environment';

const API_URL = `${environment.apiUrl.replace(/\/+$/, '')}/admin/user`;

@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private readonly http = inject(HttpClient);

  getUsers(page = 0, size = 200): Observable<UserPage<UserAdminListItem>> {
    return this.http
      .get<PaginatedApiResponse<UserAdminListItem>>(API_URL, {
        params: { page, size },
        withCredentials: true,
      })
      .pipe(map((response) => ({ data: response.data, pagination: response.pagination })));
  }

  getUser(id: string): Observable<UserAdminDetail> {
    return this.http
      .get<ApiResponse<UserAdminDetail>>(`${API_URL}/${id}`, { withCredentials: true })
      .pipe(map((response) => response.data));
  }

  emailAvailable(email: string, userId: string): Observable<boolean> {
    return this.http
      .get<ApiResponse<EmailAvailability>>(`${API_URL}/email-available`, {
        params: { email, userId },
        withCredentials: true,
      })
      .pipe(map((response) => response.data.available));
  }

  updateUser(id: string, payload: UserAdminUpdateInput): Observable<UserAdminDetail | null> {
    return this.http
      .put<ApiResponse<UserAdminDetail | null>>(`${API_URL}/${id}`, payload, { withCredentials: true })
      .pipe(map((response) => response.data));
  }

  requestPasswordReset(id: string, website = ''): Observable<UserAdminDetail | null> {
    return this.http
      .put<ApiResponse<UserAdminDetail | null>>(
        `${API_URL}/password-reset/${id}`,
        { website },
        { withCredentials: true },
      )
      .pipe(map((response) => response.data));
  }
}
