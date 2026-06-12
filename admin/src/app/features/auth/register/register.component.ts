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

type RegisterField = 'firstname' | 'lastname' | 'email' | 'password' | 'confirmPassword';

@Component({
  selector: 'app-register',
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
  templateUrl: './register.component.html',
  styleUrl: '../auth-form.css',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly hasSubmitted = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly isPasswordVisible = signal(false);
  protected readonly isConfirmPasswordVisible = signal(false);

  protected readonly registerForm = this.formBuilder.nonNullable.group({
    firstname: ['', [Validators.required, Validators.maxLength(255)]],
    lastname: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(320)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
    [HONEYPOT_FIELD_NAME]: [''],
  });

  protected submitRegister(): void {
    this.hasSubmitted.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.registerForm.invalid || !this.passwordsMatch()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const value = this.registerForm.getRawValue();
    if (isHoneypotFilled(value.website)) {
      this.successMessage.set('Registration created. Please verify your email.');
      this.registerForm.reset();
      this.hasSubmitted.set(false);
      return;
    }

    this.isSubmitting.set(true);

    this.auth
      .register({
        firstname: value.firstname.trim(),
        lastname: value.lastname.trim(),
        email: value.email.trim(),
        password: value.password,
        confirmPassword: value.confirmPassword,
        website: value.website,
      })
      .pipe(
        tap((response) => {
          this.successMessage.set(response.message);
          this.registerForm.reset();
          this.hasSubmitted.set(false);
        }),
        catchError((error: unknown) => {
          this.errorMessage.set(resolveAuthErrorMessage(error, 'Unable to register this account.'));
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

  protected fieldError(field: RegisterField): string | null {
    const control = this.registerForm.controls[field];
    if (!this.hasSubmitted() && !control.touched) {
      return null;
    }

    if (control.hasError('required')) {
      return `${this.fieldLabel(field)} is required.`;
    }

    if (control.hasError('email')) {
      return 'Enter a valid email.';
    }

    if (control.hasError('maxlength')) {
      return `${this.fieldLabel(field)} is too long.`;
    }

    if (control.hasError('minlength')) {
      return `${this.fieldLabel(field)} must contain at least 8 characters.`;
    }

    if (field === 'confirmPassword' && !this.passwordsMatch()) {
      return 'Passwords must match.';
    }

    return null;
  }

  protected hasFieldError(field: RegisterField): boolean {
    return Boolean(this.fieldError(field));
  }

  private passwordsMatch(): boolean {
    const { password, confirmPassword } = this.registerForm.getRawValue();
    return password === confirmPassword;
  }

  private fieldLabel(field: RegisterField): string {
    const labels: Record<RegisterField, string> = {
      firstname: 'Firstname',
      lastname: 'Lastname',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password',
    };

    return labels[field];
  }
}
