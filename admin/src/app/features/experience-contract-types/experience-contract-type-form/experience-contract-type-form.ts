import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { toast } from '@spartan-ng/brain/sonner';
import { EMPTY, catchError, finalize } from 'rxjs';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSpinner } from '@spartan-ng/helm/spinner';

import { ExperienceContractTypeService } from '@/app/features/experience-contract-types/experience-contract-type.service';
import { AdminAccessService } from '@/app/core/auth/admin-access.service';
import { resolveAuthErrorMessage } from '@/app/core/auth/auth-error-message';
import { AuthHoneypotFieldComponent } from '@/app/shared/components/auth-honeypot-field/auth-honeypot-field.component';
import {
  ExperienceContractTypeAdminDetail,
  ExperienceLocale,
} from '@/app/shared/models/experience-contract-type.model';
import {
  ExperienceContractTypeFormValue,
  ExperienceContractTypeLocaleField,
  experienceContractTypeFormSchema,
} from '@/app/shared/schemas/experience-contract-type.schema';
import { HONEYPOT_FIELD_NAME, isHoneypotFilled } from '@/app/shared/utils/honeypot';
import { slugify } from '@/app/shared/utils/slugify';
import { zodIssuesToFieldErrors } from '@/app/shared/utils/zod-field-errors';

const ADMIN_ACTION_DENIED = 'Only administrators can perform this action.';
const EMPTY_LOCALE = { title: '' };

@Component({
  selector: 'app-experience-contract-type-form',
  host: { class: 'block' },
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
  templateUrl: './experience-contract-type-form.html',
})
export class ExperienceContractTypeFormComponent implements OnInit {
  readonly mode = input.required<'create' | 'edit'>();
  readonly contractTypeId = input<string | null>(null);

  private readonly adminAccess = inject(AdminAccessService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly contractTypeService = inject(ExperienceContractTypeService);
  private readonly router = inject(Router);

  protected readonly activeTab = signal<ExperienceLocale>('fr');
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly hasSubmitted = signal(false);
  protected readonly zodFieldErrors = signal<Partial<Record<string, string>>>({});
  protected readonly loadedId = signal<string | null>(null);
  protected readonly previewSlug = signal('');
  protected readonly previewCodeFr = signal('');
  protected readonly previewCodeEn = signal('');

  protected readonly form = this.formBuilder.nonNullable.group({
    fr: this.formBuilder.nonNullable.group({ ...EMPTY_LOCALE }),
    en: this.formBuilder.nonNullable.group({ ...EMPTY_LOCALE }),
    [HONEYPOT_FIELD_NAME]: [''],
  });

  protected readonly pageTitle = computed(() =>
    this.mode() === 'create' ? 'Create - Contract type' : 'Edit - Contract type',
  );

  ngOnInit(): void {
    if (this.mode() === 'edit' && this.contractTypeId()) {
      this.isLoading.set(true);
      this.loadItem(this.contractTypeId()!);
    } else {
      this.refreshPreviews();
    }
  }

  protected requestTab(tab: ExperienceLocale): void {
    this.activeTab.set(tab);
  }

  protected onTitleInput(): void {
    this.refreshPreviews();
  }

  protected submitForm(): void {
    this.hasSubmitted.set(true);
    this.zodFieldErrors.set({});

    const raw = this.form.getRawValue();
    if (isHoneypotFilled(raw.website)) {
      return;
    }

    const payload: ExperienceContractTypeFormValue = {
      fr: raw.fr,
      en: raw.en,
    };

    const parsed = experienceContractTypeFormSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors = zodIssuesToFieldErrors(parsed.error);
      this.zodFieldErrors.set(fieldErrors);
      this.form.markAllAsTouched();
      this.handleValidationErrors(fieldErrors);
      return;
    }

    if (!this.ensureAdminAction()) {
      return;
    }

    const id = this.loadedId() ?? this.contractTypeId();
    if (this.mode() === 'edit' && !id) {
      this.notifyError('Unable to save contract type: missing identifier.');
      return;
    }

    this.isSaving.set(true);
    const body = {
      ...parsed.data,
      website: raw.website,
    };

    const request$ =
      this.mode() === 'create'
        ? this.contractTypeService.createContractType(body)
        : this.contractTypeService.updateContractType(id!, body);

    request$
      .pipe(
        catchError((error: unknown) => {
          this.notifyError(
            resolveAuthErrorMessage(error, 'Unable to save contract type. Please try again.'),
          );
          return EMPTY;
        }),
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((detail) => {
        if (!detail) {
          this.notifyError('Unable to save contract type. Please try again.');
          return;
        }

        this.applyDetail(detail);
        this.loadedId.set(detail.id);
        this.notifySuccess(
          this.mode() === 'create'
            ? 'Contract type created successfully.'
            : 'Contract type saved successfully.',
        );

        if (this.mode() === 'create') {
          void this.router.navigate(['/admin/experience-contract-types']);
        }
      });
  }

  protected hasLocaleErrors(tab: ExperienceLocale): boolean {
    if (!this.hasSubmitted()) {
      return false;
    }

    const prefix = `${tab}.`;
    return Object.keys(this.zodFieldErrors()).some((key) => key.startsWith(prefix));
  }

  protected fieldError(path: string): string | null {
    return this.zodFieldErrors()[path] ?? null;
  }

  protected localeFieldError(
    tab: ExperienceLocale,
    field: ExperienceContractTypeLocaleField,
  ): string | null {
    return this.fieldError(`${tab}.${field}`);
  }

  protected hasLocaleFieldError(
    tab: ExperienceLocale,
    field: ExperienceContractTypeLocaleField,
  ): boolean {
    return Boolean(this.localeFieldError(tab, field));
  }

  private loadItem(id: string): void {
    this.contractTypeService
      .getContractType(id)
      .pipe(
        catchError(() => {
          this.notifyError('Unable to load contract type.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((detail) => {
        this.loadedId.set(detail.id);
        this.applyDetail(detail);
      });
  }

  private applyDetail(detail: ExperienceContractTypeAdminDetail): void {
    this.form.patchValue({
      fr: { title: detail.fr.title },
      en: { title: detail.en.title },
      [HONEYPOT_FIELD_NAME]: '',
    });
    this.previewSlug.set(detail.slug);
    this.previewCodeFr.set(detail.codeFr);
    this.previewCodeEn.set(detail.codeEn);
  }

  private refreshPreviews(): void {
    const frTitle = this.form.controls.fr.controls.title.value;
    const enTitle = this.form.controls.en.controls.title.value;
    this.previewSlug.set(slugify(frTitle));
    this.previewCodeFr.set(slugify(`${frTitle}-fr`));
    this.previewCodeEn.set(slugify(`${enTitle}-en`));
  }

  private ensureAdminAction(): boolean {
    if (this.adminAccess.isAdmin()) {
      return true;
    }

    this.notifyError(ADMIN_ACTION_DENIED);
    return false;
  }

  private handleValidationErrors(errors: Partial<Record<string, string>>): void {
    const keys = Object.keys(errors);
    if (keys.some((key) => key.startsWith('en.'))) {
      this.activeTab.set('en');
      this.notifyError('Fix the errors in the English tab.');
      return;
    }

    if (keys.some((key) => key.startsWith('fr.'))) {
      this.activeTab.set('fr');
      this.notifyError('Fix the errors in the French tab.');
      return;
    }

    if (keys.length > 0) {
      this.notifyError('Fix the fields with errors below.');
    }
  }

  private notifySuccess(message: string): void {
    toast.success(message);
  }

  private notifyError(message: string): void {
    toast.error(message);
  }
}
