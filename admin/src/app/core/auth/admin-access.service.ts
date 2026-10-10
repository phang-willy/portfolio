import { Injectable, inject } from '@angular/core';

import { AuthStateService } from '@/app/core/auth/auth-state.service';
import { isAdminRole } from '@/app/shared/models/user-role';

@Injectable({ providedIn: 'root' })
export class AdminAccessService {
  private readonly authState = inject(AuthStateService);

  isAdmin(): boolean {
    return isAdminRole(this.authState.getCurrentUser()?.role);
  }
}