export type AdminNavBadge = 'email-queue-failed';

export interface AdminNavItem {
  readonly label: string;
  readonly icon: string;
  readonly route: string;
  readonly exact?: boolean;
  readonly badge?: AdminNavBadge;
}

export interface AdminNavSection {
  readonly label: string;
  readonly items: readonly AdminNavItem[];
}

export const ADMIN_NAV_SECTIONS: readonly AdminNavSection[] = [
  {
    label: 'Platform',
    items: [
      {
        label: 'Dashboard',
        icon: 'lucideHouse',
        route: '/admin/dashboard',
        exact: true,
      },
    ],
  },
  {
    label: 'Content',
    items: [
      {
        label: 'Messages',
        icon: 'lucideInbox',
        route: '/admin/messages',
      },
      {
        label: 'Projects',
        icon: 'lucideFolder',
        route: '/admin/projects',
      },
      {
        label: 'Stacks',
        icon: 'lucideCode',
        route: '/admin/stacks',
      },
      {
        label: 'Experiences',
        icon: 'lucideBriefcase',
        route: '/admin/experiences',
      },
      {
        label: 'Contract types',
        icon: 'lucideBadgeCheck',
        route: '/admin/experience-contract-types',
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        label: 'API status',
        icon: 'lucideServer',
        route: '/admin/system',
      },
      {
        label: 'Email queue',
        icon: 'lucideMail',
        route: '/admin/email-queue',
        badge: 'email-queue-failed',
      },
    ],
  },
] as const;
