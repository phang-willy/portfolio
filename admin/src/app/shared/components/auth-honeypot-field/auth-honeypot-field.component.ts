import { Component } from '@angular/core';
import { ControlContainer, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';

import { HONEYPOT_FIELD_NAME } from '@/app/shared/utils/honeypot';

@Component({
  selector: 'app-auth-honeypot-field',
  imports: [ReactiveFormsModule],
  templateUrl: './auth-honeypot-field.component.html',
  styleUrl: './auth-honeypot-field.component.css',
  viewProviders: [
    {
      provide: ControlContainer,
      useExisting: FormGroupDirective,
    },
  ],
})
export class AuthHoneypotFieldComponent {
  protected readonly fieldName = HONEYPOT_FIELD_NAME;
  protected readonly fieldId = `auth-${HONEYPOT_FIELD_NAME}-${crypto.randomUUID()}`;
}
