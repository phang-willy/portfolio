import { Component } from '@angular/core';

import { ExperienceContractTypeFormComponent } from '@/app/features/experience-contract-types/experience-contract-type-form/experience-contract-type-form';

@Component({
  selector: 'app-experience-contract-type-create-page',
  host: { class: 'block' },
  imports: [ExperienceContractTypeFormComponent],
  template: `<app-experience-contract-type-form mode="create" />`,
})
export class ExperienceContractTypeCreatePage {}
