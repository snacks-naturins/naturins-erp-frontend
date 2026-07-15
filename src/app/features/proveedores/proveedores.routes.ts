import { Routes } from '@angular/router';

import { authGuard, permisoGuard } from '../../core/guards/auth.guard';

export const PROVEEDORES_ROUTES: Routes = [
  {
    path: 'proveedores',
    canActivate: [authGuard, permisoGuard('Proveedores')],
    loadComponent: () => import('./pages/proveedores/proveedores').then((m) => m.Proveedores),
  },
];
