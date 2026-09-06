import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const storageService = inject(StorageService);
  const roles = (route.data['roles'] as string[] | undefined) ?? [];

  if (!storageService.isBrowser()) {
    return true;
  }

  if (roles.length === 0 || authService.hasRole(roles)) {
    return true;
  }

  return router.createUrlTree([authService.getDefaultRoute()]);
};


