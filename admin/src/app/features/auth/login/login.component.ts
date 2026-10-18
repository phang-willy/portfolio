import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { EMPTY, catchError, finalize, from, switchMap, tap } from 'rxjs';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSpinner } from '@spartan-ng/helm/spinner';

import { AuthStateService } from '@/app/core/auth/auth-state.service';
import { resolveAuthErrorMessage } from '@/app/core/auth/auth-error-message';
import { AuthService } from '@/app/core/auth/auth.service';
import { AuthHoneypotFieldComponent } from '@/app/shared/components/auth-honeypot-field/auth-honeypot-field.component';
import { HONEYPOT_FIELD_NAME, isHoneypotFilled } from '@/app/shared/utils/honeypot';

type LoginField = 'email' | 'password' | 'rememberMe';

@Component({
  selector: 'app-login',
  imports: [
    AuthHoneypotFieldComponent,
    HlmButtonImports,
    HlmCheckboxImports,
    HlmIcon,
    HlmInputImports,
    HlmSpinner,
    NgIcon,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './login.component.html',
  styleUrl: '../auth-form.css',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly authState = inject(AuthStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly errorMessage = signal<string | null>(null);
  protected readonly hasSubmitted = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly isPasswordVisible = signal(false);
  protected readonly registerEnabled = toSignal(this.auth.isRegisterEnabled(), {
    initialValue: false,
  });

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [false],
    [HONEYPOT_FIELD_NAME]: [''],
  });

  protected submitLogin(): void {
    this.hasSubmitted.set(true);
    this.errorMessage.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const value = this.loginForm.getRawValue();
    if (isHoneypotFilled(value.website)) {
      return;
    }

    this.isSubmitting.set(true);

    this.auth
      .login(value)
      .pipe(
        switchMap((response) => {
          if (response.requiresTwoFactor) {
            const { email, rememberMe } = this.loginForm.getRawValue();
            return from(
              this.router.navigateByUrl('/2fa', {
                state: { email: email.trim(), rememberMe },
              }),
            );
          }

          return this.auth.me().pipe(
            tap((authenticatedResponse) => this.auth.setAuthenticatedUser(authenticatedResponse.user)),
            switchMap(() => from(this.router.navigateByUrl('/admin/dashboard'))),
          );
        }),
        catchError((error: unknown) => {
          this.errorMessage.set(
            resolveAuthErrorMessage(error, 'Unable to login with these credentials.'),
          );
          return EMPTY;
        }),
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected togglePasswordVisibility(): void {
    this.isPasswordVisible.update((isVisible) => !isVisible);
  }

  protected fieldError(field: LoginField): string | null {
    const control = this.loginForm.controls[field];
    if (!this.hasSubmitted() && !control.touched) {
      return null;
    }

    if (control.hasError('required')) {
      return field === 'email' ? 'Email is required.' : 'Password is required.';
    }

    if (control.hasError('email')) {
      return 'Enter a valid email.';
    }

    return null;
  }

  protected hasFieldError(field: LoginField): boolean {
    return Boolean(this.fieldError(field));
  }
}
