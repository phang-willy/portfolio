import type { BadgeVariants } from '@spartan-ng/helm/badge';

import { CONTACT_STATUS_LABELS, ContactStatus } from '@/app/shared/models/contact.model';
import { EmailQueueStatus } from '@/app/shared/models/email-queue.model';

export function contactStatusLabel(status: ContactStatus): string {
  return CONTACT_STATUS_LABELS[status];
}

export function contactStatusBadge(status: ContactStatus): BadgeVariants['variant'] {
  if (status === 'RECEIVED') {
    return 'destructive';
  }
  if (status === 'READ') {
    return 'success';
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
