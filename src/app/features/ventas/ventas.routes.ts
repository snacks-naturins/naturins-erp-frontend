import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';

export const VENTAS_ROUTES: Routes = [
  {
    path: 'pos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/pos/pos').then((m) => m.Pos),
  },
];
