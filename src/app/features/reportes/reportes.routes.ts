import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';

export const REPORTES_ROUTES: Routes = [
  {
    path: 'reportes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/reportes/reportes').then((m) => m.Reportes),
  },
];
