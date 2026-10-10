import { Component } from '@angular/core';

import { ExperienceFormComponent } from '@/app/features/experiences/experience-form/experience-form';

@Component({
  selector: 'app-experience-create-page',
  host: { class: 'block' },
  imports: [ExperienceFormComponent],
  template: `<app-experience-form mode="create" />`,
})
export class ExperienceCreatePage {}
