import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { EMPTY, catchError, finalize, tap } from 'rxjs';

import { resolveAuthErrorMessage } from '@/app/core/auth/auth-error-message';
import { AuthService } from '@/app/core/auth/auth.service';
import { AuthHoneypotFieldComponent } from '@/app/shared/components/auth-honeypot-field/auth-honeypot-field.component';
import { HONEYPOT_FIELD_NAME, isHoneypotFilled } from '@/app/shared/utils/honeypot';

type ResetPasswordField = 'password' | 'confirmPassword';

@Component({
  selector: 'app-reset-password',
  imports: [AuthHoneypotFieldComponent, ButtonModule, InputTextModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: '../auth-form.css',
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly hasSubmitted = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly isPasswordVisible = signal(false);
  protected readonly isConfirmPasswordVisible = signal(false);
  protected readonly token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';

  protected readonly resetPasswordForm = this.formBuilder.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
    [HONEYPOT_FIELD_NAME]: [''],
  });

  protected submitResetPassword(): void {
    this.hasSubmitted.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (!this.token) {
      this.errorMessage.set('Reset token is missing.');
      return;
    }

    if (this.resetPasswordForm.invalid || !this.passwordsMatch()) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    const value = this.resetPasswordForm.getRawValue();
    if (isHoneypotFilled(value.website)) {
      this.successMessage.set('Password has been reset');
      this.resetPasswordForm.reset();
      this.hasSubmitted.set(false);
      return;
    }

    this.isSubmitting.set(true);

    this.auth
      .resetPassword({
        token: this.token,
        password: value.password,
        confirmPassword: value.confirmPassword,
        website: value.website,
      })
      .pipe(
        tap((response) => {
          this.successMessage.set(response.message);
          this.resetPasswordForm.reset();
          this.hasSubmitted.set(false);
        }),
        catchError((error: unknown) => {
          this.errorMessage.set(resolveAuthErrorMessage(error, 'Unable to reset this password.'));
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

  protected toggleConfirmPasswordVisibility(): void {
    this.isConfirmPasswordVisible.update((isVisible) => !isVisible);
  }

  protected fieldError(field: ResetPasswordField): string | null {
    const control = this.resetPasswordForm.controls[field];
    if (!this.hasSubmitted() && !control.touched) {
      return null;
    }

    if (control.hasError('required')) {
      return field === 'password' ? 'Password is required.' : 'Confirm password is required.';
    }

    if (control.hasError('minlength')) {
      return 'Password must contain at least 8 characters.';
    }

    if (control.hasError('maxlength')) {
      return 'Password is too long.';
    }

    if (field === 'confirmPassword' && !this.passwordsMatch()) {
      return 'Passwords must match.';
    }

    return null;
  }

  protected hasFieldError(field: ResetPasswordField): boolean {
    return Boolean(this.fieldError(field));
  }

  private passwordsMatch(): boolean {
    const { password, confirmPassword } = this.resetPasswordForm.getRawValue();
    return password === confirmPassword;
  }
}
