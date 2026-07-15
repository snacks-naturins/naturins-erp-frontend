import { Routes } from '@angular/router';

import { authGuard, permisoGuard } from '../../core/guards/auth.guard';

export const VENTAS_ROUTES: Routes = [
  {
    path: 'pos',
    canActivate: [authGuard, permisoGuard('Ventas')],
    loadComponent: () => import('./pages/pos/pos').then((m) => m.Pos),
  },
  {
    path: 'cotizaciones',
    canActivate: [authGuard, permisoGuard('Cotizaciones')],
    loadComponent: () => import('./pages/cotizaciones/cotizaciones').then((m) => m.Cotizaciones),
  },
  {
    path: 'pedidos',
    canActivate: [authGuard, permisoGuard('Pedidos')],
    loadComponent: () => import('./pages/pedidos/pedidos').then((m) => m.Pedidos),
  },
  {
    path: 'pedidos/:id',
    canActivate: [authGuard, permisoGuard('Pedidos')],
    loadComponent: () => import('./pages/pedidos/pedido-detalle/pedido-detalle').then((m) => m.PedidoDetalle),
  },
  {
    path: 'metodos-pago',
    canActivate: [authGuard, permisoGuard('Métodos de Pago')],
    loadComponent: () => import('./pages/metodos-pago/metodos-pago').then((m) => m.MetodosPago),
  },
];
