import { PaginatedApiResponse } from './api-response.model';
import { EmailQueueStatus } from './email-queue.model';

export type ContactStatus = 'RECEIVED' | 'READ' | 'REPLIED';

export interface ContactAdminListItem {
  readonly id: string;
  readonly firstname: string;
  readonly lastname: string;
  readonly email: string;
  readonly subject: string;
  readonly status: ContactStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly firstReadAt: string | null;
}

export interface ContactHistoryEntry {
  readonly id: string;
  readonly type: ContactStatus;
  readonly createdAt: string;
  readonly actorId: string | null;
  readonly actorName: string | null;
  readonly subject: string | null;
  readonly message: string | null;
  readonly emailQueueId: string | null;
  readonly emailStatus: EmailQueueStatus | null;
  readonly sentAt: string | null;
}

export interface ContactAdminDetail extends ContactAdminListItem {
  readonly phone: string | null;
  readonly company: string | null;
  readonly message: string;
  readonly lastReadAt: string | null;
  readonly history: readonly ContactHistoryEntry[];
}

export interface ContactListQuery {
  readonly page: number;
  readonly size: number;
  readonly search: string;
  readonly status: ContactStatus | '';
}

export interface ContactReplyInput {
  readonly message: string;
  readonly website?: string;
}

export type ContactPage = Pick<PaginatedApiResponse<ContactAdminListItem>, 'data' | 'pagination'>;

export interface ContactRealtimeEvent {
  readonly contact: ContactAdminListItem | null;
  readonly unreadCount: number;
}

export interface ContactPresenceViewer {
  readonly userId: string;
  readonly name: string;
  readonly joinedAt: string;
}

export interface ContactPresenceState {
  readonly contactId: string;
  readonly readOnly: boolean;
  readonly occupant: ContactPresenceViewer | null;
  readonly viewers: readonly ContactPresenceViewer[];
}

export interface ContactPresenceEvent {
  readonly contactId: string;
  readonly viewers: readonly ContactPresenceViewer[];
}

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  RECEIVED: 'Received',
  READ: 'Read',
  REPLIED: 'Replied',
};
