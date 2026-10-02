import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ServiceHealthPanel } from '@/app/features/service-health/service-health-panel';

@Component({
  selector: 'app-system-page',
  imports: [ServiceHealthPanel],
  templateUrl: './system-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemPage {}
