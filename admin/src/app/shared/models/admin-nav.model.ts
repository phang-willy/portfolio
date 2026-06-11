export interface AdminNavItem {
  readonly label: string;
  readonly icon: string;
  readonly route: string;
  readonly exact?: boolean;
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
        icon: 'pi pi-home',
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
        icon: 'pi pi-inbox',
        route: '/admin/messages',
      },
      {
        label: 'Projects',
        icon: 'pi pi-folder',
        route: '/admin/projects',
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        label: 'API status',
        icon: 'pi pi-server',
        route: '/admin/system',
      },
    ],
  },
] as const;
