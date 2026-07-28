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
    data: { title: 'Login' },
  },
  {
    path: 'register',
    loadComponent: () =>
      import('@/app/features/auth/register/register.component').then(
        (module) => module.RegisterComponent,
      ),
    canActivate: [registerEnabledGuard, redirectAuthenticatedGuard],
    data: { title: 'Register' },
  },
  {
    path: '2fa',
    loadComponent: () =>
      import('@/app/features/auth/two-factor/two-factor.component').then(
        (module) => module.TwoFactorComponent,
      ),
    canActivate: [redirectAuthenticatedGuard],
    data: { title: 'Two-factor authentication' },
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('@/app/features/auth/forgot-password/forgot-password.component').then(
        (module) => module.ForgotPasswordComponent,
      ),
    canActivate: [redirectAuthenticatedGuard],
    data: { title: 'Forgot password' },
  },
  {
    path: 'verify',
    loadComponent: () =>
      import('@/app/features/auth/verify/verify.component').then((module) => module.VerifyComponent),
    data: { title: 'Verify email' },
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('@/app/features/auth/reset-password/reset-password.component').then(
        (module) => module.ResetPasswordComponent,
      ),
    data: { title: 'Reset password' },
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
        data: { breadcrumb: 'Dashboard', title: 'Dashboard' },
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
        path: 'stacks',
        loadComponent: () =>
          import('@/app/features/stacks/stacks-page').then((module) => module.StacksPage),
        data: { breadcrumb: 'Stacks', title: 'Stacks', section: 'Content' },
      },
      {
        path: 'projects',
        data: {
          breadcrumb: 'Project',
          breadcrumbLink: '/admin/projects',
          section: 'Content',
          title: 'Project',
        },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('@/app/features/projects/projects-list-page').then(
                (module) => module.ProjectsListPage,
              ),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('@/app/features/projects/project-create-page').then(
                (module) => module.ProjectCreatePage,
              ),
            data: { breadcrumb: 'Create', title: 'Create' },
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('@/app/features/projects/project-edit-page').then(
                (module) => module.ProjectEditPage,
              ),
            data: { breadcrumb: 'Edit', titleFromParam: 'id' },
          },
        ],
      },
      {
        path: 'experiences',
        data: {
          breadcrumb: 'Experience',
          breadcrumbLink: '/admin/experiences',
          section: 'Content',
          title: 'Experience',
        },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('@/app/features/experiences/experiences-list-page').then(
                (module) => module.ExperiencesListPage,
              ),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('@/app/features/experiences/experience-create-page').then(
                (module) => module.ExperienceCreatePage,
              ),
            data: { breadcrumb: 'Create', title: 'Create' },
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('@/app/features/experiences/experience-edit-page').then(
                (module) => module.ExperienceEditPage,
              ),
            data: { breadcrumb: 'Edit', titleFromParam: 'id' },
          },
        ],
      },
      {
        path: 'experience-contract-types',
        data: {
          breadcrumb: 'Contract type',
          breadcrumbLink: '/admin/experience-contract-types',
          section: 'Content',
          title: 'Contract type',
        },
        children: [
          {
            path: '',
            loadComponent: () =>
              import(
                '@/app/features/experience-contract-types/experience-contract-types-list-page'
              ).then((module) => module.ExperienceContractTypesListPage),
          },
          {
            path: 'create',
            loadComponent: () =>
              import(
                '@/app/features/experience-contract-types/experience-contract-type-create-page'
              ).then((module) => module.ExperienceContractTypeCreatePage),
            data: { breadcrumb: 'Create', title: 'Create' },
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import(
                '@/app/features/experience-contract-types/experience-contract-type-edit-page'
              ).then((module) => module.ExperienceContractTypeEditPage),
            data: { breadcrumb: 'Edit', titleFromParam: 'id' },
          },
        ],
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
    data: { title: 'Unauthorized' },
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
