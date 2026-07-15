import { Routes } from '@angular/router';

import { authGuard, permisoGuard } from '../../core/guards/auth.guard';

export const CLIENTES_ROUTES: Routes = [
  {
    path: 'clientes',
    canActivate: [authGuard, permisoGuard('Clientes')],
    loadComponent: () => import('./pages/clientes/clientes').then((m) => m.Clientes),
  },
];
