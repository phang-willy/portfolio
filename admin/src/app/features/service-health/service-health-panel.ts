import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSpinner } from '@spartan-ng/helm/spinner';

import { ServiceHealthService } from '@/app/features/service-health/service-health.service';
import { ServiceRestartProgress, serviceHref } from '@/app/shared/models/service-health.model';

@Component({
  selector: 'app-service-health-panel',
  imports: [HlmButtonImports, HlmSpinner],
  templateUrl: './service-health-panel.html',
  styleUrl: './service-health-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceHealthPanel {
  private readonly serviceHealth = inject(ServiceHealthService);

  protected readonly checks = this.serviceHealth.checks;
  protected readonly unavailable = this.serviceHealth.unavailable;
  protected readonly serviceHref = serviceHref;
  protected readonly restartProgress = this.serviceHealth.restartProgress;

  constructor() {
    this.serviceHealth.ensureRealtime();
  }

  protected restart(code: string): void {
    this.serviceHealth.startRestart(code);
  }

  protected restartLabel(service: string, progress: ServiceRestartProgress | undefined): string {
    if (!progress) {
      return `Restart ${service}`;
    }
    return `Restarting ${service}, attempt ${progress.attempt} of ${progress.maxAttempts}`;
  }
}
