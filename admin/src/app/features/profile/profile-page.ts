import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import type { BrnDialogState } from '@spartan-ng/brain/dialog';
import { EMPTY, catchError, finalize } from 'rxjs';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSpinner } from '@spartan-ng/helm/spinner';

import { resolveAuthErrorMessage } from '@/app/core/auth/auth-error-message';
import { AuthService } from '@/app/core/auth/auth.service';
import { ProfileService } from '@/app/features/profile/profile.service';
import { AuthHoneypotFieldComponent } from '@/app/shared/components/auth-honeypot-field/auth-honeypot-field.component';
import { ProfileUpdateInput } from '@/app/shared/models/profile.model';
import { User } from '@/app/shared/models/user.model';
import { userRoleLabel } from '@/app/shared/models/user-role';
import { profileFormSchema, profilePasswordSchema } from '@/app/shared/schemas/user.schema';
import { HONEYPOT_FIELD_NAME, isHoneypotFilled } from '@/app/shared/utils/honeypot';
import { zodIssuesToFieldErrors } from '@/app/shared/utils/zod-field-errors';

type ProfileField = 'lastname' | 'firstname' | 'email';
type PasswordField = 'oldPassword' | 'newPassword' | 'confirmPassword';

@Component({
  selector: 'app-profile-page',
  host: { class: 'block' },
  imports: [
    AuthHoneypotFieldComponent,
    HlmAlertDialogImports,
    HlmButtonImports,
    HlmIcon,
    HlmInputImports,
    HlmSpinner,
    NgIcon,
    ReactiveFormsModule,
  ],
  templateUrl: './profile-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);

  protected readonly user = signal<User | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSavingProfile = signal(false);
  protected readonly isSavingPassword = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly emailConfirmOpen = signal(false);
  protected readonly profileSubmitted = signal(false);
  protected readonly passwordSubmitted = signal(false);
  protected readonly profileErrors = signal<Partial<Record<ProfileField, string>>>({});
  protected readonly passwordErrors = signal<Partial<Record<PasswordField, string>>>({});
  protected readonly isCurrentPasswordVisible = signal(false);
  protected readonly isNewPasswordVisible = signal(false);
  protected readonly isConfirmPasswordVisible = signal(false);
  protected readonly roleLabel = userRoleLabel;

  private pendingUpdate: ProfileUpdateInput | null = null;

  protected readonly profileForm = this.formBuilder.nonNullable.group({
    lastname: [''],
    firstname: [''],
    email: [''],
    [HONEYPOT_FIELD_NAME]: [''],
  });

  protected readonly passwordForm = this.formBuilder.nonNullable.group({
    oldPassword: [''],
    newPassword: [''],
    confirmPassword: [''],
    [HONEYPOT_FIELD_NAME]: [''],
  });

  constructor() {
    this.auth
      .ensureCurrentUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (!user) {
          void this.router.navigateByUrl('/login');
          return;
        }

        this.user.set(user);
        this.resetProfileForm(user);
        this.isLoading.set(false);
      });
  }

  protected emailDialogState(): BrnDialogState {
    return this.emailConfirmOpen() ? 'open' : 'closed';
  }

  protected submitProfile(): void {
    const user = this.user();
    if (!user || this.isSavingProfile()) {
      return;
    }

    this.profileSubmitted.set(true);
    this.profileErrors.set({});
    this.errorMessage.set(null);
    this.successMessage.set(null);
    const raw = this.profileForm.getRawValue();
    if (isHoneypotFilled(raw.website)) {
      this.successMessage.set('Profile updated.');
      return;
    }

    const parsed = profileFormSchema.safeParse(raw);
    if (!parsed.success) {
      this.profileErrors.set(zodIssuesToFieldErrors(parsed.error));
      this.profileForm.markAllAsTouched();
      return;
    }

    const emailChanged = parsed.data.email.toLowerCase() !== user.email.toLowerCase();
    const payload: ProfileUpdateInput = {
      ...parsed.data,
      confirmEmailChange: false,
      website: raw.website,
    };

    if (!emailChanged) {
      this.saveProfile(payload);
      return;
    }

    this.isSavingProfile.set(true);
    this.profileService
      .emailAvailable(parsed.data.email)
      .pipe(
        catchError((error: unknown) => {
          this.errorMessage.set(resolveAuthErrorMessage(error, 'Unable to check this email.'));
          return EMPTY;
        }),
        finalize(() => this.isSavingProfile.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((available) => {
        if (!available) {
          this.profileErrors.set({ email: 'This email is already used.' });
          return;
        }

        this.pendingUpdate = { ...payload, confirmEmailChange: true };
        this.emailConfirmOpen.set(true);
      });
  }

  protected confirmEmailChange(): void {
    const payload = this.pendingUpdate;
    this.closeEmailConfirm();
    if (!payload) {
      return;
    }

    this.saveProfile(payload);
  }

  protected closeEmailConfirm(): void {
    this.emailConfirmOpen.set(false);
    this.pendingUpdate = null;
  }

  protected onEmailDialogStateChange(state: BrnDialogState): void {
    if (state === 'closed') {
      this.closeEmailConfirm();
    }
  }

  protected pendingEmail(): string {
    return this.pendingUpdate?.email ?? '';
  }

  protected submitPassword(): void {
    if (this.isSavingPassword()) {
      return;
    }

    this.passwordSubmitted.set(true);
    this.passwordErrors.set({});
    this.errorMessage.set(null);
    this.successMessage.set(null);
    const raw = this.passwordForm.getRawValue();
    if (isHoneypotFilled(raw.website)) {
      this.passwordForm.reset({ [HONEYPOT_FIELD_NAME]: '' });
      this.passwordSubmitted.set(false);
      this.successMessage.set('Password changed');
      return;
    }

    const parsed = profilePasswordSchema.safeParse(raw);
    if (!parsed.success) {
      this.passwordErrors.set(zodIssuesToFieldErrors(parsed.error));
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSavingPassword.set(true);
    this.profileService
      .changePassword({
        oldPassword: parsed.data.oldPassword,
        newPassword: parsed.data.newPassword,
        confirmPassword: parsed.data.confirmPassword,
        website: raw.website,
      })
      .pipe(
        catchError((error: unknown) => {
          this.errorMessage.set(resolveAuthErrorMessage(error, 'Unable to change the password.'));
          return EMPTY;
        }),
        finalize(() => this.isSavingPassword.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.passwordForm.reset({ [HONEYPOT_FIELD_NAME]: '' });
        this.passwordSubmitted.set(false);
        this.isCurrentPasswordVisible.set(false);
        this.isNewPasswordVisible.set(false);
        this.isConfirmPasswordVisible.set(false);
        this.successMessage.set(response.message);
      });
  }

  protected profileFieldError(field: ProfileField): string | null {
    return this.profileErrors()[field] ?? null;
  }

  protected passwordFieldError(field: PasswordField): string | null {
    return this.passwordErrors()[field] ?? null;
  }

  private saveProfile(payload: ProfileUpdateInput): void {
    this.isSavingProfile.set(true);
    this.profileService
      .updateProfile(payload)
      .pipe(
        catchError((error: unknown) => {
          const message = resolveAuthErrorMessage(error, 'Unable to save the profile.');
          if (message === 'Email already exists') {
            this.profileErrors.set({ email: 'This email is already used.' });
          } else {
            this.errorMessage.set(message);
          }
          return EMPTY;
        }),
        finalize(() => this.isSavingProfile.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((updated) => {
        this.pendingUpdate = null;
        if (!updated) {
          this.successMessage.set('Profile updated.');
          return;
        }

        if (updated.signedOut) {
          this.auth.clearSession();
          void this.router.navigateByUrl('/login');
          return;
        }

        this.user.set(updated.user);
        this.auth.setAuthenticatedUser(updated.user);
        this.resetProfileForm(updated.user);
        this.successMessage.set('Profile updated.');
      });
  }

  private resetProfileForm(user: User): void {
    this.profileForm.reset({
      lastname: user.lastname,
      firstname: user.firstname,
      email: user.email,
      [HONEYPOT_FIELD_NAME]: '',
    });
    this.profileSubmitted.set(false);
    this.profileErrors.set({});
  }
}
