import { Routes } from '@angular/router';
import { Login } from './components/auth/login/login';
import { PanelControl } from './components/dashboard/panel-control/panel-control';
import { ProductList } from './components/inventory/products-list/products-list';
import { ProductForm } from './components/inventory/product-form/product-form';
import { Kardex } from './components/inventory/kardex/kardex';
import { OrderForm } from './components/production/order-form/order-form';
import { Pos } from './components/sales/pos/pos';

export const routes: Routes = [
  // Al entrar a la web, redirige automáticamente al login
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  // Ruta de Autenticación
  { path: 'login', component: Login },
  
  // Rutas de la aplicación (Panel y Módulos del ERP)
  {
    path: '',
    component: Login
  },

  {
    path: 'dashboard',
    component: PanelControl
  },

  {
    path: 'productos',
    component: ProductList
  },

  {
    path: 'productos/nuevo',
    component: ProductForm
  },

  {
    path: 'kardex',
    component: Kardex
  },

  {
    path: 'orden-produccion',
    component: OrderForm
  },

  {
    path: 'pos',
    component: Pos
  },

  {
    path: '**',
    redirectTo: ''
  },

  // Ruta comodín por si escriben cualquier otra cosa
  { path: '**', redirectTo: 'login' }
];
