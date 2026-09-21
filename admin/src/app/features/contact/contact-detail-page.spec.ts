import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { convertToParamMap } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminAccessService } from '@/app/core/auth/admin-access.service';
import { AuthStateService } from '@/app/core/auth/auth-state.service';
import { ContactDetailPage } from '@/app/features/contact/contact-detail-page';
import { ContactHistorySection } from '@/app/features/contact/contact-history-section';
import { presenceSessionStorageKey } from '@/app/features/contact/contact-presence';
import { CONTACT_REPLY_MAX, ContactReplySection } from '@/app/features/contact/contact-reply-section';
import { ContactService } from '@/app/features/contact/contact.service';
import { contactStatusBadge } from '@/app/features/contact/contact-status';
import { contactVisitStorageKey, hasOpenContactVisit } from '@/app/features/contact/contact-visit';
import { provideAdminIcons } from '@/app/shared/icons/admin-icons';
import { ContactAdminDetail, ContactAdminListItem, ContactPresenceEvent } from '@/app/shared/models/contact.model';

registerLocaleData(localeFr);

type ContactReplyHarness = ContactReplySection & {
  replyForm: ContactReplySection['replyForm'];
  sendReply(): void;
  remaining(): number;
  overLimit(): boolean;
};

const DETAIL: ContactAdminDetail = {
  id: 'contact-id',
  firstname: 'Léa',
  lastname: 'Martin',
  email: 'lea@example.test',
  subject: 'Création de site',
  status: 'READ',
  createdAt: '2026-09-21T12:00:00.000Z',
  updatedAt: '2026-09-21T12:05:00.000Z',
  firstReadAt: '2026-09-21T12:05:00.000Z',
  lastReadAt: '2026-09-21T12:05:00.000Z',
  phone: '+33 6 12 34 56 78',
  company: 'Atelier',
  message: 'Bonjour, parlons de mon projet.',
  history: [
    {
      id: 'contact-id',
      type: 'RECEIVED',
      createdAt: '2026-09-21T12:00:00.000Z',
      actorId: null,
      actorName: null,
      subject: 'Création de site',
      message: 'Bonjour, parlons de mon projet.',
      emailQueueId: null,
      emailStatus: null,
      sentAt: null,
    },
    {
      id: 'read-id',
      type: 'READ',
      createdAt: '2026-09-21T12:05:00.000Z',
      actorId: 'admin-id',
      actorName: 'Willy Admin',
      subject: null,
      message: null,
      emailQueueId: null,
      emailStatus: null,
      sentAt: null,
    },
  ],
};

describe('ContactDetailPage', () => {
  const ensureRealtime = vi.fn();
  const markRead = vi.fn();
  const getContact = vi.fn();
  const reply = vi.fn();
  const heartbeat = vi.fn();
  const leave = vi.fn();
  const changes$ = new Subject<ContactAdminListItem | null>();
  const presence$ = new Subject<ContactPresenceEvent>();
  const sessionEnded$ = new Subject<void>();
  const emptyPresence = {
    contactId: 'contact-id',
    readOnly: false,
    occupant: null,
    viewers: [],
  };

  beforeEach(async () => {
    sessionStorage.removeItem(contactVisitStorageKey('contact-id'));
    sessionStorage.removeItem(presenceSessionStorageKey('contact-id'));
    ensureRealtime.mockReset();
    markRead.mockReset();
    getContact.mockReset();
    reply.mockReset();
    heartbeat.mockReset();
    leave.mockReset();
    markRead.mockReturnValue(of(DETAIL));
    getContact.mockReturnValue(of(DETAIL));
    heartbeat.mockReturnValue(of(emptyPresence));
    leave.mockReturnValue(of(emptyPresence));

    await TestBed.configureTestingModule({
      imports: [ContactDetailPage],
      providers: [
        provideAdminIcons(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: 'contact-id' })) },
        },
        {
          provide: ContactService,
          useValue: {
            ensureRealtime,
            markRead,
            getContact,
            reply,
            heartbeat,
            leave,
            changes$,
            presence$,
            sessionEnded$,
          },
        },
        {
          provide: AuthStateService,
          useValue: {
            getCurrentUser: () => ({
              id: 'admin-id',
              firstname: 'Willy',
              lastname: 'Admin',
              email: 'willy@example.test',
              role: 'ADMIN',
            }),
          },
        },
        {
          provide: AdminAccessService,
          useValue: { isAdmin: () => true },
        },
      ],
    }).compileComponents();
  });

  function createHarness(): {
    fixture: ReturnType<typeof TestBed.createComponent<ContactDetailPage>>;
    reply: ContactReplyHarness;
  } {
    const fixture = TestBed.createComponent(ContactDetailPage);
    fixture.detectChanges();
    return {
      fixture,
      reply: fixture.debugElement.query(By.directive(ContactReplySection))
        .componentInstance as ContactReplyHarness,
    };
  }

  it('records the visit and shows the original enquiry', () => {
    const { fixture } = createHarness();
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    const preview =
      root.querySelector('[aria-label="Recipient email preview"]')?.textContent ?? '';

    expect(ensureRealtime).toHaveBeenCalled();
    expect(markRead).toHaveBeenCalledWith('contact-id');
    expect(text).toContain('Création de site');
    expect(text).toContain('lea@example.test');
    expect(text).toContain('Bonjour, parlons de mon projet.');
    expect(text).toContain('SUITE : Création de site');
    expect(text).toContain('Suite à votre demande de contact');
    expect(preview.indexOf('Objet')).toBeGreaterThan(-1);
    expect(preview.indexOf('Message')).toBeGreaterThan(preview.indexOf('Objet'));
    expect(preview).toContain('Bonjour, parlons de mon projet.');
    expect(contactStatusBadge('READ')).toBe('success');
    expect(contactStatusBadge('RECEIVED')).toBe('destructive');
    expect(contactStatusBadge('REPLIED')).toBe('default');
  });

  it('locks replies when another administrator already occupies the page', () => {
    heartbeat.mockReturnValue(of({
      contactId: 'contact-id',
      readOnly: true,
      occupant: { userId: 'other-id', name: 'Léa Admin', joinedAt: '2026-09-21T21:00:00.000Z' },
      viewers: [
        { userId: 'other-id', name: 'Léa Admin', joinedAt: '2026-09-21T21:00:00.000Z' },
        { userId: 'admin-id', name: 'Willy Admin', joinedAt: '2026-09-21T21:01:00.000Z' },
      ],
    }));
    const { fixture, reply: section } = createHarness();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    section.replyForm.setValue({ message: 'Merci pour votre message.', website: '' });
    section.sendReply();

    expect(text).toContain('Read-only mode');
    expect(text).toContain('Léa Admin has been on this page since');
    expect(text).toContain('Replies are disabled');
    expect(reply).not.toHaveBeenCalled();
  });

  it('asks to refresh history when another administrator joins', () => {
    const { fixture } = createHarness();
    presence$.next({
      contactId: 'contact-id',
      viewers: [
        { userId: 'admin-id', name: 'Willy Admin', joinedAt: '2026-09-21T21:00:00.000Z' },
        { userId: 'other-id', name: 'Léa Admin', joinedAt: '2026-09-21T21:05:00.000Z' },
      ],
    });
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('History updated');
    expect(text).toContain('Léa Admin has been on this page since');
  });

  it('asks to refresh history when this enquiry changes in realtime', () => {
    const { fixture } = createHarness();
    changes$.next({
      id: 'contact-id',
      firstname: 'Léa',
      lastname: 'Martin',
      email: 'lea@example.test',
      subject: 'Création de site',
      status: 'READ',
      createdAt: '2026-09-21T12:00:00.000Z',
      updatedAt: '2026-09-21T12:10:00.000Z',
      firstReadAt: '2026-09-21T12:05:00.000Z',
    });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('History updated');
  });

  it('does not record another visit after a same-tab reload', () => {
    sessionStorage.setItem(contactVisitStorageKey('contact-id'), '1');
    createHarness();

    expect(markRead).not.toHaveBeenCalled();
    expect(getContact).toHaveBeenCalledWith('contact-id');
  });

  it('clears the open visit when leaving the enquiry', async () => {
    createHarness();
    expect(hasOpenContactVisit('contact-id')).toBe(true);

    await TestBed.inject(Router).navigateByUrl('/admin/contact').catch(() => undefined);

    expect(hasOpenContactVisit('contact-id')).toBe(false);
  });

  it('does not send a reply when the honeypot is filled', () => {
    const { reply: section } = createHarness();
    section.replyForm.setValue({ message: 'Merci pour votre message.', website: 'spam' });

    section.sendReply();

    expect(reply).not.toHaveBeenCalled();
  });

  it('sends a reply when the honeypot stays empty', () => {
    reply.mockReturnValue(of({ ...DETAIL, status: 'REPLIED' }));
    const { reply: section } = createHarness();
    section.replyForm.setValue({ message: 'Merci pour votre message.', website: '' });

    section.sendReply();

    expect(reply).toHaveBeenCalledWith('contact-id', {
      message: 'Merci pour votre message.',
      website: '',
    });
  });

  it('groups history by actor and opens the detail dialog', () => {
    const { fixture } = createHarness();
    const root = fixture.nativeElement as HTMLElement;
    const history = fixture.debugElement.query(By.directive(ContactHistorySection))
      .componentInstance as ContactHistorySection & {
        actors: () => readonly { name: string }[];
        historyTarget: () => { name: string } | null;
      };

    expect(history.actors().map((actor) => actor.name)).toEqual(['Willy Admin', 'Léa Martin']);
    expect(root.querySelectorAll('[aria-label^="View history for "]')).toHaveLength(2);
    expect(history.historyTarget()).toBeNull();

    const toggle = root.querySelector('[aria-label="View history for Willy Admin"]') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();

    expect(history.historyTarget()?.name).toBe('Willy Admin');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('shows a remaining counter and blocks send when the reply is over the limit', () => {
    const { fixture, reply: section } = createHarness();
    section.replyForm.controls.message.setValue('a'.repeat(CONTACT_REPLY_MAX + 8));
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(section.remaining()).toBe(-8);
    expect(section.overLimit()).toBe(true);
    expect(root.textContent).toContain('-8');
    expect((root.querySelector('mark') as HTMLElement | null)?.textContent?.length).toBe(8);
    const textarea = root.querySelector('#contact-reply-message') as HTMLTextAreaElement;
    expect(textarea.className).toContain('field-sizing-fixed');
    expect(textarea.className).toContain('overflow-y-auto');

    section.sendReply();
    expect(reply).not.toHaveBeenCalled();
  });
});
