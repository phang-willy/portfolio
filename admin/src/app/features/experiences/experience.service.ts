import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  ExperienceAdminDetail,
  ExperienceAdminListItem,
  ExperienceDeleteInput,
  ExperienceInput,
  PageResponse,
} from '@/app/shared/models/experience.model';
import { ApiResponse, PaginatedApiResponse } from '@/app/shared/models/api-response.model';
import { environment } from '@/environments/environment';

const API_URL = environment.apiUrl.replace(/\/+$/, '');

@Injectable({ providedIn: 'root' })
export class ExperienceService {
  private readonly http = inject(HttpClient);

  getExperiences(page = 0, size = 50): Observable<PageResponse<ExperienceAdminListItem>> {
    return this.http
      .get<PaginatedApiResponse<ExperienceAdminListItem>>(`${API_URL}/admin/experience`, {
        params: { page, size },
        withCredentials: true,
      })
      .pipe(map((response) => ({ data: response.data, pagination: response.pagination })));
  }

  getExperience(id: string): Observable<ExperienceAdminDetail> {
    return this.http
      .get<ApiResponse<ExperienceAdminDetail>>(`${API_URL}/admin/experience/${id}`, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  createExperience(payload: ExperienceInput): Observable<ExperienceAdminDetail> {
    return this.http
      .post<ApiResponse<ExperienceAdminDetail>>(`${API_URL}/admin/experience`, payload, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  updateExperience(id: string, payload: ExperienceInput): Observable<ExperienceAdminDetail> {
    return this.http
      .put<ApiResponse<ExperienceAdminDetail>>(`${API_URL}/admin/experience/${id}`, payload, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  deleteExperience(id: string, payload: ExperienceDeleteInput = {}): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${API_URL}/admin/experience/${id}`, {
        body: payload,
        withCredentials: true,
      })
      .pipe(map(() => void 0));
  }

  deactivateExperience(id: string, payload: ExperienceDeleteInput = {}): Observable<void> {
    return this.http
      .put<ApiResponse<null>>(`${API_URL}/admin/experience/deactivate/${id}`, payload, {
        withCredentials: true,
      })
      .pipe(map(() => void 0));
  }

  reactivateExperience(id: string, payload: ExperienceDeleteInput = {}): Observable<void> {
    return this.http
      .put<ApiResponse<null>>(`${API_URL}/admin/experience/reactivate/${id}`, payload, {
        withCredentials: true,
      })
      .pipe(map(() => void 0));
  }
}
