import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HlmToaster } from '@spartan-ng/helm/sonner';

import { PageTitleService } from '@/app/core/title/page-title.service';
import { ThemeService } from '@/app/core/theme/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HlmToaster],
  template: `
    <router-outlet />
    <hlm-toaster position="top-center" [theme]="toasterTheme()" richColors closeButton />
  `,
})
export class App {
  private readonly pageTitle = inject(PageTitleService);
  private readonly themeService = inject(ThemeService);

  protected readonly toasterTheme = this.themeService.resolvedTheme;

  constructor() {
    this.pageTitle.init();
  }
}
