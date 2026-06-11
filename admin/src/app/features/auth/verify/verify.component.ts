import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { EMPTY, catchError, finalize, from, switchMap, tap, timer } from 'rxjs';

import { resolveAuthErrorMessage } from '@/app/core/auth/auth-error-message';
import { AuthService } from '@/app/core/auth/auth.service';
import { AuthHoneypotFieldComponent } from '@/app/shared/components/auth-honeypot-field/auth-honeypot-field.component';
import { HONEYPOT_FIELD_NAME, isHoneypotFilled } from '@/app/shared/utils/honeypot';

@Component({
  selector: 'app-verify',
  imports: [AuthHoneypotFieldComponent, ButtonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './verify.component.html',
  styleUrl: '../auth-form.css',
})
export class VerifyComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly verifyForm = this.formBuilder.nonNullable.group({
    [HONEYPOT_FIELD_NAME]: [''],
  });

  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';
  protected readonly redirectUrl = this.resolveRedirectUrl(
    this.route.snapshot.queryParamMap.get('redirectTo'),
  );

  ngOnInit(): void {
    this.verifyEmail();
  }

  protected submitVerifyEmail(): void {
    this.verifyEmail();
  }

  private verifyEmail(): void {
    if (this.isSubmitting() || this.successMessage()) {
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (!this.token) {
      this.errorMessage.set('Verification token is missing.');
      return;
    }

    if (isHoneypotFilled(this.verifyForm.controls.website.value)) {
      this.successMessage.set('Email verified');
      return;
    }

    this.isSubmitting.set(true);

    this.auth
      .verifyEmail(this.token)
      .pipe(
        tap((response) => this.successMessage.set(response.message)),
        switchMap(() => timer(1200)),
        switchMap(() => from(this.router.navigateByUrl(this.redirectUrl))),
        catchError((error: unknown) => {
          this.errorMessage.set(resolveAuthErrorMessage(error, 'Unable to verify this email.'));
          return EMPTY;
        }),
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private resolveRedirectUrl(value: string | null): string {
    const fallbackUrl = '/login';
    if (!value) {
      return fallbackUrl;
    }

    const redirectUrl = value.trim();
    if (
      !redirectUrl.startsWith('/') ||
      redirectUrl.startsWith('//') ||
      redirectUrl.includes('://')
    ) {
      return fallbackUrl;
    }

    return redirectUrl;
  }
}
