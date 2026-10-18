import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

import { environment } from '@/environments/environment';

@Injectable({ providedIn: 'root' })
export class PageTitleService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly title = inject(Title);

  init(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        map(() => this.resolveRouteTitleSegments(this.router.routerState.root)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((routeTitleSegments) => this.setTitle(routeTitleSegments));
  }

  private resolveRouteTitleSegments(route: ActivatedRoute): string[] {
    const segments: string[] = [];
    let currentRoute: ActivatedRoute | null = route;

    while (currentRoute) {
      const data = currentRoute.snapshot.data;
      const title = data['title'];

      if (typeof title === 'string' && title.length > 0) {
        segments.push(title);
      } else if (typeof data['titleFromParam'] === 'string') {
        const param = currentRoute.snapshot.paramMap.get(data['titleFromParam']);
        if (param) {
          segments.push(param);
        }
      }

      currentRoute = currentRoute.firstChild;
    }

    return segments;
  }

  private setTitle(routeTitleSegments: string[]): void {
    const appTitle = environment.appTitle.trim() || 'Portfolio';
    const segments = [appTitle, 'Admin', ...routeTitleSegments];

    this.title.setTitle(segments.join(' - '));
  }
}
