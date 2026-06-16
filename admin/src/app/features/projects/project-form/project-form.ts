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
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';

import { ProjectTiptapToolbarComponent } from '@/app/features/projects/project-form/project-tiptap-toolbar';

import { ProjectService } from '@/app/features/projects/project.service';
import { StackNamePipe } from '@/app/features/projects/project-form/stack-name.pipe';
import { StackService } from '@/app/features/stacks/stack.service';
import { AdminAccessService } from '@/app/core/auth/admin-access.service';
import { resolveAuthErrorMessage } from '@/app/core/auth/auth-error-message';
import { AuthHoneypotFieldComponent } from '@/app/shared/components/auth-honeypot-field/auth-honeypot-field.component';
import {
  ProjectAdminDetail,
  ProjectLocale,
  ProjectLocaleInput,
} from '@/app/shared/models/project.model';
import { Stack } from '@/app/shared/models/stack.model';
import {
  ProjectFormValue,
  ProjectLocaleField,
  projectFormSchema,
} from '@/app/shared/schemas/project.schema';
import { HONEYPOT_FIELD_NAME, isHoneypotFilled } from '@/app/shared/utils/honeypot';
import { slugify } from '@/app/shared/utils/slugify';
import { zodIssuesToFieldErrors } from '@/app/shared/utils/zod-field-errors';

type LocaleFormGroup = {
  title: string;
  description: string;
  content: string;
  imageAlt: string;
};

const ADMIN_ACTION_DENIED = 'Only administrators can perform this action.';
const EMPTY_LOCALE: LocaleFormGroup = {
  title: '',
  description: '',
  content: '',
  imageAlt: '',
};

const EMPTY_EDITOR_HTML = /^<p>(?:<br\s*\/?>)?<\/p>$/i;

function normalizeEditorHtml(html: string): string {
  const value = html.trim();
  return EMPTY_EDITOR_HTML.test(value) ? '' : html;
}

@Component({
  selector: 'app-project-form',
  host: { class: 'block' },
  imports: [
    AuthHoneypotFieldComponent,
    FormsModule,
    HlmAlertDialogImports,
    HlmButtonImports,
    HlmComboboxImports,
    HlmIcon,
    HlmInputImports,
    HlmSpinner,
    HlmTextareaImports,
    NgIcon,
    NgTemplateOutlet,
    ProjectTiptapToolbarComponent,
    ReactiveFormsModule,
    RouterLink,
    StackNamePipe,
    TiptapEditorDirective,
  ],
  templateUrl: './project-form.html',
  styleUrl: './project-form.css',
})
export class ProjectFormComponent implements OnInit, OnDestroy {
  readonly mode = input.required<'create' | 'edit'>();
  readonly projectId = input<string | null>(null);

  private readonly adminAccess = inject(AdminAccessService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);
  private readonly stackService = inject(StackService);

  protected readonly stacks = signal<readonly Stack[]>([]);
  protected readonly selectedStackIds = signal<string[]>([]);
  protected readonly activeTab = signal<ProjectLocale>('fr');
  protected readonly pendingTab = signal<ProjectLocale | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly isUploadingImage = signal(false);
  protected readonly hasSubmitted = signal(false);
  protected readonly zodFieldErrors = signal<Partial<Record<string, string>>>({});
  protected readonly unsavedDialogVisible = signal(false);
  protected readonly slugManuallyEdited = signal(false);
  protected readonly loadedProjectId = signal<string | null>(null);
  protected readonly savedSnapshot = signal<string | null>(null);
  protected readonly codeViewByTab = signal<Record<ProjectLocale, boolean>>({ fr: false, en: false });

  protected frEditor!: Editor;
  protected enEditor!: Editor;

  protected readonly projectForm = this.formBuilder.nonNullable.group({
    slug: [''],
    fr: this.formBuilder.nonNullable.group({ ...EMPTY_LOCALE }),
    en: this.formBuilder.nonNullable.group({ ...EMPTY_LOCALE }),
    productionLink: [''],
    sourceCodeLink: [''],
    imageLink: [''],
    [HONEYPOT_FIELD_NAME]: [''],
  });

  protected readonly pageTitle = computed(() =>
    this.mode() === 'create' ? 'Create - Project' : 'Edit - Project',
  );

  ngOnInit(): void {
    this.frEditor = this.createEditor('fr');
    this.enEditor = this.createEditor('en');
    this.loadStacks();

    if (this.mode() === 'edit' && this.projectId()) {
      this.isLoading.set(true);
      this.loadProject(this.projectId()!);
    } else {
      this.syncEditorsToForm();
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

  protected editorFor(tab: ProjectLocale): Editor {
    return tab === 'fr' ? this.frEditor : this.enEditor;
  }

  protected contentModelFor(tab: ProjectLocale): string {
    return tab === 'fr'
      ? this.projectForm.controls.fr.controls.content.value
      : this.projectForm.controls.en.controls.content.value;
  }

  protected onContentChange(tab: ProjectLocale, value: string): void {
    const group = tab === 'fr' ? this.projectForm.controls.fr : this.projectForm.controls.en;
    group.patchValue({ content: normalizeEditorHtml(value) }, { emitEvent: false });
  }

  protected isCodeView(tab: ProjectLocale): boolean {
    return this.codeViewByTab()[tab];
  }

  protected onCodeViewChange(tab: ProjectLocale, enabled: boolean): void {
    if (enabled) {
      this.syncEditorsToForm();
      this.codeViewByTab.update((state) => ({ ...state, [tab]: true }));
      return;
    }

    const html = this.contentModelFor(tab);
    this.editorFor(tab).commands.setContent(html, { emitUpdate: false });
    this.codeViewByTab.update((state) => ({ ...state, [tab]: false }));
  }

  protected onTitleInput(tab: ProjectLocale): void {
    if (tab !== 'fr' || this.slugManuallyEdited()) {
      return;
    }

    const title = this.projectForm.controls.fr.controls.title.value;
    this.projectForm.patchValue({ slug: slugify(title) });
  }

  protected onSlugInput(): void {
    this.slugManuallyEdited.set(true);
  }

  protected requestTab(tab: ProjectLocale, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.syncEditorsToForm();

    if (tab === this.activeTab()) {
      return;
    }

    if (!this.isDirty) {
      this.syncEditorsToForm();
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
      this.loadedProjectId.set(detail.id);
    });
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    if (!this.ensureAdminAction()) {
      return;
    }

    this.isUploadingImage.set(true);

    this.projectService
      .uploadImage(file)
      .pipe(
        catchError(() => {
          this.notifyError('Unable to upload image. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.isUploadingImage.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((url) => {
        this.projectForm.patchValue({ imageLink: url });
      });
  }

  protected clearImage(): void {
    this.projectForm.patchValue({ imageLink: '' });
  }

  protected submitForm(): void {
    this.submit((detail) => {
      if (this.mode() === 'create') {
        void this.router.navigate(['/admin/projects']);
        return;
      }

      this.loadedProjectId.set(detail.id);
    });
  }

  protected hasLocaleErrors(tab: ProjectLocale): boolean {
    if (!this.hasSubmitted()) {
      return false;
    }

    const prefix = `${tab}.`;
    return Object.keys(this.zodFieldErrors()).some((key) => key.startsWith(prefix));
  }

  protected fieldError(path: string): string | null {
    const zodError = this.zodFieldErrors()[path];
    if (zodError) {
      return zodError;
    }

    return null;
  }

  protected hasFieldError(path: string): boolean {
    return Boolean(this.fieldError(path));
  }

  protected localeFieldError(tab: ProjectLocale, field: ProjectLocaleField): string | null {
    return this.fieldError(`${tab}.${field}`);
  }

  protected hasLocaleFieldError(tab: ProjectLocale, field: ProjectLocaleField): boolean {
    return Boolean(this.localeFieldError(tab, field));
  }

  private submit(onSuccess?: (detail: ProjectAdminDetail) => void): void {
    this.syncEditorsToForm();
    this.hasSubmitted.set(true);
    this.zodFieldErrors.set({});

    const raw = this.buildPayload();
    if (isHoneypotFilled(raw.website)) {
      return;
    }

    const parsed = projectFormSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors = zodIssuesToFieldErrors(parsed.error);
      this.zodFieldErrors.set(fieldErrors);
      this.projectForm.markAllAsTouched();
      this.handleValidationErrors(fieldErrors);
      return;
    }

    if (!this.ensureAdminAction()) {
      return;
    }

    const projectId = this.loadedProjectId() ?? this.projectId();
    if (this.mode() === 'edit' && !projectId) {
      this.notifyError('Unable to save project: missing identifier.');
      return;
    }

    this.isSaving.set(true);
    const payload = {
      ...parsed.data,
      website: raw.website,
    };

    const request$ =
      this.mode() === 'create'
        ? this.projectService.createProject(payload)
        : this.projectService.updateProject(projectId!, payload);

    request$
      .pipe(
        catchError((error: unknown) => {
          this.notifyError(resolveAuthErrorMessage(error, 'Unable to save project. Please try again.'));
          return EMPTY;
        }),
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((detail) => {
        if (!detail) {
          this.notifyError('Unable to save project. Please try again.');
          return;
        }

        this.applyDetail(detail);
        this.loadedProjectId.set(detail.id);
        this.captureSnapshot();
        this.notifySuccess(
          this.mode() === 'create' ? 'Project created successfully.' : 'Project saved successfully.',
        );
        onSuccess?.(detail);
      });
  }

  private loadStacks(): void {
    this.stackService
      .getStacks(0, 200)
      .pipe(
        catchError(() => EMPTY),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.stacks.set(response.data);
      });
  }

  private loadProject(id: string): void {
    this.isLoading.set(true);

    this.projectService
      .getProject(id)
      .pipe(
        catchError(() => {
          this.notifyError('Unable to load project.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((detail) => {
        this.loadedProjectId.set(detail.id);
        this.applyDetail(detail);
        this.captureSnapshot();
      });
  }

  private applyDetail(detail: ProjectAdminDetail): void {
    this.projectForm.patchValue({
      slug: detail.slug,
      fr: this.toLocaleGroup(detail.fr),
      en: this.toLocaleGroup(detail.en),
      productionLink: detail.productionLink ?? '',
      sourceCodeLink: detail.sourceCodeLink ?? '',
      imageLink: detail.imageLink ?? '',
      [HONEYPOT_FIELD_NAME]: '',
    });
    this.selectedStackIds.set([...detail.stackIds]);
    this.slugManuallyEdited.set(true);
    this.frEditor.commands.setContent(detail.fr.content || '', { emitUpdate: false });
    this.enEditor.commands.setContent(detail.en.content || '', { emitUpdate: false });
  }

  private toLocaleGroup(locale: ProjectLocaleInput): LocaleFormGroup {
    return {
      title: locale.title,
      description: locale.description ?? '',
      content: locale.content ?? '',
      imageAlt: locale.imageAlt ?? '',
    };
  }

  private closeCodeView(tab: ProjectLocale): void {
    if (!this.isCodeView(tab)) {
      return;
    }

    this.onCodeViewChange(tab, false);
  }

  private createEditor(tab: ProjectLocale): Editor {
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
            'project-editor-content',
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
      fr: typeof this.projectForm.controls.fr.value;
      en: typeof this.projectForm.controls.en.value;
    }> = {};

    if (!this.isCodeView('fr')) {
      patch.fr = {
        ...this.projectForm.controls.fr.getRawValue(),
        content: normalizeEditorHtml(this.frEditor.getHTML()),
      };
    }

    if (!this.isCodeView('en')) {
      patch.en = {
        ...this.projectForm.controls.en.getRawValue(),
        content: normalizeEditorHtml(this.enEditor.getHTML()),
      };
    }

    if (patch.fr !== undefined || patch.en !== undefined) {
      this.projectForm.patchValue(patch);
    }
  }

  private syncEditorFromForm(tab: ProjectLocale): void {
    const html = this.contentModelFor(tab);
    this.editorFor(tab).commands.setContent(html || '', { emitUpdate: false });
  }

  private buildPayload(): ProjectFormValue & { website: string } {
    this.syncEditorsToForm();
    const raw = this.projectForm.getRawValue();

    return {
      slug: raw.slug,
      fr: raw.fr,
      en: raw.en,
      stackIds: this.selectedStackIds(),
      productionLink: raw.productionLink,
      sourceCodeLink: raw.sourceCodeLink,
      imageLink: raw.imageLink,
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

    const parsed = JSON.parse(snapshot) as ProjectFormValue & { website?: string };
    this.projectForm.patchValue({
      slug: parsed.slug,
      fr: parsed.fr,
      en: parsed.en,
      productionLink: parsed.productionLink,
      sourceCodeLink: parsed.sourceCodeLink,
      imageLink: parsed.imageLink,
      [HONEYPOT_FIELD_NAME]: parsed.website ?? '',
    });
    this.selectedStackIds.set([...parsed.stackIds]);
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
