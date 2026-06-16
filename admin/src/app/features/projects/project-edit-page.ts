import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { ProjectFormComponent } from '@/app/features/projects/project-form/project-form';

@Component({
  selector: 'app-project-edit-page',
  host: { class: 'block' },
  imports: [ProjectFormComponent],
  template: `@if (projectId(); as currentProjectId) {
    <app-project-form mode="edit" [projectId]="currentProjectId" />
  }`,
})
export class ProjectEditPage {
  private readonly route = inject(ActivatedRoute);

  protected readonly projectId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: null },
  );
}
