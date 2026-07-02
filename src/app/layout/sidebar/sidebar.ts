import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../core/services/auth.service';

export interface NavEntry {
  kind: 'divider' | 'item';
  label: string;
  icon?: string;
  route?: string;
  soon?: boolean;
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

  readonly nav: NavEntry[] = [
    { kind: 'item',    label: 'Dashboard',       icon: 'dashboard',               route: '/dashboard' },

    { kind: 'divider', label: 'Inventario' },
    { kind: 'item',    label: 'Inventario',       icon: 'inventory_2',             route: '/productos' },
    { kind: 'item',    label: 'Presentaciones',   icon: 'label',                   route: '/presentaciones' },
    { kind: 'item',    label: 'Lotes',            icon: 'inventory',               route: '/lotes' },
    { kind: 'item',    label: 'Kardex',           icon: 'swap_horiz',              route: '/kardex' },
    { kind: 'item',    label: 'Almacenes',        icon: 'warehouse',               route: '/almacenes' },

    { kind: 'divider', label: 'Producción' },
    { kind: 'item',    label: 'Materia Prima',    icon: 'grass',                   route: '/materia-prima' },
    { kind: 'item',    label: 'Producción',       icon: 'precision_manufacturing', route: '/produccion' },
    { kind: 'item',    label: 'Compras',          icon: 'shopping_cart',           route: '/compras' },
    { kind: 'item',    label: 'Proveedores',      icon: 'local_shipping',          route: '/proveedores' },

    { kind: 'divider', label: 'Ventas' },
    { kind: 'item',    label: 'POS / Ventas',     icon: 'point_of_sale',           route: '/pos' },
    { kind: 'item',    label: 'Cotizaciones',     icon: 'description',             route: '/cotizaciones' },
    { kind: 'item',    label: 'Pedidos',          icon: 'receipt_long',            route: '/pedidos' },
    { kind: 'item',    label: 'Clientes',         icon: 'groups',                  route: '/clientes' },
    { kind: 'item',    label: 'Métodos de Pago',  icon: 'payments',                route: '/metodos-pago' },
    { kind: 'item',    label: 'Facturación',      icon: 'request_quote',           soon: true },

    { kind: 'divider', label: 'E-commerce' },
    { kind: 'item',    label: 'Resumen',          icon: 'storefront',              route: '/ecommerce' },
    { kind: 'item',    label: 'Catálogo Web',     icon: 'grid_view',               route: '/ecommerce/productos' },
    { kind: 'item',    label: 'Banners',          icon: 'view_carousel',           route: '/ecommerce/banners' },
    { kind: 'item',    label: 'Cupones',          icon: 'discount',                route: '/ecommerce/cupones' },
    { kind: 'item',    label: 'Descuentos',       icon: 'percent',                 route: '/ecommerce/descuentos' },
    { kind: 'item',    label: 'Pedidos Web',      icon: 'language',                route: '/ecommerce/pedidos' },

    { kind: 'divider', label: 'Administración' },
    { kind: 'item',    label: 'Empleados',        icon: 'badge',                   route: '/empleados' },
    { kind: 'item',    label: 'Roles',            icon: 'admin_panel_settings',    route: '/roles' },
    { kind: 'item',    label: 'Departamentos',    icon: 'corporate_fare',          route: '/departamentos' },
    { kind: 'item',    label: 'Permisos RBAC',    icon: 'security',                route: '/permisos-rbac' },
    { kind: 'item',    label: 'Reportes',         icon: 'analytics',               soon: true },
  ];

  initials(): string {
    return (this.user()?.username ?? '').slice(0, 2).toUpperCase() || 'NA';
  }

  logout(): void {
    this.auth.logout();
  }
}
