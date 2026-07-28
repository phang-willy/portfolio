import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import type { BrnDialogState } from '@spartan-ng/brain/dialog';
import { toast } from '@spartan-ng/brain/sonner';
import { TiptapEditorDirective } from 'ngx-tiptap';
import { EMPTY, catchError, finalize } from 'rxjs';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';

import { ProjectTiptapToolbarComponent } from '@/app/features/projects/project-form/project-tiptap-toolbar';
import { ExperienceContractTypeService } from '@/app/features/experience-contract-types/experience-contract-type.service';
import { ExperienceService } from '@/app/features/experiences/experience.service';
import { AdminAccessService } from '@/app/core/auth/admin-access.service';
import { resolveAuthErrorMessage } from '@/app/core/auth/auth-error-message';
import { AuthHoneypotFieldComponent } from '@/app/shared/components/auth-honeypot-field/auth-honeypot-field.component';
import { ExperienceContractTypeAdminListItem } from '@/app/shared/models/experience-contract-type.model';
import {
  ExperienceAdminDetail,
  ExperienceInput,
  ExperienceLocale,
  ExperienceLocaleInput,
} from '@/app/shared/models/experience.model';
import {
  ExperienceFormValue,
  ExperienceLocaleField,
  ExperienceSharedField,
  experienceFormSchema,
} from '@/app/shared/schemas/experience.schema';
import { HONEYPOT_FIELD_NAME, isHoneypotFilled } from '@/app/shared/utils/honeypot';
import { slugify } from '@/app/shared/utils/slugify';
import { zodIssuesToFieldErrors } from '@/app/shared/utils/zod-field-errors';

type LocaleFormGroup = {
  role: string;
  summary: string;
  content: string;
};

const ADMIN_ACTION_DENIED = 'Only administrators can perform this action.';
const EMPTY_LOCALE: LocaleFormGroup = {
  role: '',
  summary: '',
  content: '',
};

const EMPTY_EDITOR_HTML = /^<p>(?:<br\s*\/?>)?<\/p>$/i;

function normalizeEditorHtml(html: string): string {
  const value = html.trim();
  return EMPTY_EDITOR_HTML.test(value) ? '' : html;
}

@Component({
  selector: 'app-experience-form',
  host: { class: 'block' },
  imports: [
    AuthHoneypotFieldComponent,
    FormsModule,
    HlmAlertDialogImports,
    HlmButtonImports,
    HlmIcon,
    HlmInputImports,
    HlmSelectImports,
    HlmSpinner,
    HlmTextareaImports,
    NgIcon,
    NgTemplateOutlet,
    ProjectTiptapToolbarComponent,
    ReactiveFormsModule,
    RouterLink,
    TiptapEditorDirective,
  ],
  templateUrl: './experience-form.html',
  styleUrl: './experience-form.css',
})
export class ExperienceFormComponent implements OnInit, OnDestroy {
  readonly mode = input.required<'create' | 'edit'>();
  readonly experienceId = input<string | null>(null);

  private readonly adminAccess = inject(AdminAccessService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly experienceService = inject(ExperienceService);
  private readonly contractTypeService = inject(ExperienceContractTypeService);
  private readonly router = inject(Router);

  protected readonly contractTypes = signal<readonly ExperienceContractTypeAdminListItem[]>([]);
  protected readonly activeTab = signal<ExperienceLocale>('fr');
  protected readonly pendingTab = signal<ExperienceLocale | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly hasSubmitted = signal(false);
  protected readonly zodFieldErrors = signal<Partial<Record<string, string>>>({});
  protected readonly unsavedDialogVisible = signal(false);
  protected readonly loadedExperienceId = signal<string | null>(null);
  protected readonly savedSnapshot = signal<string | null>(null);
  protected readonly previewSlugFr = signal('');
  protected readonly previewSlugEn = signal('');
  protected readonly codeViewByTab = signal<Record<ExperienceLocale, boolean>>({
    fr: false,
    en: false,
  });

  protected frEditor!: Editor;
  protected enEditor!: Editor;

  protected readonly experienceForm = this.formBuilder.nonNullable.group({
    company: [''],
    yearStart: ['' as string | number],
    yearEnd: ['' as string | number],
    contractTypeId: [''],
    fr: this.formBuilder.nonNullable.group({ ...EMPTY_LOCALE }),
    en: this.formBuilder.nonNullable.group({ ...EMPTY_LOCALE }),
    [HONEYPOT_FIELD_NAME]: [''],
  });

  protected readonly pageTitle = computed(() =>
    this.mode() === 'create' ? 'Create - Experience' : 'Edit - Experience',
  );

  ngOnInit(): void {
    this.frEditor = this.createEditor('fr');
    this.enEditor = this.createEditor('en');
    this.loadContractTypes();

    if (this.mode() === 'edit' && this.experienceId()) {
      this.isLoading.set(true);
      this.loadExperience(this.experienceId()!);
    } else {
      this.syncEditorsToForm();
      this.refreshSlugPreviews();
      this.captureSnapshot();
    }
  }

  ngOnDestroy(): void {
    this.frEditor.destroy();
    this.enEditor.destroy();
  }

  protected get isDirty(): boolean {
    return this.serializeForm() !== this.savedSnapshot();
  }

  protected editorFor(tab: ExperienceLocale): Editor {
    return tab === 'fr' ? this.frEditor : this.enEditor;
  }

  protected contentModelFor(tab: ExperienceLocale): string {
    return tab === 'fr'
      ? this.experienceForm.controls.fr.controls.content.value
      : this.experienceForm.controls.en.controls.content.value;
  }

  protected onContentChange(tab: ExperienceLocale, value: string): void {
    const group = tab === 'fr' ? this.experienceForm.controls.fr : this.experienceForm.controls.en;
    group.patchValue({ content: normalizeEditorHtml(value) }, { emitEvent: false });
  }

  protected isCodeView(tab: ExperienceLocale): boolean {
    return this.codeViewByTab()[tab];
  }

  protected onCodeViewChange(tab: ExperienceLocale, enabled: boolean): void {
    if (enabled) {
      this.syncEditorsToForm();
      this.codeViewByTab.update((state) => ({ ...state, [tab]: true }));
      return;
    }

    const html = this.contentModelFor(tab);
    this.editorFor(tab).commands.setContent(html, { emitUpdate: false });
    this.codeViewByTab.update((state) => ({ ...state, [tab]: false }));
  }

  protected onGlobalSlugSourceInput(): void {
    this.refreshSlugPreviews();
  }

  protected onLocaleRoleInput(_tab: ExperienceLocale): void {
    this.refreshSlugPreviews();
  }

  protected slugPreview(tab: ExperienceLocale): string {
    return tab === 'fr' ? this.previewSlugFr() : this.previewSlugEn();
  }

  protected readonly contractTypeLabel = (contractTypeId: string | null | undefined): string => {
    if (!contractTypeId) {
      return 'None';
    }

    const contractType = this.contractTypes().find((item) => item.id === contractTypeId);
    if (!contractType) {
      return contractTypeId;
    }

    const suffix = contractType.deactivatedAt === null ? '' : ' (inactive)';
    return `${contractType.titleFr} / ${contractType.titleEn}${suffix}`;
  };

  protected requestTab(tab: ExperienceLocale, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.syncEditorsToForm();

    if (tab === this.activeTab()) {
      return;
    }

    // Create flow (and empty destination locale): keep both langs in the form and switch
    // without forcing a save that would validate the still-empty language.
    if (this.mode() === 'create' || this.isLocaleEmpty(tab) || !this.isDirty) {
      this.closeCodeView(this.activeTab());
      this.syncEditorFromForm(tab);
      this.activeTab.set(tab);
      return;
    }

    this.pendingTab.set(tab);
    this.unsavedDialogVisible.set(true);
  }

  protected unsavedDialogState(): BrnDialogState {
    return this.unsavedDialogVisible() ? 'open' : 'closed';
  }

  protected onUnsavedDialogStateChange(state: BrnDialogState): void {
    if (state === 'closed') {
      this.pendingTab.set(null);
      this.unsavedDialogVisible.set(false);
    }
  }

  protected cancelTabSwitch(): void {
    this.pendingTab.set(null);
    this.unsavedDialogVisible.set(false);
  }

  protected discardTabSwitch(): void {
    this.restoreFromSnapshot();
    const next = this.pendingTab();
    if (next) {
      this.closeCodeView(this.activeTab());
      this.activeTab.set(next);
    }
    this.pendingTab.set(null);
    this.unsavedDialogVisible.set(false);
  }

  protected saveAndSwitchTab(): void {
    const next = this.pendingTab();
    this.unsavedDialogVisible.set(false);
    this.submit((detail) => {
      if (next) {
        this.closeCodeView(this.activeTab());
        this.activeTab.set(next);
      }
      this.pendingTab.set(null);
      this.loadedExperienceId.set(detail.id);
    });
  }

  protected submitForm(): void {
    this.submit((detail) => {
      if (this.mode() === 'create') {
        void this.router.navigate(['/admin/experiences']);
        return;
      }

      this.loadedExperienceId.set(detail.id);
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

  protected localeFieldError(tab: ExperienceLocale, field: ExperienceLocaleField): string | null {
    return this.fieldError(`${tab}.${field}`);
  }

  protected hasLocaleFieldError(tab: ExperienceLocale, field: ExperienceLocaleField): boolean {
    return Boolean(this.localeFieldError(tab, field));
  }

  protected sharedFieldError(field: ExperienceSharedField): string | null {
    return this.fieldError(field);
  }

  protected hasSharedFieldError(field: ExperienceSharedField): boolean {
    return Boolean(this.sharedFieldError(field));
  }

  private submit(onSuccess?: (detail: ExperienceAdminDetail) => void): void {
    this.syncEditorsToForm();
    this.hasSubmitted.set(true);
    this.zodFieldErrors.set({});

    const raw = this.buildPayload();
    if (isHoneypotFilled(raw.website)) {
      return;
    }

    const parsed = experienceFormSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors = zodIssuesToFieldErrors(parsed.error);
      this.zodFieldErrors.set(fieldErrors);
      this.experienceForm.markAllAsTouched();
      this.handleValidationErrors(fieldErrors);
      return;
    }

    if (!this.ensureAdminAction()) {
      return;
    }

    const experienceId = this.loadedExperienceId() ?? this.experienceId();
    if (this.mode() === 'edit' && !experienceId) {
      this.notifyError('Unable to save experience: missing identifier.');
      return;
    }

    this.isSaving.set(true);
    const payload: ExperienceInput = {
      company: parsed.data.company,
      yearStart: parsed.data.yearStart,
      yearEnd: parsed.data.yearEnd ?? null,
      contractTypeId: parsed.data.contractTypeId ?? null,
      fr: parsed.data.fr,
      en: parsed.data.en,
      website: raw.website,
    };

    const request$ =
      this.mode() === 'create'
        ? this.experienceService.createExperience(payload)
        : this.experienceService.updateExperience(experienceId!, payload);

    request$
      .pipe(
        catchError((error: unknown) => {
          this.notifyError(
            resolveAuthErrorMessage(error, 'Unable to save experience. Please try again.'),
          );
          return EMPTY;
        }),
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((detail) => {
        if (!detail) {
          this.notifyError('Unable to save experience. Please try again.');
          return;
        }

        this.applyDetail(detail);
        this.loadedExperienceId.set(detail.id);
        this.captureSnapshot();
        this.notifySuccess(
          this.mode() === 'create'
            ? 'Experience created successfully.'
            : 'Experience saved successfully.',
        );
        onSuccess?.(detail);
      });
  }

  private loadContractTypes(): void {
    this.contractTypeService
      .getContractTypes(0, 200)
      .pipe(
        catchError(() => EMPTY),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        const sorted = [...response.data].sort((left, right) => {
          const leftActive = left.deactivatedAt === null ? 0 : 1;
          const rightActive = right.deactivatedAt === null ? 0 : 1;
          if (leftActive !== rightActive) {
            return leftActive - rightActive;
          }

          return left.titleFr.localeCompare(right.titleFr);
        });
        this.contractTypes.set(sorted);
      });
  }

  private loadExperience(id: string): void {
    this.isLoading.set(true);

    this.experienceService
      .getExperience(id)
      .pipe(
        catchError(() => {
          this.notifyError('Unable to load experience.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((detail) => {
        this.loadedExperienceId.set(detail.id);
        this.applyDetail(detail);
        this.captureSnapshot();
      });
  }

  private applyDetail(detail: ExperienceAdminDetail): void {
    this.experienceForm.patchValue({
      company: detail.company,
      yearStart: detail.yearStart,
      yearEnd: detail.yearEnd ?? '',
      contractTypeId: detail.contractTypeId ?? '',
      fr: this.toLocaleGroup(detail.fr),
      en: this.toLocaleGroup(detail.en),
      [HONEYPOT_FIELD_NAME]: '',
    });
    this.previewSlugFr.set(detail.slugFr);
    this.previewSlugEn.set(detail.slugEn);
    this.frEditor.commands.setContent(detail.fr.content || '', { emitUpdate: false });
    this.enEditor.commands.setContent(detail.en.content || '', { emitUpdate: false });
  }

  private toLocaleGroup(locale: ExperienceLocaleInput): LocaleFormGroup {
    return {
      role: locale.role,
      summary: locale.summary ?? '',
      content: locale.content ?? '',
    };
  }

  private isLocaleEmpty(tab: ExperienceLocale): boolean {
    const group =
      tab === 'fr' ? this.experienceForm.controls.fr : this.experienceForm.controls.en;
    const values = group.getRawValue();
    return (
      values.role.trim().length === 0 &&
      values.summary.trim().length === 0 &&
      normalizeEditorHtml(values.content).length === 0
    );
  }

  private refreshSlugPreviews(): void {
    const company = this.experienceForm.controls.company.value;
    const yearStart = this.experienceForm.controls.yearStart.value;
    const yearEnd = this.experienceForm.controls.yearEnd.value;
    const roleFr = this.experienceForm.controls.fr.controls.role.value;
    const roleEn = this.experienceForm.controls.en.controls.role.value;

    this.previewSlugFr.set(this.buildLocaleSlug(company, roleFr, yearStart, yearEnd, 'fr'));
    this.previewSlugEn.set(this.buildLocaleSlug(company, roleEn, yearStart, yearEnd, 'en'));
  }

  private buildLocaleSlug(
    company: string,
    role: string,
    yearStart: string | number,
    yearEnd: string | number,
    lang: ExperienceLocale,
  ): string {
    const parts = [company, role, yearStart === '' ? '' : String(yearStart)];
    if (yearEnd !== '' && yearEnd !== null && yearEnd !== undefined) {
      parts.push(String(yearEnd));
    }

    const base = slugify(parts.filter((part) => String(part).trim().length > 0).join('-'));
    const suffix = `-${lang}`;
    const maxBaseLength = 255 - suffix.length;
    if (base.length <= maxBaseLength) {
      return `${base}${suffix}`;
    }

    return `${base.slice(0, maxBaseLength).replace(/-+$/g, '')}${suffix}`;
  }

  private closeCodeView(tab: ExperienceLocale): void {
    if (!this.isCodeView(tab)) {
      return;
    }

    this.onCodeViewChange(tab, false);
  }

  private createEditor(tab: ExperienceLocale): Editor {
    return new Editor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          link: {
            openOnClick: false,
            autolink: true,
          },
        }),
      ],
      editorProps: {
        attributes: {
          class: [
            'experience-editor-content',
            'min-w-0 max-w-none text-sm',
            'prose prose-sm dark:prose-invert',
            '[&_h1]:text-2xl [&_h1]:font-semibold',
            '[&_h2]:text-xl [&_h2]:font-semibold',
            '[&_h3]:text-lg [&_h3]:font-semibold',
            '[&_ul]:list-disc [&_ul]:pl-6',
            '[&_ol]:list-decimal [&_ol]:pl-6',
            '[&_a]:underline [&_a]:break-all',
            '[&_hr]:my-4 [&_hr]:border-border',
            'min-h-40 rounded-b-md border border-input bg-transparent px-3 py-2 focus:outline-none',
          ].join(' '),
        },
      },
      onUpdate: ({ editor }) => {
        this.onContentChange(tab, editor.getHTML());
      },
    });
  }

  private syncEditorsToForm(): void {
    const patch: Partial<{
      fr: typeof this.experienceForm.controls.fr.value;
      en: typeof this.experienceForm.controls.en.value;
    }> = {};

    if (!this.isCodeView('fr')) {
      patch.fr = {
        ...this.experienceForm.controls.fr.getRawValue(),
        content: normalizeEditorHtml(this.frEditor.getHTML()),
      };
    }

    if (!this.isCodeView('en')) {
      patch.en = {
        ...this.experienceForm.controls.en.getRawValue(),
        content: normalizeEditorHtml(this.enEditor.getHTML()),
      };
    }

    if (patch.fr !== undefined || patch.en !== undefined) {
      this.experienceForm.patchValue(patch);
    }
  }

  private syncEditorFromForm(tab: ExperienceLocale): void {
    const html = this.contentModelFor(tab);
    this.editorFor(tab).commands.setContent(html || '', { emitUpdate: false });
  }

  private buildPayload(): ExperienceFormValue & { website: string } {
    this.syncEditorsToForm();
    const raw = this.experienceForm.getRawValue();
    const yearEndRaw = raw.yearEnd;
    const contractTypeIdRaw = raw.contractTypeId;

    return {
      company: raw.company,
      yearStart: raw.yearStart as number,
      yearEnd:
        yearEndRaw === '' || yearEndRaw === null || yearEndRaw === undefined
          ? null
          : (yearEndRaw as number),
      contractTypeId: contractTypeIdRaw === '' ? null : contractTypeIdRaw,
      fr: raw.fr,
      en: raw.en,
      website: raw[HONEYPOT_FIELD_NAME],
    };
  }

  private serializeForm(): string {
    return JSON.stringify(this.buildPayload());
  }

  private captureSnapshot(): void {
    this.savedSnapshot.set(this.serializeForm());
  }

  private restoreFromSnapshot(): void {
    const snapshot = this.savedSnapshot();
    if (!snapshot) {
      return;
    }

    const parsed = JSON.parse(snapshot) as ExperienceFormValue & { website?: string };
    this.experienceForm.patchValue({
      company: parsed.company,
      yearStart: parsed.yearStart,
      yearEnd: parsed.yearEnd ?? '',
      contractTypeId: parsed.contractTypeId ?? '',
      fr: parsed.fr,
      en: parsed.en,
      [HONEYPOT_FIELD_NAME]: parsed.website ?? '',
    });
    this.refreshSlugPreviews();
    this.frEditor.commands.setContent(parsed.fr.content || '', { emitUpdate: false });
    this.enEditor.commands.setContent(parsed.en.content || '', { emitUpdate: false });
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
    if (keys.length === 0) {
      return;
    }

    const firstKey = keys[0] ?? '';
    if (firstKey.startsWith('en.')) {
      this.activeTab.set('en');
    } else if (firstKey.startsWith('fr.')) {
      this.activeTab.set('fr');
    }

    const hasFrErrors = keys.some((key) => key.startsWith('fr.'));
    const hasEnErrors = keys.some((key) => key.startsWith('en.'));
    const hasSharedErrors = keys.some((key) => !key.includes('.'));

    if (hasFrErrors && hasEnErrors) {
      this.notifyError('Fix the errors in the French and English tabs.');
      return;
    }

    if (hasEnErrors) {
      this.notifyError('Fix the errors in the English tab.');
      return;
    }

    if (hasFrErrors) {
      this.notifyError('Fix the errors in the French tab.');
      return;
    }

    if (hasSharedErrors) {
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
