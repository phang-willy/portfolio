import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  PageResponse,
  ProjectAdminDetail,
  ProjectAdminListItem,
  ProjectDeleteInput,
  ProjectInput,
} from '@/app/shared/models/project.model';
import { ApiResponse, PaginatedApiResponse } from '@/app/shared/models/api-response.model';
import { environment } from '@/environments/environment';

const API_URL = environment.apiUrl.replace(/\/+$/, '');

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);

  getProjects(page = 0, size = 50): Observable<PageResponse<ProjectAdminListItem>> {
    return this.http
      .get<PaginatedApiResponse<ProjectAdminListItem>>(`${API_URL}/admin/project`, {
        params: { page, size },
        withCredentials: true,
      })
      .pipe(map((response) => ({ data: response.data, pagination: response.pagination })));
  }

  getProject(id: string): Observable<ProjectAdminDetail> {
    return this.http
      .get<ApiResponse<ProjectAdminDetail>>(`${API_URL}/admin/project/${id}`, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  createProject(payload: ProjectInput): Observable<ProjectAdminDetail> {
    return this.http
      .post<ApiResponse<ProjectAdminDetail>>(`${API_URL}/admin/project`, payload, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  updateProject(id: string, payload: ProjectInput): Observable<ProjectAdminDetail> {
    return this.http
      .put<ApiResponse<ProjectAdminDetail>>(`${API_URL}/admin/project/${id}`, payload, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  deleteProject(id: string, payload: ProjectDeleteInput = {}): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${API_URL}/admin/project/${id}`, {
        body: payload,
        withCredentials: true,
      })
      .pipe(map(() => void 0));
  }

  deactivateProject(id: string, payload: ProjectDeleteInput = {}): Observable<void> {
    return this.http
      .put<ApiResponse<null>>(`${API_URL}/admin/project/deactivate/${id}`, payload, {
        withCredentials: true,
      })
      .pipe(map(() => void 0));
  }

  reactivateProject(id: string, payload: ProjectDeleteInput = {}): Observable<void> {
    return this.http
      .put<ApiResponse<null>>(`${API_URL}/admin/project/reactivate/${id}`, payload, {
        withCredentials: true,
      })
      .pipe(map(() => void 0));
  }

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<ApiResponse<{ url: string }>>(`${API_URL}/admin/project/image`, formData, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data.url));
  }
}
