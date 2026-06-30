import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { PedidoService } from '../../../ventas/services/pedido.service';
import { CuponService } from '../../services/cupon.service';
import { BannerService } from '../../services/banner.service';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';

@Component({
  selector: 'app-ecommerce-overview',
  standalone: true,
  imports: [MatIconModule, RouterLink, BreadcrumbComponent],
  templateUrl: './ecommerce-overview.html',
})
export class EcommerceOverview implements OnInit {
  private readonly pedidoSvc = inject(PedidoService);
  private readonly cuponSvc  = inject(CuponService);
  private readonly bannerSvc = inject(BannerService);

  readonly loading = signal(true);

  readonly pedidosEcommerce = signal<any[]>([]);
  readonly cupones           = signal<any[]>([]);
  readonly banners           = signal<any[]>([]);

  readonly kpiPedidos = computed(() => this.pedidosEcommerce().length);

  readonly kpiVentas = computed(() =>
    this.pedidosEcommerce()
      .filter((p) => p.estado !== 'CANCELADO' && p.estado !== 'DEVUELTO')
      .reduce((s: number, p: any) => s + (Number(p.total) || 0), 0));

  readonly kpiCuponesActivos = computed(() =>
    this.cupones().filter((c) => c.estado === 'ACTIVO').length);

  readonly kpiBannersActivos = computed(() =>
    this.banners().filter((b) => b.activo).length);

  readonly pedidosPorEstado = computed(() => {
    const estados = ['NUEVO', 'CONFIRMADO', 'EN_PREPARACION', 'LISTO_DESPACHO', 'ENTREGADO', 'CANCELADO'];
    return estados.map((e) => ({
      estado: e,
      count: this.pedidosEcommerce().filter((p) => p.estado === e).length,
    }));
  });

  ngOnInit(): void {
    let pendientes = 3;
    const done = () => { if (--pendientes === 0) this.loading.set(false); };

    this.pedidoSvc.listar().subscribe({
      next: (d) => { this.pedidosEcommerce.set(d.filter((p) => p.canal === 'ECOMMERCE')); done(); },
      error: () => done(),
    });
    this.cuponSvc.listar().subscribe({
      next: (d) => { this.cupones.set(d); done(); },
      error: () => done(),
    });
    this.bannerSvc.listar().subscribe({
      next: (d) => { this.banners.set(d); done(); },
      error: () => done(),
    });
  }

  formatMonto(v: number): string { return `S/ ${(v ?? 0).toFixed(2)}`; }

  estadoLabel(e: string): string {
    const map: Record<string, string> = {
      NUEVO: 'Nuevo', CONFIRMADO: 'Confirmado', EN_PREPARACION: 'En prep.',
      LISTO_DESPACHO: 'Despacho', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado',
    };
    return map[e] ?? e;
  }

  estadoColor(e: string): string {
    const map: Record<string, string> = {
      NUEVO: 'bg-blue-100 text-blue-700',
      CONFIRMADO: 'bg-amber-100 text-amber-700',
      EN_PREPARACION: 'bg-orange-100 text-orange-700',
      LISTO_DESPACHO: 'bg-yellow-100 text-yellow-700',
      ENTREGADO: 'bg-green-100 text-green-700',
      CANCELADO: 'bg-gray-100 text-gray-500',
    };
    return map[e] ?? 'bg-gray-100 text-gray-500';
  }
}
