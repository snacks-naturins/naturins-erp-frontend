import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';

export const CLIENTES_ROUTES: Routes = [
  {
    path: 'clientes',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/clientes/clientes').then((m) => m.Clientes),
  },
];
