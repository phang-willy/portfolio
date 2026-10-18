import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

registerLocaleData(localeFr);

import { NotificationPage } from '@/app/features/notification/notification-page';
import { NotificationService } from '@/app/features/notification/notification.service';
import { AdminNotification } from '@/app/shared/models/notification.model';

type NotificationPageHarness = NotificationPage & {
  showMoreRead(): void;
};

function notification(index: number, read: boolean): AdminNotification {
  return {
    id: `notification-${index}`,
    serviceCode: 'front',
    title: `Alert ${index}`,
    message: `Message ${index}`,
    createdAt: `2026-09-${String(index).padStart(2, '0')}T12:00:00Z`,
    read,
  };
}

describe('NotificationPage read list', () => {
  const notifications = signal<readonly AdminNotification[]>([]);
  const nextReadCount = signal(0);
  const isLoadingMore = signal(false);
  const loadMore = vi.fn();

  beforeEach(async () => {
    notifications.set([]);
    nextReadCount.set(0);
    isLoadingMore.set(false);
    loadMore.mockReset();

    await TestBed.configureTestingModule({
      imports: [NotificationPage],
      providers: [
        {
          provide: NotificationService,
          useValue: {
            notifications,
            unreadCount: signal(0),
            isLoading: signal(false),
            isLoadingMore,
            loadError: signal<string | null>(null),
            nextReadCount,
            ensureRealtime: vi.fn(),
            load: vi.fn(),
            loadMore,
            markAllRead: vi.fn(),
            markReadMany: vi.fn(),
          },
        },
      ],
    }).compileComponents();
  });

  function createHarness(): { component: NotificationPageHarness; text: () => string } {
    const fixture = TestBed.createComponent(NotificationPage);
    fixture.detectChanges();
    return {
      component: fixture.componentInstance as NotificationPageHarness,
      text: () => {
        fixture.detectChanges();
        return fixture.nativeElement.textContent as string;
      },
    };
  }

  it('shows the loaded read notifications and asks for the next page', () => {
    notifications.set([
      notification(1, false),
      ...Array.from({ length: 10 }, (_, index) => notification(index + 2, true)),
    ]);
    nextReadCount.set(10);
    const { component, text } = createHarness();

    expect(text()).toContain('Alert 11');
    expect(text()).toContain('Show next 10');
    expect(text()).not.toContain('Alert 12');

    component.showMoreRead();
    expect(loadMore).toHaveBeenCalledOnce();

    notifications.update((items) => [...items, notification(12, true), notification(13, true)]);
    nextReadCount.set(0);

    expect(text()).toContain('Alert 13');
    expect(text()).not.toContain('Show next');
  });
});
