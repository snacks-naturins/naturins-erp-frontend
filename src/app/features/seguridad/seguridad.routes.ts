import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const SEGURIDAD_ROUTES: Routes = [
  {
    path: 'empleados',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/usuarios/usuarios').then((m) => m.Usuarios),
  },
  {
    path: 'roles',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/roles/roles').then((m) => m.Roles),
  },
  {
    path: 'departamentos',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/departamentos/departamentos').then((m) => m.Departamentos),
  },
  {
    path: 'permisos-rbac',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/permisos-rbac/permisos-rbac').then((m) => m.PermisosRbac),
  },
];
