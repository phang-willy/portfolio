import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminAccessService } from '@/app/core/auth/admin-access.service';
import { EmailQueueListPage } from '@/app/features/email-queue/email-queue-list-page';
import { EmailQueueService } from '@/app/features/email-queue/email-queue.service';
import { EmailQueueAdminListItem } from '@/app/shared/models/email-queue.model';
import { provideAdminIcons } from '@/app/shared/icons/admin-icons';

registerLocaleData(localeFr);

type EmailQueueListPageHarness = EmailQueueListPage & {
  resendForm: EmailQueueListPage['resendForm'];
  acceptResend(): void;
  confirmResend(email: EmailQueueAdminListItem): void;
  resendTarget(): EmailQueueAdminListItem | null;
  canResend(email: EmailQueueAdminListItem): boolean;
  statusBadgeVariant(status: EmailQueueAdminListItem['status']): string;
  hasErrorHistory(email: EmailQueueAdminListItem): boolean;
  errorHistory(email: EmailQueueAdminListItem): readonly { at: string; message: string }[];
  openErrorHistory(email: EmailQueueAdminListItem): void;
  errorHistoryTarget(): EmailQueueAdminListItem | null;
};

const ITEM: EmailQueueAdminListItem = {
  id: 'email-id',
  recipient: 'user@example.com',
  subject: 'Verify your email',
  status: 'SENT',
  attempts: 1,
  maxAttempts: 3,
  lastError: null,
  scheduledAt: '2026-01-01T10:00:00.000Z',
  sentAt: '2026-01-01T10:01:00.000Z',
  createdAt: '2026-01-01T10:00:00.000Z',
};

const FAILED: EmailQueueAdminListItem = {
  ...ITEM,
  id: 'failed-id',
  status: 'FAILED',
  attempts: 3,
  lastError: [
    { at: '2026-01-01T10:00:00.000Z', message: 'smtp timeout' },
    { at: '2026-01-01T10:05:00.000Z', message: 'smtp down' },
  ],
  sentAt: null,
};

describe('EmailQueueListPage', () => {
  const ensureRealtime = vi.fn();
  const resendEmail = vi.fn();

  beforeEach(async () => {
    ensureRealtime.mockReset();
    resendEmail.mockReset();

    await TestBed.configureTestingModule({
      imports: [EmailQueueListPage],
      providers: [
        provideAdminIcons(),
        {
          provide: EmailQueueService,
          useValue: {
            emails: signal([ITEM, FAILED]),
            isLoading: signal(false),
            loadError: signal(null),
            failedCount: signal(1),
            ensureRealtime,
            resendEmail,
          },
        },
        {
          provide: AdminAccessService,
          useValue: { isAdmin: () => true },
        },
      ],
    }).compileComponents();
  });

  function createHarness(): EmailQueueListPageHarness {
    const fixture = TestBed.createComponent(EmailQueueListPage);
    fixture.detectChanges();
    return fixture.componentInstance as EmailQueueListPageHarness;
  }

  it('renders queue metadata without a body column', () => {
    const fixture = TestBed.createComponent(EmailQueueListPage);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('user@example.com');
    expect(text).toContain('Verify your email');
    expect(text).toContain('Sent');
    expect(text).not.toMatch(/\bBody\b/);
    expect((fixture.componentInstance as EmailQueueListPageHarness).statusBadgeVariant('SENT')).toBe(
      'success',
    );
    expect(ensureRealtime).toHaveBeenCalled();
  });

  it('shows a resend action when attempts reached the maximum', () => {
    const fixture = TestBed.createComponent(EmailQueueListPage);
    fixture.detectChanges();
    const component = fixture.componentInstance as EmailQueueListPageHarness;
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(component.canResend(FAILED)).toBe(true);
    expect(component.canResend(ITEM)).toBe(false);
    expect(text).toContain('3/3');
    expect(text).not.toContain('smtp down');
    expect(fixture.nativeElement.querySelector('[aria-label="Resend to user@example.com"]')).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[aria-label="View error history for user@example.com"]'),
    ).not.toBeNull();
  });

  it('opens a readonly error history dialog when last_error is filled', () => {
    const component = createHarness();

    expect(component.hasErrorHistory(ITEM)).toBe(false);
    expect(component.hasErrorHistory(FAILED)).toBe(true);
    expect(component.errorHistoryTarget()).toBeNull();

    component.openErrorHistory(FAILED);

    expect(component.errorHistoryTarget()).toBe(FAILED);
    expect(component.errorHistory(FAILED).map((entry) => entry.message)).toEqual([
      'smtp down',
      'smtp timeout',
    ]);
  });

  it('does not resend when the honeypot is filled', () => {
    const component = createHarness();
    component.confirmResend(FAILED);
    component.resendForm.setValue({ website: 'spam' });

    component.acceptResend();

    expect(resendEmail).not.toHaveBeenCalled();
    expect(component.resendTarget()).toBeNull();
  });

  it('resends when the honeypot stays empty', () => {
    resendEmail.mockReturnValue(of({ ...FAILED, status: 'PENDING', attempts: 0 }));
    const component = createHarness();
    component.confirmResend(FAILED);
    component.resendForm.setValue({ website: '' });

    component.acceptResend();

    expect(resendEmail).toHaveBeenCalledWith('failed-id', { website: '' });
  });
});
