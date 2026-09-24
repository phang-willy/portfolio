import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSpinner } from '@spartan-ng/helm/spinner';

import { AuthStateService } from '@/app/core/auth/auth-state.service';
import { ContactService } from '@/app/features/contact/contact.service';
import { ServiceHealthService } from '@/app/features/service-health/service-health.service';
import { ServiceRestartProgress, serviceHref } from '@/app/shared/models/service-health.model';

@Component({
  selector: 'app-admin-page',
  imports: [AsyncPipe, HlmButtonImports, HlmSpinner, RouterLink],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPage {
  private readonly authState = inject(AuthStateService);
  private readonly contactService = inject(ContactService);
  private readonly serviceHealth = inject(ServiceHealthService);

  protected readonly currentUser$ = this.authState.currentUser$;
  protected readonly checks = this.serviceHealth.checks;
  protected readonly serviceHref = serviceHref;
  protected readonly restartProgress = this.serviceHealth.restartProgress;
  protected readonly metrics = computed(() => {
    const unread = this.contactService.unreadCount();
    const health = this.serviceHealth.summary();
    return [
      {
        label: 'Contact',
        value: String(unread),
        detail: unread === 1 ? '1 unread enquiry' : `${unread} unread enquiries`,
        tone: 'primary',
        href: '/admin/contact',
      },
      { label: 'Projects', value: '12', detail: '3 drafts', tone: 'emerald', href: undefined },
      health,
      { label: 'Deployments', value: '6', detail: '1 pending', tone: 'amber', href: undefined },
    ];
  });

  constructor() {
    this.contactService.ensureRealtime();
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
