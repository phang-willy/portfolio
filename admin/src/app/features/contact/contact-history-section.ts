import { Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import type { BrnDialogState } from '@spartan-ng/brain/dialog';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmIcon } from '@spartan-ng/helm/icon';

import { ContactAdminDetail, ContactHistoryEntry } from '@/app/shared/models/contact.model';
import { AdminDatePipe } from '@/app/shared/pipes/admin-date.pipe';
import {
  contactEmailStatusBadge,
  contactEmailStatusLabel,
  contactStatusBadge,
  contactStatusLabel,
} from './contact-status';

export interface ContactHistoryActor {
  readonly key: string;
  readonly name: string;
  readonly detail: string | null;
  readonly latest: ContactHistoryEntry;
  readonly events: readonly ContactHistoryEntry[];
}

@Component({
  selector: 'app-contact-history-section',
  host: { class: 'block min-w-0' },
  imports: [
    AdminDatePipe, HlmBadgeImports, HlmButtonImports, HlmDialogImports, HlmIcon, NgIcon, RouterLink,
  ],
  templateUrl: './contact-history-section.html',
})
export class ContactHistorySection {
  readonly contact = input.required<ContactAdminDetail>();
  readonly refresh = output<void>();

  protected readonly historyTarget = signal<ContactHistoryActor | null>(null);

  protected readonly actors = computed(() => groupHistoryByActor(this.contact()));

  protected statusLabel = contactStatusLabel;
  protected statusBadge = contactStatusBadge;
  protected emailStatusLabel = contactEmailStatusLabel;
  protected emailStatusBadge = contactEmailStatusBadge;

  protected dialogState(): BrnDialogState {
    return this.historyTarget() ? 'open' : 'closed';
  }

  protected openHistory(actor: ContactHistoryActor): void {
    this.historyTarget.set(actor);
  }

  protected closeHistory(): void {
    this.historyTarget.set(null);
  }

  protected onDialogStateChange(state: BrnDialogState): void {
    if (state === 'closed') {
      this.closeHistory();
    }
  }
}

function groupHistoryByActor(contact: ContactAdminDetail): readonly ContactHistoryActor[] {
  const groups = new Map<string, ContactHistoryEntry[]>();
  const order: string[] = [];

  for (const event of [...contact.history].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const key = event.actorId ?? event.actorName ?? `visitor:${contact.email}`;
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(event);
    } else {
      groups.set(key, [event]);
      order.push(key);
    }
  }

  return order
    .map((key) => {
      const events = groups.get(key) ?? [];
      const latest = events[events.length - 1];
      const isVisitor = !latest.actorId && !latest.actorName;
      return {
        key,
        name: isVisitor ? `${contact.firstname} ${contact.lastname}`.trim() : (latest.actorName ?? 'Unknown'),
        detail: isVisitor ? contact.email : null,
        latest,
        events: [...events].reverse(),
      };
    })
    .sort((a, b) => b.latest.createdAt.localeCompare(a.latest.createdAt));
}
