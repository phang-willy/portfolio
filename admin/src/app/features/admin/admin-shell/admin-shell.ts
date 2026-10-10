import {
  Component,
  ViewEncapsulation,
  afterNextRender,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import type { BrnDialogState } from '@spartan-ng/brain/dialog';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';

import { AdminShellHeaderComponent } from '@/app/shared/components/admin-shell-header/admin-shell-header.component';
import { AdminSidebarComponent } from '@/app/shared/components/admin-sidebar/admin-sidebar.component';

const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

@Component({
  selector: 'app-admin-shell',
  imports: [AdminShellHeaderComponent, AdminSidebarComponent, HlmSheetImports, RouterOutlet],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.css',
  encapsulation: ViewEncapsulation.None,
})
export class AdminShell {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly mobileSidebarOpen = signal(false);
  protected readonly sidebarCollapsed = signal(false);
  protected readonly isDesktopViewport = signal(this.readDesktopViewport());

  protected readonly sidebarIsOpen = computed(() =>
    this.isDesktopViewport() ? !this.sidebarCollapsed() : this.mobileSidebarOpen(),
  );

  protected readonly mobileSidebarState = computed<BrnDialogState>(() =>
    this.mobileSidebarOpen() ? 'open' : 'closed',
  );

  constructor() {
    afterNextRender(() => {
      const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
      const syncViewport = () => {
        this.isDesktopViewport.set(mediaQuery.matches);
        if (mediaQuery.matches) {
          this.mobileSidebarOpen.set(false);
        }
      };

      syncViewport();
      mediaQuery.addEventListener('change', syncViewport);
      this.destroyRef.onDestroy(() => mediaQuery.removeEventListener('change', syncViewport));
    });
  }

  protected toggleSidebar(): void {
    if (this.isDesktopViewport()) {
      this.sidebarCollapsed.update((collapsed) => !collapsed);
      return;
    }

    this.mobileSidebarOpen.update((open) => !open);
  }

  protected closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }

  protected onMobileSidebarStateChange(state: BrnDialogState): void {
    if (this.isDesktopViewport()) {
      return;
    }

    const open = state === 'open';
    if (this.mobileSidebarOpen() === open) {
      return;
    }

    queueMicrotask(() => {
      if (!this.isDesktopViewport() && this.mobileSidebarOpen() !== open) {
        this.mobileSidebarOpen.set(open);
      }
    });
  }

  private readDesktopViewport(): boolean {
    return typeof window !== 'undefined' && window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
  }
}
