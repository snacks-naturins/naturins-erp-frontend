import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';
import { canDeactivateGuard } from '../../core/guards/can-deactivate.guard';

export const INVENTARIO_ROUTES: Routes = [
  {
    path: 'productos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/products-list/products-list').then((m) => m.ProductList),
  },
  {
    path: 'productos/nuevo',
    canActivate: [authGuard],
    canDeactivate: [canDeactivateGuard],
    loadComponent: () =>
      import('./pages/product-form/product-form').then((m) => m.ProductForm),
  },
  {
    path: 'productos/:id/editar',
    canActivate: [authGuard],
    canDeactivate: [canDeactivateGuard],
    loadComponent: () =>
      import('./pages/product-form/product-form').then((m) => m.ProductForm),
  },
  {
    path: 'presentaciones',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/presentaciones/presentaciones').then((m) => m.Presentaciones),
  },
  {
    path: 'almacenes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/almacenes/almacenes').then((m) => m.Almacenes),
  },
  {
    path: 'lotes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/lotes/lotes').then((m) => m.Lotes),
  },
  {
    path: 'kardex',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/kardex/kardex').then((m) => m.Kardex),
  },
  {
    path: 'materia-prima',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/materias-primas/materias-primas').then((m) => m.MateriasPrimas),
  },
  {
    path: 'materia-prima/:id/kardex',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/materia-prima-kardex/materia-prima-kardex').then((m) => m.MateriaPrimaKardex),
  },
];
