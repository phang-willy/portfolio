import { Injectable, inject } from '@angular/core';

import { AuthStateService } from '@/app/core/auth/auth-state.service';

const ADMIN_ROLE = 'ADMIN';

@Injectable({ providedIn: 'root' })
export class AdminAccessService {
  private readonly authState = inject(AuthStateService);

  isAdmin(): boolean {
    return this.authState.getCurrentUser()?.role === ADMIN_ROLE;
  }
}