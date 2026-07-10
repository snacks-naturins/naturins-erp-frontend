import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';

export const VENTAS_ROUTES: Routes = [
  {
    path: 'pos',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/pos/pos').then((m) => m.Pos),
  },
  {
    path: 'cotizaciones',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/cotizaciones/cotizaciones').then((m) => m.Cotizaciones),
  },
  {
    path: 'pedidos',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/pedidos/pedidos').then((m) => m.Pedidos),
  },
  {
    path: 'pedidos/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/pedidos/pedido-detalle/pedido-detalle').then((m) => m.PedidoDetalle),
  },
  {
    path: 'metodos-pago',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/metodos-pago/metodos-pago').then((m) => m.MetodosPago),
  },
];
