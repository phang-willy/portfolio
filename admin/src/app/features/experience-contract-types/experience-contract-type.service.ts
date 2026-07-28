import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  ExperienceContractTypeAdminDetail,
  ExperienceContractTypeAdminListItem,
  ExperienceContractTypeDeleteInput,
  ExperienceContractTypeInput,
  PageResponse,
} from '@/app/shared/models/experience-contract-type.model';
import { ApiResponse, PaginatedApiResponse } from '@/app/shared/models/api-response.model';
import { environment } from '@/environments/environment';

const API_URL = environment.apiUrl.replace(/\/+$/, '');

@Injectable({ providedIn: 'root' })
export class ExperienceContractTypeService {
  private readonly http = inject(HttpClient);

  getContractTypes(
    page = 0,
    size = 50,
  ): Observable<PageResponse<ExperienceContractTypeAdminListItem>> {
    return this.http
      .get<PaginatedApiResponse<ExperienceContractTypeAdminListItem>>(
        `${API_URL}/admin/experience-contract-type`,
        {
          params: { page, size },
          withCredentials: true,
        },
      )
      .pipe(map((response) => ({ data: response.data, pagination: response.pagination })));
  }

  getContractType(id: string): Observable<ExperienceContractTypeAdminDetail> {
    return this.http
      .get<ApiResponse<ExperienceContractTypeAdminDetail>>(
        `${API_URL}/admin/experience-contract-type/${id}`,
        { withCredentials: true },
      )
      .pipe(map((response) => response.data));
  }

  createContractType(
    payload: ExperienceContractTypeInput,
  ): Observable<ExperienceContractTypeAdminDetail> {
    return this.http
      .post<ApiResponse<ExperienceContractTypeAdminDetail>>(
        `${API_URL}/admin/experience-contract-type`,
        payload,
        { withCredentials: true },
      )
      .pipe(map((response) => response.data));
  }

  updateContractType(
    id: string,
    payload: ExperienceContractTypeInput,
  ): Observable<ExperienceContractTypeAdminDetail> {
    return this.http
      .put<ApiResponse<ExperienceContractTypeAdminDetail>>(
        `${API_URL}/admin/experience-contract-type/${id}`,
        payload,
        { withCredentials: true },
      )
      .pipe(map((response) => response.data));
  }

  deleteContractType(id: string, payload: ExperienceContractTypeDeleteInput = {}): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${API_URL}/admin/experience-contract-type/${id}`, {
        body: payload,
        withCredentials: true,
      })
      .pipe(map(() => void 0));
  }

  deactivateContractType(
    id: string,
    payload: ExperienceContractTypeDeleteInput = {},
  ): Observable<void> {
    return this.http
      .put<ApiResponse<null>>(`${API_URL}/admin/experience-contract-type/deactivate/${id}`, payload, {
        withCredentials: true,
      })
      .pipe(map(() => void 0));
  }

  reactivateContractType(
    id: string,
    payload: ExperienceContractTypeDeleteInput = {},
  ): Observable<void> {
    return this.http
      .put<ApiResponse<null>>(`${API_URL}/admin/experience-contract-type/reactivate/${id}`, payload, {
        withCredentials: true,
      })
      .pipe(map(() => void 0));
  }
}
