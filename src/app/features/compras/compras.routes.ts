import { Routes } from '@angular/router';

import { authGuard, permisoGuard } from '../../core/guards/auth.guard';

export const COMPRAS_ROUTES: Routes = [
  {
    path: 'compras',
    canActivate: [authGuard, permisoGuard('Compras')],
    loadComponent: () =>
      import('./pages/compras-lista/compras-lista').then((m) => m.ComprasLista),
  },
  {
    path: 'compras/:id',
    canActivate: [authGuard, permisoGuard('Compras')],
    loadComponent: () =>
      import('./pages/compra-detalle/compra-detalle').then((m) => m.CompraDetalle),
  },
];
