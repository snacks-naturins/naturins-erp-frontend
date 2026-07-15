import { Routes } from '@angular/router';
import { authGuard, permisoGuard } from '../../core/guards/auth.guard';

export const PRODUCCION_ROUTES: Routes = [
  {
    path: 'produccion',
    canActivate: [authGuard, permisoGuard('Producción')],
    loadComponent: () =>
      import('./pages/produccion-lista/produccion-lista').then((m) => m.ProduccionLista),
  },
  {
    path: 'produccion/:id',
    canActivate: [authGuard, permisoGuard('Producción')],
    loadComponent: () =>
      import('./pages/produccion-detalle/produccion-detalle').then((m) => m.ProduccionDetalle),
  },
  {
    path: 'recetas',
    canActivate: [authGuard, permisoGuard('Recetas')],
    loadComponent: () =>
      import('./pages/recetas/recetas').then((m) => m.Recetas),
  },
];
