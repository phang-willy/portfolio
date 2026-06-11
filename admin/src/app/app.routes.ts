import { Routes } from '@angular/router';

import { authGuard, redirectAuthenticatedGuard } from '@/app/core/guards/auth.guard';
import { registerEnabledGuard } from '@/app/core/guards/register.guard';
import { adminRoleGuard } from '@/app/core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('@/app/features/auth/login/login.component').then((module) => module.LoginComponent),
    canActivate: [redirectAuthenticatedGuard],
  },
  {
    path: 'register',
    loadComponent: () =>
      import('@/app/features/auth/register/register.component').then(
        (module) => module.RegisterComponent,
      ),
    canActivate: [registerEnabledGuard, redirectAuthenticatedGuard],
  },
  {
    path: '2fa',
    loadComponent: () =>
      import('@/app/features/auth/two-factor/two-factor.component').then(
        (module) => module.TwoFactorComponent,
      ),
    canActivate: [redirectAuthenticatedGuard],
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('@/app/features/auth/forgot-password/forgot-password.component').then(
        (module) => module.ForgotPasswordComponent,
      ),
    canActivate: [redirectAuthenticatedGuard],
  },
  {
    path: 'verify',
    loadComponent: () =>
      import('@/app/features/auth/verify/verify.component').then((module) => module.VerifyComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('@/app/features/auth/reset-password/reset-password.component').then(
        (module) => module.ResetPasswordComponent,
      ),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('@/app/features/admin/admin-shell/admin-shell').then((module) => module.AdminShell),
    canActivate: [authGuard, adminRoleGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('@/app/features/admin/admin-page').then((module) => module.AdminPage),
        data: { breadcrumb: 'Dashboard' },
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('@/app/features/admin/admin-placeholder-page').then(
            (module) => module.AdminPlaceholderPage,
          ),
        data: { breadcrumb: 'Messages', title: 'Messages', section: 'Content' },
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('@/app/features/admin/admin-placeholder-page').then(
            (module) => module.AdminPlaceholderPage,
          ),
        data: { breadcrumb: 'Projects', title: 'Projects', section: 'Content' },
      },
      {
        path: 'system',
        loadComponent: () =>
          import('@/app/features/admin/admin-placeholder-page').then(
            (module) => module.AdminPlaceholderPage,
          ),
        data: { breadcrumb: 'API status', title: 'API status', section: 'System' },
      },
    ],
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('@/app/features/unauthorized/unauthorized-page').then(
        (module) => module.UnauthorizedPage,
      ),
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
