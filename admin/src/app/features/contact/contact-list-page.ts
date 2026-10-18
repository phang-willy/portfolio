import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { EMPTY, Subject, catchError, debounceTime, startWith, switchMap, takeUntil } from 'rxjs';

import { resolveApiErrorMessage } from '@/app/core/auth/auth-error-message';
import { ContactService } from './contact.service';
import { CONTACT_STATUS_LABELS, ContactAdminListItem, ContactListQuery, ContactStatus } from '@/app/shared/models/contact.model';
import { AdminDatePipe } from '@/app/shared/pipes/admin-date.pipe';
import { contactStatusBadge } from './contact-status';

@Component({
  selector: 'app-contact-list-page',
  host: { class: 'block' },
  imports: [AdminDatePipe, FormsModule, HlmBadgeImports, HlmButtonImports, HlmIcon,
    HlmInputImports, HlmSelectImports, HlmSpinner, HlmTableImports, NgIcon, RouterLink],
  templateUrl: './contact-list-page.html',
})
export class ContactListPage {
  private readonly service = inject(ContactService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload = new Subject<void>();
  private readonly searchChanges = new Subject<void>();

  protected readonly contacts = signal<readonly ContactAdminListItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly query = signal<ContactListQuery>({ page: 0, size: 10, search: '', status: '' });
  protected readonly totalItems = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly statusLabels = CONTACT_STATUS_LABELS;
  protected readonly statusBadge = contactStatusBadge;
  protected readonly statuses: readonly ContactStatus[] = ['RECEIVED', 'READ', 'REPLIED'];
  protected readonly pageLinks = computed(() => {
    const start = Math.max(0, Math.min(this.query().page - 2, this.totalPages() - 5));
    return Array.from({ length: Math.min(5, this.totalPages()) }, (_, i) => start + i);
  });
  protected readonly pageReport = computed(() => this.totalItems() === 0 ? 'No contacts' :
    `Showing ${this.query().page * this.query().size + 1}–${this.query().page * this.query().size + this.contacts().length} of ${this.totalItems()} contacts`);

  constructor() {
    this.service.ensureRealtime();
    this.reload.pipe(
      startWith(undefined),
      switchMap(() => {
        this.isLoading.set(true);
        this.errorMessage.set(null);
        return this.service.getContacts(this.query()).pipe(catchError((error: unknown) => {
          this.isLoading.set(false);
          this.errorMessage.set(resolveApiErrorMessage(error, 'Unable to load contacts.'));
          return EMPTY;
        }));
      }),
      takeUntil(this.service.sessionEnded$),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ data, pagination }) => {
      this.contacts.set(data);
      this.totalItems.set(pagination.totalItems);
      this.totalPages.set(pagination.totalPages);
      this.isLoading.set(false);
      if (pagination.totalPages > 0 && this.query().page >= pagination.totalPages) {
        this.changePage(pagination.totalPages - 1);
      }
    });
    this.searchChanges.pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refresh());
    this.service.changes$.pipe(debounceTime(100), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refresh());
    this.service.sessionEnded$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.contacts.set([]);
      this.totalItems.set(0);
      this.totalPages.set(0);
      this.errorMessage.set(null);
      this.isLoading.set(false);
    });
  }

  protected refresh(): void { this.reload.next(); }

  protected onSearch(event: Event): void {
    this.query.update((query) => ({ ...query, search: (event.target as HTMLInputElement).value, page: 0 }));
    this.searchChanges.next();
  }

  protected onStatusChange(status: ContactStatus | ''): void {
    this.query.update((query) => ({ ...query, status, page: 0 }));
    this.refresh();
  }

  protected onRowsChange(size: number): void {
    this.query.update((query) => ({ ...query, size, page: 0 }));
    this.refresh();
  }

  protected changePage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.query.update((query) => ({ ...query, page }));
    this.refresh();
  }
}
