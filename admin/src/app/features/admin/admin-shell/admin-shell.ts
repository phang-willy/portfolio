import { Component, ViewEncapsulation, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import type { BrnDialogState } from '@spartan-ng/brain/dialog';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';

import { AdminShellHeaderComponent } from '@/app/shared/components/admin-shell-header/admin-shell-header.component';
import { AdminSidebarComponent } from '@/app/shared/components/admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-admin-shell',
  imports: [AdminShellHeaderComponent, AdminSidebarComponent, HlmSheetImports, RouterOutlet],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.css',
  encapsulation: ViewEncapsulation.None,
})
export class AdminShell {
  protected readonly mobileSidebarOpen = signal(false);
  protected readonly sidebarCollapsed = signal(false);

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
    this.mobileSidebarOpen.set(state === 'open');
  }

  protected sidebarIsOpen(): boolean {
    if (this.isDesktopViewport()) {
      return !this.sidebarCollapsed();
    }

    return this.mobileSidebarOpen();
  }

  protected mobileSidebarState(): BrnDialogState {
    return this.mobileSidebarOpen() ? 'open' : 'closed';
  }

  private isDesktopViewport(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
  }
}
