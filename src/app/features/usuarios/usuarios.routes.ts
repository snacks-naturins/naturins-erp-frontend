import { Routes } from '@angular/router';

export const USUARIOS_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then((m) => m.Login),
  },
];
