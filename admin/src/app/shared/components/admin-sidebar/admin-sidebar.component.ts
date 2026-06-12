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
import { ADMIN_NAV_SECTIONS } from '@/app/shared/models/admin-nav.model';

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
  private readonly router = inject(Router);

  readonly compact = input(false);
  readonly showCloseButton = input(false);
  readonly navigated = output<void>();
  readonly closed = output<void>();

  protected readonly navSections = ADMIN_NAV_SECTIONS;
  protected readonly currentUser$ = this.authState.currentUser$;
  protected readonly isLoggingOut = signal(false);

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
