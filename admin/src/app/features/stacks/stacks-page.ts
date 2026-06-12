import { NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NgIcon } from '@ng-icons/core';
import type { BrnDialogState } from '@spartan-ng/brain/dialog';
import { EMPTY, catchError, finalize } from 'rxjs';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';

import { StackService } from '@/app/features/stacks/stack.service';
import { AdminAccessService } from '@/app/core/auth/admin-access.service';
import { AdminDatePipe } from '@/app/shared/pipes/admin-date.pipe';
import { AuthHoneypotFieldComponent } from '@/app/shared/components/auth-honeypot-field/auth-honeypot-field.component';
import { Stack } from '@/app/shared/models/stack.model';
import { isInlineSvgMarkup, stackFormSchema } from '@/app/shared/schemas/stack.schema';
import { HONEYPOT_FIELD_NAME, isHoneypotFilled } from '@/app/shared/utils/honeypot';
import { zodIssuesToFieldErrors } from '@/app/shared/utils/zod-field-errors';

type StackField = 'name' | 'image';
type SortField = 'name' | 'createdAt' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

const TABLE_ROWS = 10;
const TABLE_ROWS_OPTIONS = [10, 25, 50];
const TABLE_PAGE_LINKS = 5;
const ADMIN_ACTION_DENIED = 'Only administrators can perform this action.';

@Component({
  selector: 'app-stacks-page',
  host: { class: 'block' },
  imports: [
    AdminDatePipe,
    AuthHoneypotFieldComponent,
    FormsModule,
    HlmAlertDialogImports,
    HlmButtonImports,
    HlmDialogImports,
    HlmIcon,
    HlmInputImports,
    HlmSelectImports,
    HlmSpinner,
    HlmTableImports,
    HlmTextareaImports,
    NgIcon,
    NgTemplateOutlet,
    ReactiveFormsModule,
  ],
  templateUrl: './stacks-page.html',
})
export class StacksPage {
  private readonly adminAccess = inject(AdminAccessService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly stackService = inject(StackService);

  protected readonly stacks = signal<readonly Stack[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly hasSubmitted = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly zodFieldErrors = signal<Partial<Record<StackField, string>>>({});
  protected readonly editingStack = signal<Stack | null>(null);
  protected readonly globalFilterValue = signal('');
  protected readonly rowsPerPage = signal(TABLE_ROWS);
  protected readonly currentPage = signal(1);
  protected readonly sortField = signal<SortField>('name');
  protected readonly sortDirection = signal<SortDirection>('asc');
  protected readonly deleteTarget = signal<Stack | null>(null);

  protected readonly tableRowsOptions = TABLE_ROWS_OPTIONS;

  protected readonly filteredStacks = computed(() => {
    const query = this.globalFilterValue().trim().toLowerCase();
    let items = [...this.stacks()];

    if (query) {
      items = items.filter((stack) => {
        const haystack = [stack.name, stack.createdAt, stack.updatedAt]
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    const field = this.sortField();
    const direction = this.sortDirection();

    items.sort((left, right) => {
      const leftValue = left[field];
      const rightValue = right[field];
      const comparison = leftValue.localeCompare(rightValue);
      return direction === 'asc' ? comparison : -comparison;
    });

    return items;
  });

  protected readonly totalPages = computed(() => {
    const total = this.filteredStacks().length;
    if (total === 0) {
      return 0;
    }

    return Math.ceil(total / this.rowsPerPage());
  });

  protected readonly paginatedStacks = computed(() => {
    const rows = this.rowsPerPage();
    const page = Math.min(this.currentPage(), Math.max(this.totalPages(), 1));
    const start = (page - 1) * rows;
    return this.filteredStacks().slice(start, start + rows);
  });

  protected readonly pageLinks = computed(() => {
    const totalPages = this.totalPages();
    if (totalPages === 0) {
      return [] as number[];
    }

    const currentPage = Math.min(this.currentPage(), totalPages);
    let start = Math.max(1, currentPage - Math.floor(TABLE_PAGE_LINKS / 2));
    let end = Math.min(totalPages, start + TABLE_PAGE_LINKS - 1);
    start = Math.max(1, end - TABLE_PAGE_LINKS + 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  });

  protected readonly pageReport = computed(() => {
    const total = this.filteredStacks().length;
    if (total === 0) {
      return 'No stacks';
    }

    const rows = this.rowsPerPage();
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * rows;
    const showing = Math.min(rows, total - start);
    return `Showing ${showing} of ${total} stacks`;
  });

  protected readonly stackForm = this.formBuilder.nonNullable.group({
    name: [''],
    image: [''],
    [HONEYPOT_FIELD_NAME]: [''],
  });

  protected readonly deleteForm = this.formBuilder.nonNullable.group({
    [HONEYPOT_FIELD_NAME]: [''],
  });

  constructor() {
    this.loadStacks();
  }

  protected get dialogTitle(): string {
    return this.editingStack() ? 'Edit stack' : 'New stack';
  }

  protected dialogState(): BrnDialogState {
    return this.dialogVisible() ? 'open' : 'closed';
  }

  protected deleteDialogState(): BrnDialogState {
    return this.deleteTarget() ? 'open' : 'closed';
  }

  protected openCreateDialog(): void {
    if (!this.ensureAdminAction()) {
      return;
    }

    this.editingStack.set(null);
    this.resetForm();
    this.dialogVisible.set(true);
  }

  protected openEditDialog(stack: Stack): void {
    this.editingStack.set(stack);
    this.resetForm();
    this.stackForm.patchValue({
      name: stack.name,
      image: stack.image ?? '',
    });
    this.dialogVisible.set(true);
  }

  protected closeDialog(): void {
    this.dialogVisible.set(false);
    this.editingStack.set(null);
    this.resetForm();
  }

  protected onDialogStateChange(state: BrnDialogState): void {
    if (state === 'closed') {
      this.closeDialog();
    }
  }

  protected confirmDelete(stack: Stack): void {
    this.deleteForm.reset({ [HONEYPOT_FIELD_NAME]: '' });
    this.deleteTarget.set(stack);
  }

  protected closeDeleteDialog(): void {
    this.deleteTarget.set(null);
    this.deleteForm.reset({ [HONEYPOT_FIELD_NAME]: '' });
  }

  protected onDeleteDialogStateChange(state: BrnDialogState): void {
    if (state === 'closed') {
      this.closeDeleteDialog();
    }
  }

  protected acceptDelete(): void {
    const stack = this.deleteTarget();
    if (!stack) {
      return;
    }

    if (isHoneypotFilled(this.deleteForm.getRawValue().website)) {
      this.closeDeleteDialog();
      return;
    }

    this.closeDeleteDialog();
    this.deleteStack(stack.id, this.deleteForm.getRawValue().website);
  }

  protected submitStack(): void {
    this.hasSubmitted.set(true);
    this.errorMessage.set(null);
    this.zodFieldErrors.set({});

    const raw = this.stackForm.getRawValue();
    if (isHoneypotFilled(raw.website)) {
      return;
    }

    const parsed = stackFormSchema.safeParse(raw);
    if (!parsed.success) {
      this.zodFieldErrors.set(zodIssuesToFieldErrors(parsed.error));
      this.stackForm.markAllAsTouched();
      return;
    }

    const payload = {
      ...parsed.data,
      website: raw.website,
    };
    const editing = this.editingStack();

    if (!editing && !this.ensureAdminAction()) {
      return;
    }

    this.isSaving.set(true);

    const request$ = editing
      ? this.stackService.updateStack(editing.id, payload)
      : this.stackService.createStack(payload);

    request$
      .pipe(
        catchError(() => {
          this.errorMessage.set('Unable to save the stack. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((stack) => {
        if (editing) {
          this.stacks.update((items) =>
            items.map((item) => (item.id === stack.id ? stack : item)),
          );
        } else {
          this.stacks.update((items) => [...items, stack]);
        }

        this.closeDialog();
      });
  }

  protected fieldError(field: StackField): string | null {
    const zodError = this.zodFieldErrors()[field];
    if (zodError) {
      return zodError;
    }

    const control = this.stackForm.controls[field];
    if (!this.hasSubmitted() && !control.touched) {
      return null;
    }

    return null;
  }

  protected hasFieldError(field: StackField): boolean {
    return Boolean(this.fieldError(field));
  }

  protected svgPreview(markup: string | null): SafeHtml | null {
    if (!markup || !isInlineSvgMarkup(markup)) {
      return null;
    }

    return this.sanitizer.bypassSecurityTrustHtml(markup);
  }

  protected onGlobalFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.globalFilterValue.set(value);
    this.currentPage.set(1);
  }

  protected onRowsPerPageChange(rows: number): void {
    this.rowsPerPage.set(rows);
    this.currentPage.set(1);
  }

  protected changePage(page: number): void {
    const totalPages = this.totalPages();
    if (totalPages === 0) {
      return;
    }

    this.currentPage.set(Math.min(Math.max(1, page), totalPages));
  }

  protected isFirstPage(): boolean {
    return this.currentPage() <= 1;
  }

  protected isLastPage(): boolean {
    return this.currentPage() >= this.totalPages();
  }

  protected toggleSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDirection.update((direction) => (direction === 'asc' ? 'desc' : 'asc'));
      return;
    }

    this.sortField.set(field);
    this.sortDirection.set('asc');
  }

  protected isSorted(field: SortField): boolean {
    return this.sortField() === field;
  }

  protected sortIcon(field: SortField): string {
    if (!this.isSorted(field)) {
      return 'lucideArrowUpDown';
    }

    return this.sortDirection() === 'asc' ? 'lucideArrowUp' : 'lucideArrowDown';
  }

  private loadStacks(): void {
    this.isLoading.set(true);

    this.stackService
      .getStacks()
      .pipe(
        catchError(() => {
          this.errorMessage.set('Unable to load stacks.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.stacks.set(response.data);
        this.currentPage.set(1);
      });
  }

  private deleteStack(id: string, website: string): void {
    if (!this.ensureAdminAction()) {
      return;
    }

    this.stackService
      .deleteStack(id, { website })
      .pipe(
        catchError(() => {
          this.errorMessage.set('Unable to delete the stack.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.stacks.update((items) => items.filter((item) => item.id !== id));
      });
  }

  private resetForm(): void {
    this.stackForm.reset({ name: '', image: '', [HONEYPOT_FIELD_NAME]: '' });
    this.hasSubmitted.set(false);
    this.errorMessage.set(null);
    this.zodFieldErrors.set({});
  }

  private ensureAdminAction(): boolean {
    if (this.adminAccess.isAdmin()) {
      return true;
    }

    this.errorMessage.set(ADMIN_ACTION_DENIED);
    return false;
  }
}
