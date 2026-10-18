import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '@/app/core/auth/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.ensureCurrentUser().pipe(
    map((user) => (user ? true : router.createUrlTree(['/login']))),
  );
};

export const redirectAuthenticatedGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.ensureCurrentUser().pipe(
    map((user) => (user ? router.createUrlTree(['/admin', 'dashboard']) : true)),
  );
};
