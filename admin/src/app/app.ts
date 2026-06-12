import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { PageTitleService } from '@/app/core/title/page-title.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  private readonly pageTitle = inject(PageTitleService);

  constructor() {
    this.pageTitle.init();
  }
}
