import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';

export const ECOMMERCE_ROUTES: Routes = [
  {
    path: 'ecommerce',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/ecommerce-overview/ecommerce-overview').then((m) => m.EcommerceOverview),
  },
  {
    path: 'ecommerce/productos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/ecommerce-productos/ecommerce-productos').then((m) => m.EcommerceProductos),
  },
  {
    path: 'ecommerce/banners',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/ecommerce-banners/ecommerce-banners').then((m) => m.EcommerceBanners),
  },
  {
    path: 'ecommerce/banners/editor',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/banner-editor/banner-editor').then((m) => m.BannerEditor),
  },
  {
    path: 'ecommerce/banners/editor/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/banner-editor/banner-editor').then((m) => m.BannerEditor),
  },
  {
    path: 'ecommerce/cupones',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/ecommerce-cupones/ecommerce-cupones').then((m) => m.EcommerceCupones),
  },
  {
    path: 'ecommerce/pedidos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/ecommerce-pedidos/ecommerce-pedidos').then((m) => m.EcommercePedidos),
  },
  {
    path: 'ecommerce/descuentos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/ecommerce-descuentos/ecommerce-descuentos').then((m) => m.EcommerceDescuentos),
  },
];
