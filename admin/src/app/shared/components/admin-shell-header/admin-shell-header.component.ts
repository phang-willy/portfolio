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
  readonly id: string;
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
    const items: AdminBreadcrumbItem[] = [
      { id: 'admin', label: 'Admin', link: '/admin/dashboard' },
    ];
    const crumbs: AdminBreadcrumbItem[] = [];
    let route: ActivatedRoute | null = this.router.routerState.root;

    while (route?.firstChild) {
      route = route.firstChild;
      const data = route.routeConfig?.data;
      if (!data) {
        continue;
      }

      const breadcrumb = data['breadcrumb'];
      const breadcrumbLink = data['breadcrumbLink'];

      if (typeof breadcrumb === 'string' && breadcrumb.length > 0) {
        crumbs.push({
          id: route.snapshot?.url.map((segment) => segment.path).join('/') || breadcrumb,
          label: breadcrumb,
          link: typeof breadcrumbLink === 'string' ? breadcrumbLink : undefined,
        });
      }
    }

    crumbs.forEach((crumb, index) => {
      const isLast = index === crumbs.length - 1;

      items.push({
        id: crumb.id,
        label: crumb.label,
        link: isLast ? undefined : crumb.link,
      });
    });

    return items;
  }
}
