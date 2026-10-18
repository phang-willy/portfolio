import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { BrnInputOtp } from '@spartan-ng/brain/input-otp';
import { EMPTY, catchError, finalize, from, switchMap } from 'rxjs';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmInputOtpImports } from '@spartan-ng/helm/input-otp';
import { HlmSpinner } from '@spartan-ng/helm/spinner';

import { resolveAuthErrorMessage } from '@/app/core/auth/auth-error-message';
import { AuthService } from '@/app/core/auth/auth.service';
import { AuthHoneypotFieldComponent } from '@/app/shared/components/auth-honeypot-field/auth-honeypot-field.component';
import { HONEYPOT_FIELD_NAME, isHoneypotFilled } from '@/app/shared/utils/honeypot';

type TwoFactorField = 'email' | 'code' | 'rememberMe';

interface TwoFactorNavigationState {
  email?: string;
  rememberMe?: boolean;
}

@Component({
  selector: 'app-two-factor',
  imports: [
    AuthHoneypotFieldComponent,
    BrnInputOtp,
    HlmButtonImports,
    HlmCheckboxImports,
    HlmIcon,
    HlmInputOtpImports,
    HlmSpinner,
    NgIcon,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './two-factor.component.html',
  styleUrls: ['../auth-form.css', './two-factor.component.css'],
})
export class TwoFactorComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly errorMessage = signal<string | null>(null);
  protected readonly hasSubmitted = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly otpSlotIndexes = [0, 1, 2, 3, 4, 5];

  private readonly navigationState = this.resolveNavigationState();

  protected readonly twoFactorForm = this.formBuilder.nonNullable.group({
    email: [this.navigationState?.email?.trim() ?? '', [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    rememberMe: [this.navigationState?.rememberMe ?? false],
    [HONEYPOT_FIELD_NAME]: [''],
  });

  ngOnInit(): void {
    if (!this.twoFactorForm.controls.email.value) {
      void this.router.navigateByUrl('/login');
    }
  }

  private resolveNavigationState(): TwoFactorNavigationState | undefined {
    return (this.router.getCurrentNavigation()?.extras.state ?? history.state) as
      | TwoFactorNavigationState
      | undefined;
  }

  protected submitTwoFactor(): void {
    this.hasSubmitted.set(true);
    this.errorMessage.set(null);

    if (this.twoFactorForm.invalid) {
      this.twoFactorForm.markAllAsTouched();
      return;
    }

    const value = this.twoFactorForm.getRawValue();
    if (isHoneypotFilled(value.website)) {
      return;
    }

    this.isSubmitting.set(true);

    this.auth
      .verifyTwoFactor({
        email: value.email.trim(),
        code: value.code.trim(),
        rememberMe: value.rememberMe,
        website: value.website,
      })
      .pipe(
        switchMap((response) => {
          if (!response.user) {
            return EMPTY;
          }

          this.auth.setAuthenticatedUser(response.user);
          return from(this.router.navigateByUrl('/admin/dashboard'));
        }),
        catchError((error: unknown) => {
          this.errorMessage.set(resolveAuthErrorMessage(error, 'Unable to verify this code.'));
          return EMPTY;
        }),
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected fieldError(field: TwoFactorField): string | null {
    const control = this.twoFactorForm.controls[field];
    if (!this.hasSubmitted() && !control.touched) {
      return null;
    }

    if (control.hasError('required')) {
      return field === 'code' ? '2FA code is required.' : 'Email is required.';
    }

    if (control.hasError('email')) {
      return 'Enter a valid email.';
    }

    if (control.hasError('pattern')) {
      return 'Enter the 6-digit code.';
    }

    return null;
  }

  protected hasFieldError(field: TwoFactorField): boolean {
    return Boolean(this.fieldError(field));
  }
}
