import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';

export const PROVEEDORES_ROUTES: Routes = [
  {
    path: 'proveedores',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/proveedores/proveedores').then((m) => m.Proveedores),
  },
];
