import { Routes } from '@angular/router';

import { authGuard, permisoGuard } from '../../core/guards/auth.guard';

export const REPORTES_ROUTES: Routes = [
  {
    path: 'reportes',
    canActivate: [authGuard, permisoGuard('Reportes')],
    loadComponent: () =>
      import('./pages/reportes/reportes').then((m) => m.Reportes),
  },
];
