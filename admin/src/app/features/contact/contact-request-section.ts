import { Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HlmIcon } from '@spartan-ng/helm/icon';

import { ContactAdminDetail } from '@/app/shared/models/contact.model';
import { AdminDatePipe } from '@/app/shared/pipes/admin-date.pipe';

@Component({
  selector: 'app-contact-request-section',
  host: { class: 'block min-w-0' },
  imports: [AdminDatePipe, HlmIcon, NgIcon],
  templateUrl: './contact-request-section.html',
})
export class ContactRequestSection {
  readonly contact = input.required<ContactAdminDetail>();
}
