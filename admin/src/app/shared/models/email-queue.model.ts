export type EmailQueueStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface EmailQueueErrorEntry {
  readonly at: string;
  readonly message: string;
}

export interface EmailQueueAdminListItem {
  readonly id: string;
  readonly recipient: string;
  readonly subject: string;
  readonly status: EmailQueueStatus;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly lastError: readonly EmailQueueErrorEntry[] | null;
  readonly scheduledAt: string;
  readonly sentAt: string | null;
  readonly createdAt: string;
}

export interface EmailQueueResendInput {
  readonly website?: string;
}

export interface EmailQueueFailedCount {
  readonly count: number;
}

export interface EmailQueueRealtimeEvent {
  readonly email: EmailQueueAdminListItem;
  readonly failedCount: number;
}

export type { PageResponse } from '@/app/shared/models/stack.model';
