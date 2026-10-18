import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmIcon } from '@spartan-ng/helm/icon';

import { NotificationService } from '@/app/features/notification/notification.service';
import { notificationBadgeLabel } from '@/app/shared/components/notification-bell/notification-badge';

@Component({
  selector: 'app-notification-bell',
  imports: [HlmIcon, NgIcon, RouterLink, RouterLinkActive],
  templateUrl: './notification-bell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative block',
  },
})
export class NotificationBellComponent {
  private readonly notifications = inject(NotificationService);

  protected readonly unreadCount = this.notifications.unreadCount;

  constructor() {
    this.notifications.ensureRealtime();
  }

  protected badgeLabel(): string | null {
    return notificationBadgeLabel(this.unreadCount());
  }

  protected ariaLabel(): string {
    const count = this.unreadCount();
    if (count <= 0) {
      return 'Notifications';
    }
    if (count === 1) {
      return 'Notifications, 1 unread';
    }
    return `Notifications, ${count} unread`;
  }
}
