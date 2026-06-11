import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '@/app/core/auth/auth.service';

export const registerEnabledGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isRegisterEnabled().pipe(
    map((enabled) => (enabled ? true : router.createUrlTree(['/login']))),
  );
};
