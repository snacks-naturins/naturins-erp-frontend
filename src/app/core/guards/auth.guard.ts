import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { RbacService } from '../services/rbac.service';

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

/**
 * Protege rutas por permiso RBAC (módulo + acción 'ver').
 * Espera a que RBAC cargue antes de decidir.
 * Si no tiene permiso, redirige al dashboard.
 * Uso: `canActivate: [permisoGuard('Productos')]`
 */
export const permisoGuard = (modulo: string): CanActivateFn => {
  return (): boolean | UrlTree | Observable<boolean | UrlTree> => {
    const rbac = inject(RbacService);
    const router = inject(Router);

    if (rbac.cargado()) {
      return rbac.hasPermission(modulo, 'ver')
        ? true
        : router.createUrlTree(['/dashboard']);
    }

    return new Observable<boolean | UrlTree>((observer) => {
      const id = setInterval(() => {
        if (rbac.cargado()) {
          clearInterval(id);
          observer.next(
            rbac.hasPermission(modulo, 'ver')
              ? true
              : router.createUrlTree(['/dashboard']),
          );
          observer.complete();
        }
      }, 50);
    });
  };
};
