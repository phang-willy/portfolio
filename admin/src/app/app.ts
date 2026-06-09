import { Component, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-root',
  imports: [ButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly adminName = signal('Portfolio Admin');

  protected readonly metrics = [
    { label: 'Messages', value: '18', trend: '+4 this week', tone: 'blue' },
    { label: 'Projects', value: '12', trend: '3 drafts', tone: 'emerald' },
    { label: 'API health', value: 'UP', trend: 'port 8000', tone: 'green' },
    { label: 'Deployments', value: '6', trend: '1 pending', tone: 'amber' }
  ];

  protected readonly checks = [
    { service: 'Front Next.js', endpoint: 'localhost:3000', status: 'Running' },
    { service: 'Admin Angular', endpoint: 'localhost:3001', status: 'Ready' },
    { service: 'Spring Boot API', endpoint: 'localhost:8000', status: 'Healthy' },
    { service: 'PostgreSQL', endpoint: 'localhost:5432', status: 'Connected' }
  ];

  protected readonly queue = [
    { title: 'Review contact requests', detail: '6 unread messages' },
    { title: 'Update project data', detail: '3 drafts need content' },
    { title: 'Check uptime probes', detail: 'Actuator readiness moved to 8000' }
  ];
}
