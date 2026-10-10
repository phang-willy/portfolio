import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { catchError, finalize, of } from 'rxjs';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmSpinner } from '@spartan-ng/helm/spinner';

import { AuthStateService } from '@/app/core/auth/auth-state.service';
import { AuthService } from '@/app/core/auth/auth.service';
import { ThemeToggleComponent } from '@/app/shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-header',
  imports: [AsyncPipe, HlmButtonImports, HlmIcon, HlmSpinner, NgIcon, RouterLink, ThemeToggleComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  private readonly auth = inject(AuthService);
  private readonly authState = inject(AuthStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly currentUser$ = this.authState.currentUser$;
  protected readonly isLoggingOut = signal(false);

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
