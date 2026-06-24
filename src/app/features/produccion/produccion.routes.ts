import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const PRODUCCION_ROUTES: Routes = [
  {
    path: 'produccion',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/produccion-lista/produccion-lista').then((m) => m.ProduccionLista),
  },
  {
    path: 'produccion/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/produccion-detalle/produccion-detalle').then((m) => m.ProduccionDetalle),
  },
];
