import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

import { ADMIN_DATE_TIME_FORMAT } from '@/app/shared/constants/admin-date-format';

@Pipe({
  name: 'adminDate',
})
export class AdminDatePipe implements PipeTransform {
  private readonly datePipe = new DatePipe('fr-FR');

  transform(value: Date | string | number | null | undefined): string | null {
    if (value == null || value === '') {
      return null;
    }

    return this.datePipe.transform(value, ADMIN_DATE_TIME_FORMAT);
  }
}
