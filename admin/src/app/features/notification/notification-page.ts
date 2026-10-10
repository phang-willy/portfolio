import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';

import { NotificationService } from '@/app/features/notification/notification.service';
import { AdminDatePipe } from '@/app/shared/pipes/admin-date.pipe';

@Component({
  selector: 'app-notification-page',
  imports: [AdminDatePipe, HlmButtonImports, HlmCheckboxImports],
  templateUrl: './notification-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationPage {
  private readonly notifications = inject(NotificationService);

  protected readonly items = this.notifications.notifications;
  protected readonly unreadCount = this.notifications.unreadCount;
  protected readonly isLoading = this.notifications.isLoading;
  protected readonly errorMessage = this.notifications.loadError;
  protected readonly actionError = signal<string | null>(null);
  protected readonly isMarking = signal(false);
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());

  protected readonly unreadItems = computed(() => this.items().filter((item) => !item.read));
  protected readonly readItems = computed(() => this.items().filter((item) => item.read));
  protected readonly selectedUnreadIds = computed(() =>
    this.unreadItems()
      .filter((item) => this.selectedIds().has(item.id))
      .map((item) => item.id),
  );
  protected readonly allUnreadSelected = computed(() => {
    const unread = this.unreadItems();
    return unread.length > 0 && unread.every((item) => this.selectedIds().has(item.id));
  });
  protected readonly someUnreadSelected = computed(() => {
    const selected = this.selectedUnreadIds().length;
    return selected > 0 && selected < this.unreadItems().length;
  });

  constructor() {
    this.notifications.ensureRealtime();
    this.notifications.load();
  }

  protected isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  protected toggle(id: string, checked: boolean): void {
    this.selectedIds.update((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  protected toggleAll(checked: boolean): void {
    this.selectedIds.set(checked ? new Set(this.unreadItems().map((item) => item.id)) : new Set());
  }

  protected markSelected(): void {
    this.mark(this.selectedUnreadIds());
  }

  protected markAll(): void {
    if (this.isMarking() || (this.unreadItems().length === 0 && this.unreadCount() === 0)) {
      return;
    }

    this.actionError.set(null);
    this.isMarking.set(true);
    this.notifications.markAllRead().subscribe({
      next: () => {
        this.isMarking.set(false);
        this.selectedIds.set(new Set());
        this.notifications.load();
      },
      error: () => {
        this.isMarking.set(false);
        this.actionError.set('Unable to mark every notification as read.');
      },
    });
  }

  private mark(ids: readonly string[]): void {
    if (ids.length === 0 || this.isMarking()) {
      return;
    }

    this.actionError.set(null);
    this.isMarking.set(true);
    this.notifications.markReadMany(ids).subscribe({
      next: () => {
        this.isMarking.set(false);
        this.selectedIds.update((current) => {
          const next = new Set(current);
          for (const id of ids) {
            next.delete(id);
          }
          return next;
        });
      },
      error: () => {
        this.isMarking.set(false);
        this.actionError.set('Unable to mark the selected notifications as read.');
      },
    });
  }
}
