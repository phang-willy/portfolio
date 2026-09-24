import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { catchError, finalize, of } from 'rxjs';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmSpinner } from '@spartan-ng/helm/spinner';

import { AuthStateService } from '@/app/core/auth/auth-state.service';
import { AuthService } from '@/app/core/auth/auth.service';
import { EmailQueueService } from '@/app/features/email-queue/email-queue.service';
import { ContactService } from '@/app/features/contact/contact.service';
import { NotificationService } from '@/app/features/notification/notification.service';
import { ServiceHealthService } from '@/app/features/service-health/service-health.service';
import { ADMIN_NAV_SECTIONS, AdminNavItem } from '@/app/shared/models/admin-nav.model';

@Component({
  selector: 'app-admin-sidebar',
  imports: [
    AsyncPipe,
    HlmAvatarImports,
    HlmButtonImports,
    HlmIcon,
    HlmSpinner,
    NgIcon,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css',
})
export class AdminSidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly authState = inject(AuthStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly emailQueueService = inject(EmailQueueService);
  private readonly contactService = inject(ContactService);
  private readonly notificationService = inject(NotificationService);
  private readonly serviceHealth = inject(ServiceHealthService);
  private readonly router = inject(Router);

  readonly compact = input(false);
  readonly showCloseButton = input(false);
  readonly navigated = output<void>();
  readonly closed = output<void>();

  protected readonly navSections = ADMIN_NAV_SECTIONS;
  protected readonly currentUser$ = this.authState.currentUser$;
  protected readonly isLoggingOut = signal(false);
  protected readonly failedEmailCount = this.emailQueueService.failedCount;
  protected readonly unreadContactCount = this.contactService.unreadCount;

  constructor() {
    this.emailQueueService.ensureRealtime();
    this.contactService.ensureRealtime();
    this.notificationService.ensureRealtime();
    this.serviceHealth.ensureRealtime();
  }

  protected navItemAriaLabel(item: AdminNavItem): string | null {
    if (item.badge === 'contact-unread') {
      return `${item.label}, ${this.unreadContactCount()} unread`;
    }
    if (item.badge !== 'email-queue-failed') {
      return this.compact() ? item.label : null;
    }

    return `${item.label}, ${this.failedEmailCount()} failed`;
  }

  protected userInitials(firstname: string, lastname: string): string {
    const first = firstname.trim().charAt(0);
    const last = lastname.trim().charAt(0);
    return `${first}${last}`.toUpperCase() || 'A';
  }

  protected onNavigate(): void {
    this.navigated.emit();
  }

  protected onClose(): void {
    this.closed.emit();
  }

  protected logout(): void {
    if (this.isLoggingOut()) {
      return;
    }

    this.isLoggingOut.set(true);

    this.auth
      .logout()
      .pipe(
        catchError(() => of(void 0)),
        finalize(() => {
          this.auth.clearSession();
          this.isLoggingOut.set(false);
          void this.router.navigateByUrl('/login');
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
