import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route?: string; // si no tiene route => módulo aún no implementado
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  private readonly auth = inject(AuthService);
  readonly user = this.auth.currentUser;

  readonly nav: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Inventario', icon: 'inventory_2', route: '/productos' },
    { label: 'Presentaciones', icon: 'label', route: '/presentaciones' },
    { label: 'Lotes', icon: 'inventory', route: '/lotes' },
    { label: 'Kardex', icon: 'swap_horiz', route: '/kardex' },
    { label: 'Almacenes', icon: 'warehouse', route: '/almacenes' },
    { label: 'Materia Prima', icon: 'grass', route: '/materia-prima' },
    { label: 'Producción', icon: 'precision_manufacturing', route: '/produccion' },
    { label: 'Compras', icon: 'shopping_cart', route: '/compras' },
    { label: 'Proveedores', icon: 'local_shipping', route: '/proveedores' },
    { label: 'POS / Ventas', icon: 'point_of_sale', route: '/pos' },
    { label: 'Cotizaciones', icon: 'description', route: '/cotizaciones' },
    { label: 'Pedidos', icon: 'inventory_2', route: '/pedidos' },
    { label: 'Métodos de Pago', icon: 'payments', route: '/metodos-pago' },
    { label: 'Clientes', icon: 'groups', route: '/clientes' },
    { label: 'E-commerce', icon: 'storefront', route: '/ecommerce' },
    { label: 'Catálogo Web', icon: 'grid_view', route: '/ecommerce/productos' },
    { label: 'Banners', icon: 'view_carousel', route: '/ecommerce/banners' },
    { label: 'Cupones', icon: 'discount', route: '/ecommerce/cupones' },
    { label: 'Descuentos', icon: 'percent', route: '/ecommerce/descuentos' },
    { label: 'Pedidos Web', icon: 'language', route: '/ecommerce/pedidos' },
    { label: 'Facturación', icon: 'receipt_long' },
    { label: 'Empleados', icon: 'badge', route: '/empleados' },
    { label: 'Roles', icon: 'admin_panel_settings', route: '/roles' },
    { label: 'Departamentos', icon: 'corporate_fare', route: '/departamentos' },
    { label: 'Permisos RBAC', icon: 'security', route: '/permisos-rbac' },
    { label: 'Reportes', icon: 'analytics' },
  ];

  initials(): string {
    return (this.user()?.username ?? '').slice(0, 2).toUpperCase() || 'NA';
  }

  logout(): void {
    this.auth.logout();
  }
}
