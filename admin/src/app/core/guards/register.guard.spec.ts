import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, GuardResult, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, isObservable, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '@/app/core/auth/auth.service';
import { registerEnabledGuard } from '@/app/core/guards/register.guard';

describe('registerEnabledGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;

  it('allows navigation when registration is enabled', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isRegisterEnabled: () => of(true) } },
        { provide: Router, useValue: { createUrlTree: vi.fn() } },
      ],
    });

    const result = await runGuard();

    expect(result).toBe(true);
  });

  it('redirects to login when registration is disabled', async () => {
    const loginUrlTree = {} as UrlTree;
    const createUrlTree = vi.fn().mockReturnValue(loginUrlTree);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isRegisterEnabled: () => of(false) } },
        { provide: Router, useValue: { createUrlTree } },
      ],
    });

    const result = await runGuard();

    expect(createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toBe(loginUrlTree);
  });

  function runGuard(): Promise<GuardResult> {
    return TestBed.runInInjectionContext(() => {
      const result = registerEnabledGuard(route, state);
      return isObservable(result) ? firstValueFrom(result) : Promise.resolve(result);
    });
  }
});
