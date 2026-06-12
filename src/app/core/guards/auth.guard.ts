import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Protege rutas: exige sesión iniciada (token válido). */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

/**
 * Protege rutas por rol. Uso: `canActivate: [roleGuard('ADMIN', 'VENDEDOR')]`.
 */
export const roleGuard = (...roles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isAuthenticated() && auth.hasRole(...roles)) {
      return true;
    }
    return router.createUrlTree(['/login']);
  };
};
