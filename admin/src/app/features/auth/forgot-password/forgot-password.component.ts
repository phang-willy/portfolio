import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { EMPTY, catchError, finalize, tap } from 'rxjs';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSpinner } from '@spartan-ng/helm/spinner';

import { resolveAuthErrorMessage } from '@/app/core/auth/auth-error-message';
import { AuthService } from '@/app/core/auth/auth.service';
import { AuthHoneypotFieldComponent } from '@/app/shared/components/auth-honeypot-field/auth-honeypot-field.component';
import { HONEYPOT_FIELD_NAME, isHoneypotFilled } from '@/app/shared/utils/honeypot';

@Component({
  selector: 'app-forgot-password',
  imports: [
    AuthHoneypotFieldComponent,
    HlmButtonImports,
    HlmIcon,
    HlmInputImports,
    HlmSpinner,
    NgIcon,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: '../auth-form.css',
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly hasSubmitted = signal(false);
  protected readonly isSubmitting = signal(false);

  protected readonly forgotPasswordForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    [HONEYPOT_FIELD_NAME]: [''],
  });

  protected submitForgotPassword(): void {
    this.hasSubmitted.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    const value = this.forgotPasswordForm.getRawValue();
    if (isHoneypotFilled(value.website)) {
      this.successMessage.set(
        'Si votre compte existe, un email vous sera envoyé.',
      );
      return;
    }

    this.isSubmitting.set(true);

    this.auth
      .forgotPassword({
        email: value.email.trim(),
        website: value.website,
      })
      .pipe(
        tap((response) => this.successMessage.set(response.message)),
        catchError((error: unknown) => {
          this.errorMessage.set(
            resolveAuthErrorMessage(error, 'Unable to request a password reset.'),
          );
          return EMPTY;
        }),
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected emailError(): string | null {
    const control = this.forgotPasswordForm.controls.email;
    if (!this.hasSubmitted() && !control.touched) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Email is required.';
    }

    if (control.hasError('email')) {
      return 'Enter a valid email.';
    }

    return null;
  }

  protected hasEmailError(): boolean {
    return Boolean(this.emailError());
  }
}
