import { NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { EMPTY, catchError, finalize } from 'rxjs';
import { HlmBadgeImports, type BadgeVariants } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';

import { UserAdminService } from '@/app/features/users/user-admin.service';
import { resolveAuthErrorMessage } from '@/app/core/auth/auth-error-message';
import { UserAdminListItem } from '@/app/shared/models/user-admin.model';
import { UserRole, userRoleLabel } from '@/app/shared/models/user-role';
import { AdminDatePipe } from '@/app/shared/pipes/admin-date.pipe';

type SortField =
  | 'email'
  | 'role'
  | 'lastname'
  | 'firstname'
  | 'createdAt'
  | 'updatedAt'
  | 'deactivatedAt';
type SortDirection = 'asc' | 'desc';

const TABLE_ROWS = 10;
const TABLE_ROWS_OPTIONS = [10, 25, 50];
const TABLE_PAGE_LINKS = 5;
const ROLE_RANK: Record<UserRole, number> = {
  USER: 0,
  ADMIN: 1,
  SUPER_ADMIN: 2,
};

@Component({
  selector: 'app-user-list-page',
  host: { class: 'block' },
  imports: [
    AdminDatePipe,
    FormsModule,
    HlmBadgeImports,
    HlmButtonImports,
    HlmIcon,
    HlmInputImports,
    HlmSelectImports,
    HlmSpinner,
    HlmTableImports,
    HlmTooltipImports,
    NgIcon,
    NgTemplateOutlet,
    RouterLink,
  ],
  templateUrl: './user-list-page.html',
})
export class UserListPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly userAdminService = inject(UserAdminService);

  protected readonly users = signal<readonly UserAdminListItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly globalFilterValue = signal('');
  protected readonly rowsPerPage = signal(TABLE_ROWS);
  protected readonly currentPage = signal(1);
  protected readonly sortField = signal<SortField>('createdAt');
  protected readonly sortDirection = signal<SortDirection>('desc');
  protected readonly tableRowsOptions = TABLE_ROWS_OPTIONS;
  protected readonly roleLabel = userRoleLabel;

  protected readonly filteredUsers = computed(() => {
    const query = this.globalFilterValue().trim().toLowerCase();
    let items = [...this.users()];

    if (query) {
      items = items.filter((user) => {
        const haystack = [
          user.email,
          user.role,
          userRoleLabel(user.role),
          user.lastname,
          user.firstname,
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    const field = this.sortField();
    const direction = this.sortDirection();
    items.sort((left, right) => {
      const comparison =
        field === 'role'
          ? ROLE_RANK[left.role] - ROLE_RANK[right.role]
          : String(left[field] ?? '').localeCompare(String(right[field] ?? ''));
      return direction === 'asc' ? comparison : -comparison;
    });

    return items;
  });

  protected readonly totalPages = computed(() => {
    const total = this.filteredUsers().length;
    return total === 0 ? 0 : Math.ceil(total / this.rowsPerPage());
  });

  protected readonly paginatedUsers = computed(() => {
    const rows = this.rowsPerPage();
    const page = Math.min(this.currentPage(), Math.max(this.totalPages(), 1));
    const start = (page - 1) * rows;
    return this.filteredUsers().slice(start, start + rows);
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
    const total = this.filteredUsers().length;
    if (total === 0) {
      return 'No users';
    }

    const rows = this.rowsPerPage();
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * rows;
    const showing = Math.min(rows, total - start);
    return `Showing ${showing} of ${total} users`;
  });

  constructor() {
    this.loadUsers();
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

  protected onGlobalFilter(event: Event): void {
    this.globalFilterValue.set((event.target as HTMLInputElement).value);
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

  private loadUsers(): void {
    this.isLoading.set(true);
    this.userAdminService
      .getUsers()
      .pipe(
        catchError((error: unknown) => {
          this.errorMessage.set(resolveAuthErrorMessage(error, 'Unable to load users.'));
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.users.set(response.data);
        this.currentPage.set(1);
      });
  }
}
