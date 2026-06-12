import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiResponse } from '@/app/shared/models/api-response.model';
import { PageResponse, Stack, StackDeleteInput, StackInput } from '@/app/shared/models/stack.model';
import { environment } from '@/environments/environment';

const API_URL = environment.apiUrl.replace(/\/+$/, '');

@Injectable({ providedIn: 'root' })
export class StackService {
  private readonly http = inject(HttpClient);

  getStacks(page = 0, size = 50): Observable<PageResponse<Stack>> {
    return this.http
      .get<ApiResponse<PageResponse<Stack>>>(`${API_URL}/admin/stacks`, {
        params: { page, size },
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  getStack(id: string): Observable<Stack> {
    return this.http
      .get<ApiResponse<Stack>>(`${API_URL}/admin/stacks/${id}`, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  createStack(payload: StackInput): Observable<Stack> {
    return this.http
      .post<ApiResponse<Stack>>(`${API_URL}/admin/stacks`, payload, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  updateStack(id: string, payload: StackInput): Observable<Stack> {
    return this.http
      .put<ApiResponse<Stack>>(`${API_URL}/admin/stacks/${id}`, payload, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  deleteStack(id: string, payload: StackDeleteInput = {}): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${API_URL}/admin/stacks/${id}`, {
        body: payload,
        withCredentials: true,
      })
      .pipe(map(() => void 0));
  }
}
