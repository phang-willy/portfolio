import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiResponse } from '@/app/shared/models/api-response.model';
import { environment } from '@/environments/environment';

export interface SitemapGeneration {
  urlCount: number;
}

@Injectable({ providedIn: 'root' })
export class SitemapService {
  private readonly http = inject(HttpClient);

  generate(): Observable<SitemapGeneration> {
    return this.http
      .post<ApiResponse<SitemapGeneration>>(`${environment.apiUrl}/admin/sitemap`, {}, { withCredentials: true })
      .pipe(map((response) => response.data));
  }
}
