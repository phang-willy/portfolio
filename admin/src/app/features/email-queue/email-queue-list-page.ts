import { NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import type { BrnDialogState } from '@spartan-ng/brain/dialog';
import { EMPTY, catchError } from 'rxjs';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmBadgeImports, type BadgeVariants } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';

import { EmailQueueService } from '@/app/features/email-queue/email-queue.service';
import { AdminAccessService } from '@/app/core/auth/admin-access.service';
import { resolveApiErrorMessage } from '@/app/core/auth/auth-error-message';
import { AdminDatePipe } from '@/app/shared/pipes/admin-date.pipe';
import { AuthHoneypotFieldComponent } from '@/app/shared/components/auth-honeypot-field/auth-honeypot-field.component';
import {
  EmailQueueAdminListItem,
  EmailQueueErrorEntry,
  EmailQueueStatus,
} from '@/app/shared/models/email-queue.model';
import { HONEYPOT_FIELD_NAME, isHoneypotFilled } from '@/app/shared/utils/honeypot';

type SortField =
  | 'recipient'
  | 'subject'
  | 'status'
  | 'attempts'
  | 'scheduledAt'
  | 'sentAt'
  | 'createdAt';
type SortDirection = 'asc' | 'desc';

const TABLE_ROWS = 10;
const TABLE_ROWS_OPTIONS = [10, 25, 50];
const TABLE_PAGE_LINKS = 5;
const ADMIN_ACTION_DENIED = 'Only administrators can perform this action.';

const STATUS_LABELS: Record<EmailQueueStatus, string> = {
  PENDING: 'Pending',
  SENT: 'Sent',
  FAILED: 'Failed',
};

@Component({
  selector: 'app-email-queue-list-page',
  host: { class: 'block' },
  imports: [
    AdminDatePipe,
    AuthHoneypotFieldComponent,
    FormsModule,
    HlmAlertDialogImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmDialogImports,
    HlmIcon,
    HlmInputImports,
    HlmSelectImports,
    HlmSpinner,
    HlmTableImports,
    HlmTooltipImports,
    NgIcon,
    NgTemplateOutlet,
    ReactiveFormsModule,
  ],
  templateUrl: './email-queue-list-page.html',
})
export class EmailQueueListPage {
  private readonly adminAccess = inject(AdminAccessService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly emailQueueService = inject(EmailQueueService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly emails = this.emailQueueService.emails;
  protected readonly isLoading = this.emailQueueService.isLoading;
  protected readonly actionError = signal<string | null>(null);
  protected readonly errorMessage = computed(
    () => this.actionError() ?? this.emailQueueService.loadError(),
  );
  protected readonly globalFilterValue = signal('');
  protected readonly rowsPerPage = signal(TABLE_ROWS);
  protected readonly currentPage = signal(1);
  protected readonly sortField = signal<SortField>('createdAt');
  protected readonly sortDirection = signal<SortDirection>('desc');
  protected readonly resendTarget = signal<EmailQueueAdminListItem | null>(null);
  protected readonly errorHistoryTarget = signal<EmailQueueAdminListItem | null>(null);

  protected readonly tableRowsOptions = TABLE_ROWS_OPTIONS;

  protected readonly resendForm = this.formBuilder.nonNullable.group({
    [HONEYPOT_FIELD_NAME]: [''],
  });

  protected readonly filteredEmails = computed(() => {
    const query = this.globalFilterValue().trim().toLowerCase();
    let items = [...this.emails()];

    if (query) {
      items = items.filter((email) => {
        const haystack = [
          email.recipient,
          email.subject,
          email.status,
          STATUS_LABELS[email.status],
          String(email.attempts),
          ...(email.lastError ?? []).flatMap((entry) => [entry.at, entry.message]),
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    const field = this.sortField();
    const direction = this.sortDirection();

    items.sort((left, right) => {
      if (field === 'attempts') {
        const comparison = left.attempts - right.attempts;
        return direction === 'asc' ? comparison : -comparison;
      }

      const leftValue = left[field] ?? '';
      const rightValue = right[field] ?? '';
      const comparison = String(leftValue).localeCompare(String(rightValue));
      return direction === 'asc' ? comparison : -comparison;
    });

    return items;
  });

  protected readonly totalPages = computed(() => {
    const total = this.filteredEmails().length;
    return total === 0 ? 0 : Math.ceil(total / this.rowsPerPage());
  });

  protected readonly paginatedEmails = computed(() => {
    const rows = this.rowsPerPage();
    const page = Math.min(this.currentPage(), Math.max(this.totalPages(), 1));
    const start = (page - 1) * rows;
    return this.filteredEmails().slice(start, start + rows);
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
    const total = this.filteredEmails().length;
    if (total === 0) {
      return 'No emails';
    }

    const rows = this.rowsPerPage();
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * rows;
    const showing = Math.min(rows, total - start);
    return `Showing ${showing} of ${total} emails`;
  });

  constructor() {
    this.emailQueueService.ensureRealtime();
  }

  protected statusLabel(status: EmailQueueStatus): string {
    return STATUS_LABELS[status];
  }

  protected statusBadgeVariant(status: EmailQueueStatus): BadgeVariants['variant'] {
    if (status === 'SENT') {
      return 'success';
    }

    if (status === 'FAILED') {
      return 'destructive';
    }

    return 'secondary';
  }

  protected canResend(email: EmailQueueAdminListItem): boolean {
    return email.status === 'FAILED' && email.attempts >= email.maxAttempts;
  }

  protected hasErrorHistory(email: EmailQueueAdminListItem): boolean {
    return (email.lastError?.length ?? 0) > 0;
  }

  protected errorHistory(email: EmailQueueAdminListItem): readonly EmailQueueErrorEntry[] {
    return [...(email.lastError ?? [])].reverse();
  }

  protected errorDialogState(): BrnDialogState {
    return this.errorHistoryTarget() ? 'open' : 'closed';
  }

  protected openErrorHistory(email: EmailQueueAdminListItem): void {
    this.errorHistoryTarget.set(email);
  }

  protected closeErrorHistory(): void {
    this.errorHistoryTarget.set(null);
  }

  protected onErrorDialogStateChange(state: BrnDialogState): void {
    if (state === 'closed') {
      this.closeErrorHistory();
    }
  }

  protected resendDialogState(): BrnDialogState {
    return this.resendTarget() ? 'open' : 'closed';
  }

  protected confirmResend(email: EmailQueueAdminListItem): void {
    this.resendForm.reset({ [HONEYPOT_FIELD_NAME]: '' });
    this.resendTarget.set(email);
  }

  protected closeResendDialog(): void {
    this.resendTarget.set(null);
    this.resendForm.reset({ [HONEYPOT_FIELD_NAME]: '' });
  }

  protected onResendDialogStateChange(state: BrnDialogState): void {
    if (state === 'closed') {
      this.closeResendDialog();
    }
  }

  protected acceptResend(): void {
    const email = this.resendTarget();
    if (!email) {
      return;
    }

    if (isHoneypotFilled(this.resendForm.getRawValue().website)) {
      this.closeResendDialog();
      return;
    }

    if (!this.ensureAdminAction()) {
      return;
    }

    const payload = this.resendForm.getRawValue();
    this.closeResendDialog();
    this.actionError.set(null);

    this.emailQueueService
      .resendEmail(email.id, payload)
      .pipe(
        catchError((error: unknown) => {
          this.actionError.set(resolveApiErrorMessage(error, 'Unable to resend the email.'));
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
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

  private ensureAdminAction(): boolean {
    if (this.adminAccess.isAdmin()) {
      return true;
    }

    this.actionError.set(ADMIN_ACTION_DENIED);
    return false;
  }
}
