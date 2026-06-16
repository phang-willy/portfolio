import { Component } from '@angular/core';

import { ProjectFormComponent } from '@/app/features/projects/project-form/project-form';

@Component({
  selector: 'app-project-create-page',
  host: { class: 'block' },
  imports: [ProjectFormComponent],
  template: `<app-project-form mode="create" />`,
})
export class ProjectCreatePage {}
