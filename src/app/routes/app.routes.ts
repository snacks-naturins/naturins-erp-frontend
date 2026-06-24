import { Routes } from '@angular/router';

import { MainLayout } from '../layout/main-layout/main-layout';
import { authGuard } from '../core/guards/auth.guard';

import { USUARIOS_ROUTES } from '../features/usuarios/usuarios.routes';
import { DASHBOARD_ROUTES } from '../features/dashboard/dashboard.routes';
import { INVENTARIO_ROUTES } from '../features/inventario/inventario.routes';
import { VENTAS_ROUTES } from '../features/ventas/ventas.routes';
import { COMPRAS_ROUTES } from '../features/compras/compras.routes';
import { PRODUCCION_ROUTES } from '../features/produccion/produccion.routes';
import { CLIENTES_ROUTES } from '../features/clientes/clientes.routes';
import { PROVEEDORES_ROUTES } from '../features/proveedores/proveedores.routes';

export const routes: Routes = [
  // Al entrar a la web, redirige al login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Rutas públicas (sin layout)
  ...USUARIOS_ROUTES,

  // Rutas protegidas dentro de la cáscara principal (sidebar + topbar)
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      ...DASHBOARD_ROUTES,
      ...INVENTARIO_ROUTES,
      ...VENTAS_ROUTES,
      ...COMPRAS_ROUTES,
      ...PRODUCCION_ROUTES,
      ...CLIENTES_ROUTES,
      ...PROVEEDORES_ROUTES,
    ],
  },

  // Comodín: cualquier ruta desconocida vuelve al login
  { path: '**', redirectTo: 'login' },
];
