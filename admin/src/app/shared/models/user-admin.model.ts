import { UserRole } from '@/app/shared/models/user-role';

export interface UserAdminListItem {
  id: string;
  email: string;
  role: UserRole;
  lastname: string;
  firstname: string;
  createdAt: string;
  updatedAt: string;
  deactivatedAt: string | null;
}

export type UserHistoryType =
  | 'LOGIN'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_CHANGED'
  | 'EMAIL_CHANGED'
  | 'ROLE_CHANGED'
  | 'ACCOUNT_ACTIVATED'
  | 'ACCOUNT_DEACTIVATED'
  | 'PROFILE_UPDATED';

export interface UserHistoryEntry {
  id: string;
  type: UserHistoryType;
  actorId: string | null;
  actorName: string | null;
  detail: string | null;
  createdAt: string;
}

export interface UserAdminDetail extends UserAdminListItem {
  verifiedAt: string | null;
  manageable: boolean;
  assignableRoles: readonly UserRole[];
  history: readonly UserHistoryEntry[];
}

export interface UserAdminUpdateInput {
  lastname: string;
  firstname: string;
  email: string;
  role: UserRole;
  active: boolean;
  confirmEmailChange: boolean;
  website?: string;
}

export interface EmailAvailability {
  available: boolean;
}

export interface UserPage<T> {
  readonly data: readonly T[];
  readonly pagination: {
    readonly page: number;
    readonly size: number;
    readonly totalItems: number;
    readonly totalPages: number;
  };
}
