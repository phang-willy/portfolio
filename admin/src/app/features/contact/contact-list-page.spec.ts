import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ContactListPage } from '@/app/features/contact/contact-list-page';
import { ContactService } from '@/app/features/contact/contact.service';
import { provideAdminIcons } from '@/app/shared/icons/admin-icons';
import { ContactAdminListItem } from '@/app/shared/models/contact.model';

registerLocaleData(localeFr);

const RECEIVED: ContactAdminListItem = {
  id: 'received-id',
  firstname: 'Léa',
  lastname: 'Martin',
  email: 'lea@example.test',
  subject: 'Création de site',
  status: 'RECEIVED',
  createdAt: '2026-09-21T12:00:00.000Z',
  updatedAt: '2026-09-21T12:00:00.000Z',
  firstReadAt: null,
};

const REPLIED: ContactAdminListItem = {
  ...RECEIVED,
  id: 'replied-id',
  subject: 'Suivi',
  status: 'REPLIED',
  firstReadAt: '2026-09-21T12:05:00.000Z',
};

describe('ContactListPage', () => {
  const ensureRealtime = vi.fn();
  const getContacts = vi.fn();
  const changes$ = new Subject<ContactAdminListItem | null>();
  const sessionEnded$ = new Subject<void>();

  beforeEach(async () => {
    ensureRealtime.mockReset();
    getContacts.mockReset();
    getContacts.mockReturnValue(
      of({
        data: [RECEIVED, REPLIED],
        pagination: { page: 0, size: 10, totalItems: 2, totalPages: 1 },
      }),
    );

    await TestBed.configureTestingModule({
      imports: [ContactListPage],
      providers: [
        provideAdminIcons(),
        provideRouter([]),
        {
          provide: ContactService,
          useValue: {
            unreadCount: signal(1),
            changes$,
            sessionEnded$,
            ensureRealtime,
            getContacts,
          },
        },
      ],
    }).compileComponents();
  });

  it('renders enquiry columns and starts realtime updates', () => {
    const fixture = TestBed.createComponent(ContactListPage);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(ensureRealtime).toHaveBeenCalled();
    expect(text).toContain('lea@example.test');
    expect(text).toContain('Léa');
    expect(text).toContain('Martin');
    expect(text).toContain('Création de site');
    expect(text).toContain('Received');
    expect(text).toContain('Replied');
    expect(getContacts).toHaveBeenCalled();
  });

  it('links each enquiry to /admin/contact/:id', () => {
    const fixture = TestBed.createComponent(ContactListPage);
    fixture.detectChanges();

    const links = [...fixture.nativeElement.querySelectorAll('a[href]')] as HTMLAnchorElement[];
    expect(links.some((link) => link.getAttribute('href') === '/admin/contact/received-id')).toBe(
      true,
    );
  });
});
