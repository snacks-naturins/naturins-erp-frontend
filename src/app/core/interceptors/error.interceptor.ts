import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Si el backend responde 401/403 (token inválido o expirado) en una ruta
 * protegida, cerramos la sesión y mandamos al login.
 * Se excluyen las rutas de /auth para no interferir con el propio login.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/auth/');
      if (!isAuthEndpoint && (error.status === 401 || error.status === 403)) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
