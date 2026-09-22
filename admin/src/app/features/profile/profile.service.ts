import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiResponse } from '@/app/shared/models/api-response.model';
import { AuthMessageResponse } from '@/app/shared/models/auth.model';
import { EmailAvailability } from '@/app/shared/models/user-admin.model';
import {
  ProfilePasswordInput,
  ProfileUpdateInput,
  ProfileUpdateResult,
} from '@/app/shared/models/profile.model';
import { environment } from '@/environments/environment';

const API_URL = `${environment.apiUrl.replace(/\/+$/, '')}/account`;

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);

  emailAvailable(email: string): Observable<boolean> {
    return this.http
      .get<ApiResponse<EmailAvailability>>(`${API_URL}/email-available`, {
        params: { email },
        withCredentials: true,
      })
      .pipe(map((response) => response.data.available));
  }

  updateProfile(payload: ProfileUpdateInput): Observable<ProfileUpdateResult | null> {
    return this.http
      .put<ApiResponse<ProfileUpdateResult | null>>(`${API_URL}/profile`, payload, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  changePassword(payload: ProfilePasswordInput): Observable<AuthMessageResponse> {
    return this.http
      .post<ApiResponse<null>>(`${API_URL}/change-password`, payload, {
        withCredentials: true,
      })
      .pipe(map((response) => ({ message: response.message })));
  }
}
