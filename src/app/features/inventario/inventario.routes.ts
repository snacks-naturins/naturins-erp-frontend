import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';

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
    loadComponent: () =>
      import('./pages/product-form/product-form').then((m) => m.ProductForm),
  },
  {
    path: 'productos/:id/editar',
    canActivate: [authGuard],
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
];
