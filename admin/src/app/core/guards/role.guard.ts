import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '@/app/core/auth/auth.service';
import { User } from '@/app/shared/models/user.model';

const ADMIN_ROLE = 'ADMIN';

export const adminRoleGuard = roleGuard([ADMIN_ROLE]);

export function roleGuard(allowedRoles: readonly string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.ensureCurrentUser().pipe(
      map((user) => {
        if (!user) {
          return router.createUrlTree(['/login']);
        }

        return resolveRoleAccess(user, allowedRoles, router);
      }),
    );
  };
}

function resolveRoleAccess(
  user: User,
  allowedRoles: readonly string[],
  router: Router,
): boolean | UrlTree {
  return allowedRoles.includes(user.role) ? true : router.createUrlTree(['/unauthorized']);
}
