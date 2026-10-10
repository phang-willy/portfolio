import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { catchError, finalize, of } from 'rxjs';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmSpinner } from '@spartan-ng/helm/spinner';

import { AuthService } from '@/app/core/auth/auth.service';

@Component({
  selector: 'app-profile-menu',
  imports: [HlmIcon, HlmSpinner, NgIcon, RouterLink, RouterLinkActive],
  templateUrl: './profile-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative block',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeMenu()',
  },
})
export class ProfileMenuComponent {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);

  protected readonly isOpen = signal(false);
  protected readonly isLoggingOut = signal(false);

  protected toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen.update((isOpen) => !isOpen);
  }

  protected closeMenu(): void {
    this.isOpen.set(false);
  }

  protected logout(event: MouseEvent): void {
    event.stopPropagation();
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
          this.closeMenu();
          void this.router.navigateByUrl('/login');
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Node && !this.elementRef.nativeElement.contains(target)) {
      this.closeMenu();
    }
  }
}
