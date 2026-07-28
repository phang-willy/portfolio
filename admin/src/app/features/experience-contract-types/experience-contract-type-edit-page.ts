import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { ExperienceContractTypeFormComponent } from '@/app/features/experience-contract-types/experience-contract-type-form/experience-contract-type-form';

@Component({
  selector: 'app-experience-contract-type-edit-page',
  host: { class: 'block' },
  imports: [ExperienceContractTypeFormComponent],
  template: `@if (contractTypeId(); as currentId) {
    <app-experience-contract-type-form mode="edit" [contractTypeId]="currentId" />
  }`,
})
export class ExperienceContractTypeEditPage {
  private readonly route = inject(ActivatedRoute);

  protected readonly contractTypeId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: null },
  );
}
