import { NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import type { BrnDialogState } from '@spartan-ng/brain/dialog';
import { EMPTY, catchError, finalize } from 'rxjs';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';

import { ExperienceService } from '@/app/features/experiences/experience.service';
import { AdminAccessService } from '@/app/core/auth/admin-access.service';
import { AdminDatePipe } from '@/app/shared/pipes/admin-date.pipe';
import { AuthHoneypotFieldComponent } from '@/app/shared/components/auth-honeypot-field/auth-honeypot-field.component';
import { ExperienceAdminListItem } from '@/app/shared/models/experience.model';
import { HONEYPOT_FIELD_NAME, isHoneypotFilled } from '@/app/shared/utils/honeypot';

type SortField = 'company' | 'roleFr' | 'yearStart' | 'createdAt' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

const TABLE_ROWS = 10;
const TABLE_ROWS_OPTIONS = [10, 25, 50];
const TABLE_PAGE_LINKS = 5;
const ADMIN_ACTION_DENIED = 'Only administrators can perform this action.';

@Component({
  selector: 'app-experiences-list-page',
  host: { class: 'block' },
  imports: [
    AdminDatePipe,
    AuthHoneypotFieldComponent,
    FormsModule,
    HlmAlertDialogImports,
    HlmButtonImports,
    HlmIcon,
    HlmInputImports,
    HlmSelectImports,
    HlmSpinner,
    HlmTableImports,
    HlmTooltipImports,
    NgIcon,
    NgTemplateOutlet,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './experiences-list-page.html',
})
export class ExperiencesListPage {
  private readonly adminAccess = inject(AdminAccessService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly experienceService = inject(ExperienceService);

  protected readonly items = signal<readonly ExperienceAdminListItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly globalFilterValue = signal('');
  protected readonly rowsPerPage = signal(TABLE_ROWS);
  protected readonly currentPage = signal(1);
  protected readonly sortField = signal<SortField>('createdAt');
  protected readonly sortDirection = signal<SortDirection>('desc');
  protected readonly deleteTarget = signal<ExperienceAdminListItem | null>(null);
  protected readonly deactivateTarget = signal<ExperienceAdminListItem | null>(null);
  protected readonly reactivateTarget = signal<ExperienceAdminListItem | null>(null);

  protected readonly tableRowsOptions = TABLE_ROWS_OPTIONS;

  protected readonly deleteForm = this.formBuilder.nonNullable.group({
    [HONEYPOT_FIELD_NAME]: [''],
  });

  protected readonly deactivateForm = this.formBuilder.nonNullable.group({
    [HONEYPOT_FIELD_NAME]: [''],
  });

  protected readonly reactivateForm = this.formBuilder.nonNullable.group({
    [HONEYPOT_FIELD_NAME]: [''],
  });

  protected readonly filteredItems = computed(() => {
    const query = this.globalFilterValue().trim().toLowerCase();
    let rows = [...this.items()];

    if (query) {
      rows = rows.filter((item) => {
        const haystack = [
          item.company,
          item.roleFr,
          item.contractTypeFr,
          item.contractTypeEn,
          String(item.yearStart),
          item.yearEnd == null ? '' : String(item.yearEnd),
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    const field = this.sortField();
    const direction = this.sortDirection();

    rows.sort((left, right) => {
      if (field === 'yearStart') {
        const comparison = left.yearStart - right.yearStart;
        return direction === 'asc' ? comparison : -comparison;
      }

      const leftValue = left[field] ?? '';
      const rightValue = right[field] ?? '';
      const comparison = String(leftValue).localeCompare(String(rightValue));
      return direction === 'asc' ? comparison : -comparison;
    });

    return rows;
  });

  protected readonly totalPages = computed(() => {
    const total = this.filteredItems().length;
    return total === 0 ? 0 : Math.ceil(total / this.rowsPerPage());
  });

  protected readonly paginatedItems = computed(() => {
    const rows = this.rowsPerPage();
    const page = Math.min(this.currentPage(), Math.max(this.totalPages(), 1));
    const start = (page - 1) * rows;
    return this.filteredItems().slice(start, start + rows);
  });

  protected readonly pageLinks = computed(() => {
    const totalPages = this.totalPages();
    if (totalPages === 0) {
      return [] as number[];
    }

    const currentPage = Math.min(this.currentPage(), totalPages);
    let start = Math.max(1, currentPage - Math.floor(TABLE_PAGE_LINKS / 2));
    const end = Math.min(totalPages, start + TABLE_PAGE_LINKS - 1);
    start = Math.max(1, end - TABLE_PAGE_LINKS + 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  });

  protected readonly pageReport = computed(() => {
    const total = this.filteredItems().length;
    if (total === 0) {
      return 'No experiences';
    }

    const rows = this.rowsPerPage();
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * rows;
    const showing = Math.min(rows, total - start);
    return `Showing ${showing} of ${total} experiences`;
  });

  constructor() {
    this.loadItems();
  }

  protected yearsLabel(item: ExperienceAdminListItem): string {
    if (item.yearEnd === null) {
      return String(item.yearStart);
    }

    return `${item.yearStart}–${item.yearEnd}`;
  }

  protected contractTypeLabel(item: ExperienceAdminListItem): string {
    const fr = item.contractTypeFr?.trim() ?? '';
    const en = item.contractTypeEn?.trim() ?? '';
    if (fr && en) {
      return `${fr} / ${en}`;
    }

    return fr || en || '-';
  }

  protected deleteDialogState(): BrnDialogState {
    return this.deleteTarget() ? 'open' : 'closed';
  }

  protected confirmDelete(item: ExperienceAdminListItem): void {
    this.deleteForm.reset({ [HONEYPOT_FIELD_NAME]: '' });
    this.deleteTarget.set(item);
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

  protected deactivateDialogState(): BrnDialogState {
    return this.deactivateTarget() ? 'open' : 'closed';
  }

  protected confirmDeactivate(item: ExperienceAdminListItem): void {
    this.deactivateForm.reset({ [HONEYPOT_FIELD_NAME]: '' });
    this.deactivateTarget.set(item);
  }

  protected closeDeactivateDialog(): void {
    this.deactivateTarget.set(null);
    this.deactivateForm.reset({ [HONEYPOT_FIELD_NAME]: '' });
  }

  protected onDeactivateDialogStateChange(state: BrnDialogState): void {
    if (state === 'closed') {
      this.closeDeactivateDialog();
    }
  }

  protected reactivateDialogState(): BrnDialogState {
    return this.reactivateTarget() ? 'open' : 'closed';
  }

  protected confirmReactivate(item: ExperienceAdminListItem): void {
    this.reactivateForm.reset({ [HONEYPOT_FIELD_NAME]: '' });
    this.reactivateTarget.set(item);
  }

  protected closeReactivateDialog(): void {
    this.reactivateTarget.set(null);
    this.reactivateForm.reset({ [HONEYPOT_FIELD_NAME]: '' });
  }

  protected onReactivateDialogStateChange(state: BrnDialogState): void {
    if (state === 'closed') {
      this.closeReactivateDialog();
    }
  }

  protected acceptReactivate(): void {
    const item = this.reactivateTarget();
    if (!item) {
      return;
    }

    if (isHoneypotFilled(this.reactivateForm.getRawValue().website)) {
      this.closeReactivateDialog();
      return;
    }

    if (!this.ensureAdminAction()) {
      return;
    }

    this.closeReactivateDialog();

    this.experienceService
      .reactivateExperience(item.id, this.reactivateForm.getRawValue())
      .pipe(
        catchError(() => {
          this.errorMessage.set('Unable to reactivate the experience.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.items.update((rows) =>
          rows.map((row) => (row.id === item.id ? { ...row, deactivatedAt: null } : row)),
        );
      });
  }

  protected acceptDeactivate(): void {
    const item = this.deactivateTarget();
    if (!item) {
      return;
    }

    if (isHoneypotFilled(this.deactivateForm.getRawValue().website)) {
      this.closeDeactivateDialog();
      return;
    }

    if (!this.ensureAdminAction()) {
      return;
    }

    this.closeDeactivateDialog();

    this.experienceService
      .deactivateExperience(item.id, this.deactivateForm.getRawValue())
      .pipe(
        catchError(() => {
          this.errorMessage.set('Unable to deactivate the experience.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        const nowIso = new Date().toISOString();
        this.items.update((rows) =>
          rows.map((row) => (row.id === item.id ? { ...row, deactivatedAt: nowIso } : row)),
        );
      });
  }

  protected acceptDelete(): void {
    const item = this.deleteTarget();
    if (!item) {
      return;
    }

    if (isHoneypotFilled(this.deleteForm.getRawValue().website)) {
      this.closeDeleteDialog();
      return;
    }

    if (!this.ensureAdminAction()) {
      return;
    }

    this.closeDeleteDialog();

    this.experienceService
      .deleteExperience(item.id, this.deleteForm.getRawValue())
      .pipe(
        catchError(() => {
          this.errorMessage.set('Unable to delete the experience.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.items.update((rows) => rows.filter((row) => row.id !== item.id));
      });
  }

  protected onGlobalFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.globalFilterValue.set(value);
    this.currentPage.set(1);
  }

  protected onRowsPerPageChange(rows: number): void {
    (document.activeElement as HTMLElement | null)?.blur?.();
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

  private loadItems(): void {
    this.isLoading.set(true);

    this.experienceService
      .getExperiences(0, 200)
      .pipe(
        catchError(() => {
          this.errorMessage.set('Unable to load experiences.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.items.set(response.data);
        this.currentPage.set(1);
      });
  }

  private ensureAdminAction(): boolean {
    if (this.adminAccess.isAdmin()) {
      return true;
    }

    this.errorMessage.set(ADMIN_ACTION_DENIED);
    return false;
  }
}
