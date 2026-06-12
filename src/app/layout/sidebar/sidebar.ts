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
    { label: 'Kardex', icon: 'swap_horiz', route: '/kardex' },
    { label: 'Almacenes', icon: 'warehouse' },
    { label: 'Producción', icon: 'precision_manufacturing' },
    { label: 'Compras', icon: 'shopping_cart' },
    { label: 'Proveedores', icon: 'local_shipping' },
    { label: 'Ventas', icon: 'point_of_sale', route: '/pos' },
    { label: 'Clientes', icon: 'groups' },
    { label: 'E-commerce', icon: 'storefront' },
    { label: 'Facturación', icon: 'receipt_long' },
    { label: 'Seguridad', icon: 'admin_panel_settings' },
    { label: 'Reportes', icon: 'analytics' },
  ];

  initials(): string {
    return (this.user()?.username ?? '').slice(0, 2).toUpperCase() || 'NA';
  }

  logout(): void {
    this.auth.logout();
  }
}
