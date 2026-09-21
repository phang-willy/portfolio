import { AsyncPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthStateService } from '@/app/core/auth/auth-state.service';
import { ContactService } from '@/app/features/contact/contact.service';

@Component({
  selector: 'app-admin-page',
  imports: [AsyncPipe, RouterLink],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.css',
})
export class AdminPage {
  private readonly authState = inject(AuthStateService);
  private readonly contactService = inject(ContactService);

  protected readonly currentUser$ = this.authState.currentUser$;
  protected readonly metrics = computed(() => {
    const unread = this.contactService.unreadCount();
    return [
      {
        label: 'Contact',
        value: String(unread),
        detail: unread === 1 ? '1 unread enquiry' : `${unread} unread enquiries`,
        tone: 'primary',
        href: '/admin/contact',
      },
      { label: 'Projects', value: '12', detail: '3 drafts', tone: 'emerald' },
      { label: 'API health', value: 'UP', detail: 'localhost:8000', tone: 'green' },
      { label: 'Deployments', value: '6', detail: '1 pending', tone: 'amber' },
    ];
  });

  constructor() {
    this.contactService.ensureRealtime();
  }

  protected readonly checks = [
    { service: 'Angular admin', endpoint: 'localhost:3001', status: 'Ready' },
    { service: 'Spring Boot API', endpoint: 'localhost:8000', status: 'Protected' },
    { service: 'Session cookie', endpoint: '/api/auth/me', status: 'HttpOnly' },
    { service: 'Refresh flow', endpoint: '/api/auth/refresh', status: 'Cookie based' },
  ];
}
