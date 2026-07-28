import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { ExperienceFormComponent } from '@/app/features/experiences/experience-form/experience-form';

@Component({
  selector: 'app-experience-edit-page',
  host: { class: 'block' },
  imports: [ExperienceFormComponent],
  template: `@if (experienceId(); as currentExperienceId) {
    <app-experience-form mode="edit" [experienceId]="currentExperienceId" />
  }`,
})
export class ExperienceEditPage {
  private readonly route = inject(ActivatedRoute);

  protected readonly experienceId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: null },
  );
}
