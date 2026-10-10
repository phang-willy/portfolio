import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import type { BrnDialogState } from '@spartan-ng/brain/dialog';
import { EMPTY, catchError, distinctUntilChanged, filter, finalize, map, switchMap } from 'rxjs';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmBadgeImports, type BadgeVariants } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmTableImports } from '@spartan-ng/helm/table';

import { UserAdminService } from '@/app/features/users/user-admin.service';
import { resolveAuthErrorMessage } from '@/app/core/auth/auth-error-message';
import { AuthHoneypotFieldComponent } from '@/app/shared/components/auth-honeypot-field/auth-honeypot-field.component';
import { UserAdminDetail, UserAdminUpdateInput, UserHistoryType } from '@/app/shared/models/user-admin.model';
import { UserRole, userRoleLabel } from '@/app/shared/models/user-role';
import { AdminDatePipe } from '@/app/shared/pipes/admin-date.pipe';
import { userFormSchema } from '@/app/shared/schemas/user.schema';
import { HONEYPOT_FIELD_NAME, isHoneypotFilled } from '@/app/shared/utils/honeypot';
import { zodIssuesToFieldErrors } from '@/app/shared/utils/zod-field-errors';

type UserField = 'lastname' | 'firstname' | 'email' | 'role' | 'active';

const HISTORY_LABELS: Record<UserHistoryType, string> = {
  LOGIN: 'Signed in',
  PASSWORD_RESET_REQUESTED: 'Password reset email',
  PASSWORD_CHANGED: 'Password changed',
  EMAIL_CHANGED: 'Email changed',
  ROLE_CHANGED: 'Role changed',
  ACCOUNT_ACTIVATED: 'Account activated',
  ACCOUNT_DEACTIVATED: 'Account deactivated',
  PROFILE_UPDATED: 'Profile updated',
};

@Component({
  selector: 'app-user-detail-page',
  host: { class: 'block' },
  imports: [
    AdminDatePipe,
    AuthHoneypotFieldComponent,
    FormsModule,
    HlmAlertDialogImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmCheckboxImports,
    HlmDialogImports,
    HlmIcon,
    HlmInputImports,
    HlmSelectImports,
    HlmSpinner,
    HlmTableImports,
    NgIcon,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './user-detail-page.html',
})
export class UserDetailPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly userAdminService = inject(UserAdminService);

  protected readonly user = signal<UserAdminDetail | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly editOpen = signal(false);
  protected readonly emailConfirmOpen = signal(false);
  protected readonly passwordResetOpen = signal(false);
  protected readonly hasSubmitted = signal(false);
  protected readonly zodFieldErrors = signal<Partial<Record<UserField, string>>>({});
  protected readonly roleLabel = userRoleLabel;
  protected readonly historyLabel = (type: UserHistoryType) => HISTORY_LABELS[type];

  private pendingUpdate: UserAdminUpdateInput | null = null;

  protected readonly editForm = this.formBuilder.nonNullable.group({
    lastname: [''],
    firstname: [''],
    email: [''],
    role: ['USER' as UserRole],
    active: [true],
    [HONEYPOT_FIELD_NAME]: [''],
  });

  protected readonly passwordResetForm = this.formBuilder.nonNullable.group({
    [HONEYPOT_FIELD_NAME]: [''],
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        filter((id): id is string => !!id),
        distinctUntilChanged(),
        switchMap((id) => {
          this.user.set(null);
          this.errorMessage.set(null);
          this.successMessage.set(null);
          this.isLoading.set(true);
          return this.userAdminService.getUser(id).pipe(
            catchError((error: unknown) => {
              this.errorMessage.set(resolveAuthErrorMessage(error, 'Unable to load this user.'));
              this.isLoading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((user) => {
        this.user.set(user);
        this.isLoading.set(false);
      });
  }

  protected roleBadge(role: UserRole): BadgeVariants['variant'] {
    if (role === 'SUPER_ADMIN') {
      return 'default';
    }

    if (role === 'ADMIN') {
      return 'secondary';
    }

    return 'outline';
  }

  protected editDialogState(): BrnDialogState {
    return this.editOpen() ? 'open' : 'closed';
  }

  protected emailDialogState(): BrnDialogState {
    return this.emailConfirmOpen() ? 'open' : 'closed';
  }

  protected passwordDialogState(): BrnDialogState {
    return this.passwordResetOpen() ? 'open' : 'closed';
  }

  protected openEdit(): void {
    const user = this.user();
    if (!user?.manageable) {
      return;
    }

    this.editForm.reset({
      lastname: user.lastname,
      firstname: user.firstname,
      email: user.email,
      role: user.assignableRoles.includes(user.role) ? user.role : user.assignableRoles[0],
      active: user.deactivatedAt == null,
      [HONEYPOT_FIELD_NAME]: '',
    });
    this.hasSubmitted.set(false);
    this.zodFieldErrors.set({});
    this.errorMessage.set(null);
    this.editOpen.set(true);
  }

  protected closeEdit(): void {
    this.editOpen.set(false);
    this.emailConfirmOpen.set(false);
    this.pendingUpdate = null;
  }

  protected onEditDialogStateChange(state: BrnDialogState): void {
    if (state === 'closed') {
      this.closeEdit();
    }
  }

  protected submitEdit(): void {
    const user = this.user();
    if (!user || this.isSaving()) {
      return;
    }

    this.hasSubmitted.set(true);
    this.zodFieldErrors.set({});
    this.errorMessage.set(null);
    const raw = this.editForm.getRawValue();
    if (isHoneypotFilled(raw.website)) {
      this.closeEdit();
      return;
    }

    const parsed = userFormSchema.safeParse(raw);
    if (!parsed.success) {
      this.zodFieldErrors.set(zodIssuesToFieldErrors(parsed.error));
      this.editForm.markAllAsTouched();
      return;
    }

    if (!user.assignableRoles.includes(parsed.data.role)) {
      this.zodFieldErrors.set({ role: 'You can only assign a role below your own.' });
      return;
    }

    const emailChanged = parsed.data.email.toLowerCase() !== user.email.toLowerCase();
    const payload: UserAdminUpdateInput = {
      ...parsed.data,
      confirmEmailChange: false,
      website: raw.website,
    };

    if (!emailChanged) {
      this.save(user.id, payload, 'User updated.');
      return;
    }

    this.isSaving.set(true);
    this.userAdminService
      .emailAvailable(parsed.data.email, user.id)
      .pipe(
        catchError((error: unknown) => {
          this.errorMessage.set(resolveAuthErrorMessage(error, 'Unable to check this email.'));
          return EMPTY;
        }),
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((available) => {
        if (!available) {
          this.zodFieldErrors.set({ email: 'This email is already used.' });
          return;
        }

        this.pendingUpdate = { ...payload, confirmEmailChange: true };
        this.emailConfirmOpen.set(true);
      });
  }

  protected confirmEmailChange(): void {
    const user = this.user();
    const payload = this.pendingUpdate;
    this.emailConfirmOpen.set(false);
    if (!user || !payload) {
      return;
    }

    this.save(
      user.id,
      payload,
      'User updated. Sessions were signed out and a verification email was sent.',
    );
  }

  protected closeEmailConfirm(): void {
    this.emailConfirmOpen.set(false);
    this.pendingUpdate = null;
  }

  protected onEmailDialogStateChange(state: BrnDialogState): void {
    if (state === 'closed') {
      this.emailConfirmOpen.set(false);
    }
  }

  protected openPasswordReset(): void {
    if (!this.user()?.manageable) {
      return;
    }

    this.passwordResetForm.reset({ [HONEYPOT_FIELD_NAME]: '' });
    this.passwordResetOpen.set(true);
  }

  protected closePasswordReset(): void {
    this.passwordResetOpen.set(false);
  }

  protected onPasswordDialogStateChange(state: BrnDialogState): void {
    if (state === 'closed') {
      this.closePasswordReset();
    }
  }

  protected acceptPasswordReset(): void {
    const user = this.user();
    if (!user || this.isSaving()) {
      return;
    }

    const website = this.passwordResetForm.getRawValue().website;
    if (isHoneypotFilled(website)) {
      this.closePasswordReset();
      return;
    }

    this.closePasswordReset();
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.userAdminService
      .requestPasswordReset(user.id, website)
      .pipe(
        catchError((error: unknown) => {
          this.errorMessage.set(resolveAuthErrorMessage(error, 'Unable to send the password reset email.'));
          return EMPTY;
        }),
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((updated) => {
        if (updated) {
          this.user.set(updated);
        }
        this.successMessage.set('Password reset email sent.');
      });
  }

  protected pendingEmail(): string {
    return this.pendingUpdate?.email ?? '';
  }

  protected fieldError(field: UserField): string | null {
    return this.zodFieldErrors()[field] ?? null;
  }

  protected hasFieldError(field: UserField): boolean {
    return Boolean(this.fieldError(field));
  }

  private save(id: string, payload: UserAdminUpdateInput, success: string): void {
    this.isSaving.set(true);
    this.userAdminService
      .updateUser(id, payload)
      .pipe(
        catchError((error: unknown) => {
          const message = resolveAuthErrorMessage(error, 'Unable to save the user.');
          if (message === 'Email already exists') {
            this.zodFieldErrors.set({ email: 'This email is already used.' });
          } else {
            this.errorMessage.set(message);
          }
          return EMPTY;
        }),
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((updated) => {
        if (updated) {
          this.user.set(updated);
        }
        this.pendingUpdate = null;
        this.closeEdit();
        this.successMessage.set(success);
      });
  }
}
