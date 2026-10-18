import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { EMPTY, catchError } from 'rxjs';

import { resolveAuthErrorMessage } from '@/app/core/auth/auth-error-message';
import { AuthStateService } from '@/app/core/auth/auth-state.service';
import { ContactService } from '@/app/features/contact/contact.service';
import { EmailQueueService } from '@/app/features/email-queue/email-queue.service';
import { ProjectService } from '@/app/features/projects/project.service';
import { ServiceHealthPanel } from '@/app/features/service-health/service-health-panel';
import { ServiceHealthService } from '@/app/features/service-health/service-health.service';
import { SitemapService } from '@/app/features/sitemap/sitemap.service';

type DashboardTone = 'primary' | 'emerald' | 'green' | 'amber' | 'red';

interface DashboardMetric {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly tone: DashboardTone;
  readonly href?: string;
}

@Component({
  selector: 'app-admin-page',
  imports: [AsyncPipe, HlmButtonImports, HlmSpinner, RouterLink, ServiceHealthPanel],
  templateUrl: './admin-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPage {
  private readonly authState = inject(AuthStateService);
  private readonly contactService = inject(ContactService);
  private readonly emailQueue = inject(EmailQueueService);
  private readonly projectService = inject(ProjectService);
  private readonly serviceHealth = inject(ServiceHealthService);
  private readonly sitemap = inject(SitemapService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currentUser$ = this.authState.currentUser$;
  protected readonly sitemapPending = signal(false);
  private readonly projectCount = signal<number | null>(null);
  private readonly projectCountUnavailable = signal(false);

  protected readonly metrics = computed<readonly DashboardMetric[]>(() => [
    this.contactMetric(),
    this.projectMetric(),
    { ...this.serviceHealth.summary(), href: '/admin/system' },
    this.emailMetric(),
  ]);

  constructor() {
    this.contactService.ensureRealtime();
    this.serviceHealth.ensureRealtime();
    this.emailQueue.ensureRealtime();
    this.loadProjectCount();
  }

  protected generateSitemap(): void {
    if (this.sitemapPending()) {
      return;
    }
    this.sitemapPending.set(true);
    this.sitemap.generate().subscribe({
      next: (result) => {
        this.sitemapPending.set(false);
        const count = result.urlCount;
        toast.success(count === 1 ? 'Sitemap generated (1 URL).' : `Sitemap generated (${count} URLs).`);
      },
      error: (error: unknown) => {
        this.sitemapPending.set(false);
        toast.error(resolveAuthErrorMessage(error, 'Could not generate the sitemap.'));
      },
    });
  }

  private loadProjectCount(): void {
    this.projectService
      .getProjects(0, 1)
      .pipe(
        catchError(() => {
          this.projectCountUnavailable.set(true);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((page) => {
        this.projectCountUnavailable.set(false);
        this.projectCount.set(page.pagination.totalItems);
      });
  }

  private contactMetric(): DashboardMetric {
    if (this.contactService.unreadUnavailable()) {
      return {
        label: 'Contact',
        value: '—',
        detail: 'Unable to load contacts',
        tone: 'red',
        href: '/admin/contact',
      };
    }
    if (!this.contactService.unreadReady()) {
      return {
        label: 'Contact',
        value: '…',
        detail: 'Loading contacts',
        tone: 'primary',
        href: '/admin/contact',
      };
    }
    const unread = this.contactService.unreadCount();
    return {
      label: 'Contact',
      value: String(unread),
      detail: unread === 1 ? '1 unread enquiry' : `${unread} unread enquiries`,
      tone: 'primary',
      href: '/admin/contact',
    };
  }

  private projectMetric(): DashboardMetric {
    const count = this.projectCount();
    if (this.projectCountUnavailable()) {
      return {
        label: 'Projects',
        value: '—',
        detail: 'Unable to load projects',
        tone: 'red',
        href: '/admin/projects',
      };
    }
    if (count === null) {
      return {
        label: 'Projects',
        value: '…',
        detail: 'Loading projects',
        tone: 'emerald',
        href: '/admin/projects',
      };
    }
    return {
      label: 'Projects',
      value: String(count),
      detail: count === 1 ? '1 project' : `${count} projects`,
      tone: 'emerald',
      href: '/admin/projects',
    };
  }

  private emailMetric(): DashboardMetric {
    if (this.emailQueue.failedCountUnavailable()) {
      return {
        label: 'Email queue',
        value: '—',
        detail: 'Unable to load failed count',
        tone: 'red',
        href: '/admin/email-queue',
      };
    }
    if (!this.emailQueue.failedCountReady()) {
      return {
        label: 'Email queue',
        value: '…',
        detail: 'Loading failed count',
        tone: 'amber',
        href: '/admin/email-queue',
      };
    }
    const failed = this.emailQueue.failedCount();
    return {
      label: 'Email queue',
      value: String(failed),
      detail: failed === 1 ? '1 failed email' : `${failed} failed emails`,
      tone: failed > 0 ? 'amber' : 'emerald',
      href: '/admin/email-queue',
    };
  }
}
