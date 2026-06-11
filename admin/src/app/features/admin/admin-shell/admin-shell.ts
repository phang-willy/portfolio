import { Component, ViewEncapsulation, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';

import { AdminShellHeaderComponent } from '@/app/shared/components/admin-shell-header/admin-shell-header.component';
import { AdminSidebarComponent } from '@/app/shared/components/admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-admin-shell',
  imports: [AdminShellHeaderComponent, AdminSidebarComponent, DrawerModule, RouterOutlet],
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

  protected onMobileSidebarVisibleChange(visible: boolean): void {
    this.mobileSidebarOpen.set(visible);
  }

  protected sidebarIsOpen(): boolean {
    if (this.isDesktopViewport()) {
      return !this.sidebarCollapsed();
    }

    return this.mobileSidebarOpen();
  }

  private isDesktopViewport(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
  }
}
