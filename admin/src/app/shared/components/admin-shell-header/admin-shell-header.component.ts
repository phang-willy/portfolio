import { Component, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { filter, map, startWith } from 'rxjs';
import { HlmBreadcrumbImports } from '@spartan-ng/helm/breadcrumb';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';

import { ThemeToggleComponent } from '@/app/shared/components/theme-toggle/theme-toggle.component';

interface AdminBreadcrumbItem {
  readonly label: string;
  readonly link?: string;
}

@Component({
  selector: 'app-admin-shell-header',
  imports: [HlmBreadcrumbImports, HlmButtonImports, HlmIcon, NgIcon, ThemeToggleComponent],
  templateUrl: './admin-shell-header.component.html',
  styleUrl: './admin-shell-header.component.css',
})
export class AdminShellHeaderComponent {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly sidebarOpen = input(true);
  readonly toggleSidebar = output<void>();

  protected readonly breadcrumbItems = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.buildBreadcrumbItems()),
      startWith(this.buildBreadcrumbItems()),
    ),
    { initialValue: this.buildBreadcrumbItems() },
  );

  protected sidebarToggleIcon(): string {
    return this.sidebarOpen() ? 'lucidePanelLeftClose' : 'lucideMenu';
  }

  protected sidebarToggleLabel(): string {
    return this.sidebarOpen() ? 'Close sidebar' : 'Open sidebar';
  }

  protected onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  private buildBreadcrumbItems(): AdminBreadcrumbItem[] {
    const items: AdminBreadcrumbItem[] = [{ label: 'Admin', link: '/admin/dashboard' }];
    let route: ActivatedRoute | null = this.activatedRoute.firstChild;

    while (route?.firstChild) {
      route = route.firstChild;
    }

    const breadcrumb = route?.snapshot?.data?.['breadcrumb'];
    if (typeof breadcrumb === 'string' && breadcrumb.length > 0) {
      items.push({ label: breadcrumb });
    }

    return items;
  }
}
