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
        map(() => this.resolveRouteTitle(this.router.routerState.root)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((routeTitle) => this.setTitle(routeTitle));
  }

  private resolveRouteTitle(route: ActivatedRoute): string | null {
    let currentRoute: ActivatedRoute | null = route;

    while (currentRoute?.firstChild) {
      currentRoute = currentRoute.firstChild;
    }

    const title = currentRoute?.snapshot.data['title'];
    return typeof title === 'string' && title.length > 0 ? title : null;
  }

  private setTitle(routeTitle: string | null): void {
    const appTitle = environment.appTitle.trim() || 'Portfolio';
    const segments = [appTitle, 'Admin'];

    if (routeTitle) {
      segments.push(routeTitle);
    }

    this.title.setTitle(segments.join(' - '));
  }
}
