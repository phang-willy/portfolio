import type { BadgeVariants } from '@spartan-ng/helm/badge';

import { CONTACT_STATUS_LABELS, ContactHistoryType } from '@/app/shared/models/contact.model';
import { EmailQueueStatus } from '@/app/shared/models/email-queue.model';

export function contactStatusLabel(status: ContactHistoryType): string {
  if (status === 'CONFIRMATION') {
    return 'Confirmation';
  }
  return CONTACT_STATUS_LABELS[status];
}

export function contactStatusBadge(status: ContactHistoryType): BadgeVariants['variant'] {
  if (status === 'RECEIVED') {
    return 'destructive';
  }
  if (status === 'READ') {
    return 'success';
  }
  if (status === 'CONFIRMATION') {
    return 'outline';
  }
  return 'default';
}

export function contactEmailStatusLabel(status: EmailQueueStatus | null): string {
  if (status === 'SENT') {
    return 'Sent';
  }
  if (status === 'FAILED') {
    return 'Failed';
  }
  return 'Pending';
}

export function contactEmailStatusBadge(status: EmailQueueStatus | null): BadgeVariants['variant'] {
  if (status === 'SENT') {
    return 'success';
  }
  if (status === 'FAILED') {
    return 'destructive';
  }
  return 'outline';
}
