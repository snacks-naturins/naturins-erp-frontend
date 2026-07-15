import { Routes } from '@angular/router';

import { authGuard, permisoGuard } from '../../core/guards/auth.guard';
import { canDeactivateGuard } from '../../core/guards/can-deactivate.guard';

export const INVENTARIO_ROUTES: Routes = [
  {
    path: 'productos',
    canActivate: [authGuard, permisoGuard('Inventario')],
    loadComponent: () =>
      import('./pages/products-list/products-list').then((m) => m.ProductList),
  },
  {
    path: 'productos/nuevo',
    canActivate: [authGuard, permisoGuard('Inventario')],
    canDeactivate: [canDeactivateGuard],
    loadComponent: () =>
      import('./pages/product-form/product-form').then((m) => m.ProductForm),
  },
  {
    path: 'productos/:id/editar',
    canActivate: [authGuard, permisoGuard('Inventario')],
    canDeactivate: [canDeactivateGuard],
    loadComponent: () =>
      import('./pages/product-form/product-form').then((m) => m.ProductForm),
  },
  {
    path: 'presentaciones',
    canActivate: [authGuard, permisoGuard('Presentaciones')],
    loadComponent: () =>
      import('./pages/presentaciones/presentaciones').then((m) => m.Presentaciones),
  },
  {
    path: 'almacenes',
    canActivate: [authGuard, permisoGuard('Almacenes')],
    loadComponent: () =>
      import('./pages/almacenes/almacenes').then((m) => m.Almacenes),
  },
  {
    path: 'lotes',
    canActivate: [authGuard, permisoGuard('Lotes')],
    loadComponent: () =>
      import('./pages/lotes/lotes').then((m) => m.Lotes),
  },
  {
    path: 'kardex',
    canActivate: [authGuard, permisoGuard('Kardex')],
    loadComponent: () =>
      import('./pages/kardex/kardex').then((m) => m.Kardex),
  },
  {
    path: 'materia-prima',
    canActivate: [authGuard, permisoGuard('Materia Prima')],
    loadComponent: () =>
      import('./pages/materias-primas/materias-primas').then((m) => m.MateriasPrimas),
  },
  {
    path: 'materia-prima/:id/kardex',
    canActivate: [authGuard, permisoGuard('Materia Prima')],
    loadComponent: () =>
      import('./pages/materia-prima-kardex/materia-prima-kardex').then((m) => m.MateriaPrimaKardex),
  },
];
