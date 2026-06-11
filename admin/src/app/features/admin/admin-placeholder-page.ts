import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-admin-placeholder-page',
  template: `
    <section class="grid gap-2 rounded-lg border border-dashed border-surface-300 bg-surface-0 p-8 text-center shadow-sm">
      <p class="m-0 text-xs font-extrabold uppercase text-primary-700">{{ sectionLabel }}</p>
      <h1 class="m-0 text-3xl font-bold text-surface-950">{{ title }}</h1>
      <p class="m-0 text-surface-600">This section will be available soon.</p>
    </section>
  `,
})
export class AdminPlaceholderPage {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = this.route.snapshot.data['title'] ?? 'Coming soon';
  protected readonly sectionLabel = this.route.snapshot.data['section'] ?? 'Admin';
}
