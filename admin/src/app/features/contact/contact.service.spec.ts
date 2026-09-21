import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthStateService } from '@/app/core/auth/auth-state.service';
import { ContactService } from '@/app/features/contact/contact.service';
import { ContactAdminDetail, ContactAdminListItem, ContactPresenceEvent } from '@/app/shared/models/contact.model';
import { User } from '@/app/shared/models/user.model';

class MockEventSource {
  static instances: MockEventSource[] = [];

  readonly url: string;
  readonly init?: EventSourceInit;
  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  private readonly listeners = new Map<string, (event: MessageEvent<string>) => void>();

  constructor(url: string, init?: EventSourceInit) {
    this.url = url;
    this.init = init;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: (event: MessageEvent<string>) => void): void {
    this.listeners.set(type, listener);
  }

  close(): void {}

  emit(type: string, data: string): void {
    this.listeners.get(type)?.({ data } as MessageEvent<string>);
  }
}

const ADMIN: User = {
  id: 'admin-id',
  firstname: 'Willy',
  lastname: 'Admin',
  email: 'admin@example.com',
  role: 'ADMIN',
};

const ITEM: ContactAdminListItem = {
  id: 'contact-id',
  firstname: 'Léa',
  lastname: 'Martin',
  email: 'lea@example.test',
  subject: 'Projet',
  status: 'RECEIVED',
  createdAt: '2026-09-21T12:00:00.000Z',
  updatedAt: '2026-09-21T12:00:00.000Z',
  firstReadAt: null,
};

const DETAIL: ContactAdminDetail = {
  ...ITEM,
  phone: null,
  company: 'Atelier',
  message: 'Bonjour',
  lastReadAt: null,
  history: [],
};

describe('ContactService', () => {
  let service: ContactService;
  let http: HttpTestingController;
  let authState: AuthStateService;

  beforeEach(() => {
    MockEventSource.instances = [];
    vi.stubGlobal('EventSource', MockEventSource);

    TestBed.configureTestingModule({
      providers: [ContactService, AuthStateService, provideHttpClient(), provideHttpClientTesting()],
    });

    authState = TestBed.inject(AuthStateService);
    service = TestBed.inject(ContactService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.unstubAllGlobals();
  });

  it('lists contacts with search and status filters', () => {
    service.getContacts({ page: 0, size: 10, search: 'Léa', status: 'RECEIVED' }).subscribe((page) => {
      expect(page.data).toEqual([ITEM]);
      expect(page.pagination.totalItems).toBe(1);
    });

    const request = http.expectOne(
      (candidate) =>
        candidate.url === '/api/admin/contact' &&
        candidate.params.get('page') === '0' &&
        candidate.params.get('size') === '10' &&
        candidate.params.get('search') === 'Léa' &&
        candidate.params.get('status') === 'RECEIVED',
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    request.flush({
      success: true,
      code: 200,
      message: 'OK',
      data: [ITEM],
      pagination: { page: 0, size: 10, totalItems: 1, totalPages: 1 },
    });
  });

  it('marks a contact as read with an empty honeypot', () => {
    service.markRead('contact-id').subscribe((contact) => {
      expect(contact.status).toBe('READ');
    });

    const request = http.expectOne('/api/admin/contact/contact-id/read');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ website: '' });
    request.flush({
      success: true,
      code: 200,
      message: 'OK',
      data: { ...DETAIL, status: 'READ', firstReadAt: ITEM.createdAt, lastReadAt: ITEM.createdAt },
    });
  });

  it('sends a reply payload', () => {
    service.reply('contact-id', { message: 'Merci', website: '' }).subscribe((contact) => {
      expect(contact.status).toBe('REPLIED');
    });

    const request = http.expectOne('/api/admin/contact/contact-id/reply');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ message: 'Merci', website: '' });
    request.flush({
      success: true,
      code: 200,
      message: 'OK',
      data: { ...DETAIL, status: 'REPLIED' },
    });
  });

  it('starts the unread stream when an admin session appears', () => {
    authState.setUser(ADMIN);

    const countRequest = http.expectOne('/api/admin/contact/unread-count');
    expect(countRequest.request.withCredentials).toBe(true);
    countRequest.flush({
      success: true,
      code: 200,
      message: 'OK',
      data: { count: 2 },
    });

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0]?.url).toBe('/api/admin/contact/stream');
    expect(MockEventSource.instances[0]?.init?.withCredentials).toBe(true);
    expect(service.unreadCount()).toBe(2);

    MockEventSource.instances[0]?.emit(
      'contact',
      JSON.stringify({ contact: ITEM, unreadCount: 3 }),
    );
    expect(service.unreadCount()).toBe(3);
  });

  it('ignores malformed realtime payloads', () => {
    authState.setUser(ADMIN);
    http.expectOne('/api/admin/contact/unread-count').flush({
      success: true,
      code: 200,
      message: 'OK',
      data: { count: 1 },
    });

    MockEventSource.instances[0]?.emit('contact', '{');
    expect(service.unreadCount()).toBe(1);
  });

  it('heartbeats presence with an empty honeypot', () => {
    const state = {
      contactId: 'contact-id',
      readOnly: false,
      occupant: null,
      viewers: [],
    };
    service.heartbeat('contact-id', 'session-id').subscribe((payload) => {
      expect(payload).toEqual(state);
    });

    const request = http.expectOne('/api/admin/contact/contact-id/presence');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ sessionId: 'session-id', website: '' });
    request.flush({ success: true, code: 200, message: 'OK', data: state });
  });

  it('leaves a presence session', () => {
    const state = {
      contactId: 'contact-id',
      readOnly: false,
      occupant: null,
      viewers: [],
    };
    service.leave('contact-id', 'session-id').subscribe((payload) => {
      expect(payload).toEqual(state);
    });

    const request = http.expectOne(
      (candidate) =>
        candidate.url === '/api/admin/contact/contact-id/presence'
        && candidate.params.get('sessionId') === 'session-id',
    );
    expect(request.request.method).toBe('DELETE');
    request.flush({ success: true, code: 200, message: 'OK', data: state });
  });

  it('forwards presence events from the stream', () => {
    const events: ContactPresenceEvent[] = [];
    const payload: ContactPresenceEvent = {
      contactId: 'contact-id',
      viewers: [{ userId: 'other-id', name: 'Léa Admin', joinedAt: '2026-09-21T21:00:00.000Z' }],
    };
    service.presence$.subscribe((event) => events.push(event));
    authState.setUser(ADMIN);
    http.expectOne('/api/admin/contact/unread-count').flush({
      success: true,
      code: 200,
      message: 'OK',
      data: { count: 1 },
    });

    MockEventSource.instances[0]?.emit('presence', JSON.stringify(payload));
    expect(events).toEqual([payload]);
  });
});
