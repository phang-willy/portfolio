import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';

import { AuthStateService } from '@/app/core/auth/auth-state.service';

@Component({
  selector: 'app-admin-page',
  imports: [AsyncPipe],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.css',
})
export class AdminPage {
  private readonly authState = inject(AuthStateService);

  protected readonly currentUser$ = this.authState.currentUser$;

  protected readonly metrics = [
    { label: 'Messages', value: '18', detail: '+4 this week', tone: 'primary' },
    { label: 'Projects', value: '12', detail: '3 drafts', tone: 'emerald' },
    { label: 'API health', value: 'UP', detail: 'localhost:8000', tone: 'green' },
    { label: 'Deployments', value: '6', detail: '1 pending', tone: 'amber' },
  ];

  protected readonly checks = [
    { service: 'Angular admin', endpoint: 'localhost:3001', status: 'Ready' },
    { service: 'Spring Boot API', endpoint: 'localhost:8000', status: 'Protected' },
    { service: 'Session cookie', endpoint: '/api/auth/me', status: 'HttpOnly' },
    { service: 'Refresh flow', endpoint: '/api/auth/refresh', status: 'Cookie based' },
  ];
}
