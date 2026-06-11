import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';

import { resetAuthRefreshState } from '@/app/core/auth/auth-refresh.state';
import { AuthStateService } from '@/app/core/auth/auth-state.service';
import {
  AuthMessageResponse,
  AuthPublicConfig,
  AuthenticatedUserResponse,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyTwoFactorRequest,
} from '@/app/shared/models/auth.model';
import { ApiResponse } from '@/app/shared/models/api-response.model';
import { User } from '@/app/shared/models/user.model';
import { environment } from '@/environments/environment';

const API_URL = environment.apiUrl.replace(/\/+$/, '');

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authState = inject(AuthStateService);
  private readonly http = inject(HttpClient);
  private currentUserRequest$: Observable<User | null> | null = null;
  private registerEnabledRequest$: Observable<boolean> | null = null;

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${API_URL}/auth/login`, payload, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  isRegisterEnabled(): Observable<boolean> {
    if (!this.registerEnabledRequest$) {
      this.registerEnabledRequest$ = this.http
        .get<ApiResponse<AuthPublicConfig>>(`${API_URL}/auth/config`, {
          withCredentials: true,
        })
        .pipe(
          map((response) => response.data.registerEnabled),
          catchError(() => of(false)),
          shareReplay({ bufferSize: 1, refCount: true }),
        );
    }

    return this.registerEnabledRequest$;
  }

  register(payload: RegisterRequest): Observable<AuthMessageResponse> {
    return this.http
      .post<ApiResponse<null>>(`${API_URL}/auth/register`, payload, {
        withCredentials: true,
      })
      .pipe(map((response) => ({ message: response.message })));
  }

  verifyTwoFactor(payload: VerifyTwoFactorRequest): Observable<AuthenticatedUserResponse> {
    return this.http
      .post<ApiResponse<AuthenticatedUserResponse>>(`${API_URL}/auth/verify-2fa`, payload, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<AuthMessageResponse> {
    return this.http
      .post<ApiResponse<null>>(`${API_URL}/auth/forgot-password`, payload, {
        withCredentials: true,
      })
      .pipe(map((response) => ({ message: response.message })));
  }

  resetPassword(payload: ResetPasswordRequest): Observable<AuthMessageResponse> {
    return this.http
      .post<ApiResponse<null>>(`${API_URL}/auth/reset-password`, payload, {
        withCredentials: true,
      })
      .pipe(map((response) => ({ message: response.message })));
  }

  verifyEmail(token: string): Observable<AuthMessageResponse> {
    return this.http
      .get<ApiResponse<null>>(`${API_URL}/auth/verify-email`, {
        params: { token },
        withCredentials: true,
      })
      .pipe(map((response) => ({ message: response.message })));
  }

  logout(): Observable<void> {
    return this.http
      .post<ApiResponse<null>>(`${API_URL}/auth/logout`, null, {
        withCredentials: true,
      })
      .pipe(
        map(() => void 0),
        tap(() => this.clearSession()),
      );
  }

  me(): Observable<AuthenticatedUserResponse> {
    return this.http
      .get<ApiResponse<AuthenticatedUserResponse>>(`${API_URL}/auth/me`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => response.data),
        tap((response) => this.setAuthenticatedUser(response.user)),
      );
  }

  ensureCurrentUser(): Observable<User | null> {
    const cachedUser = this.authState.getCurrentUser();
    if (cachedUser) {
      return of(cachedUser);
    }

    if (!this.currentUserRequest$) {
      this.currentUserRequest$ = this.me().pipe(
        map((response) => response.user),
        catchError(() => {
          this.clearSession();
          return of(null);
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
        finalize(() => {
          this.currentUserRequest$ = null;
        }),
      );
    }

    return this.currentUserRequest$;
  }

  clearSession(): void {
    this.currentUserRequest$ = null;
    this.authState.clearUser();
  }

  setAuthenticatedUser(user: User): void {
    resetAuthRefreshState();
    this.authState.setUser(user);
  }

  refresh(): Observable<void> {
    return this.http
      .post<ApiResponse<null>>(`${API_URL}/auth/refresh`, null, {
        withCredentials: true,
      })
      .pipe(map(() => void 0));
  }

  isAuthenticated(): Observable<boolean> {
    return this.ensureCurrentUser().pipe(map((user) => user !== null));
  }
}
