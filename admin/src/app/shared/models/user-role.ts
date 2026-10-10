export const USER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'USER'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ADMIN_ACCESS_ROLES: readonly UserRole[] = ['SUPER_ADMIN', 'ADMIN'];

export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
}

export function userRoleLabel(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'ADMIN':
      return 'Admin';
    case 'USER':
      return 'User';
    default:
      return role;
  }
}
