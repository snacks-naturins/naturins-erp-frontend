import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { PedidoService } from '../../../ventas/services/pedido.service';
import { PedidoResponse } from '../../../ventas/models/pedido.model';
import { FechaPipe } from '../../../../shared/pipes/fecha.pipe';
import { debouncedSignal } from '../../../../shared/utils/debounce';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';

@Component({
  selector: 'app-ecommerce-pedidos',
  standalone: true,
  imports: [MatIconModule, FechaPipe, BreadcrumbComponent],
  templateUrl: './ecommerce-pedidos.html',
})
export class EcommercePedidos implements OnInit {
  private readonly svc = inject(PedidoService);

  readonly loading  = signal(true);
  readonly error    = signal<string | null>(null);
  readonly todos    = signal<PedidoResponse[]>([]);
  readonly search   = signal('');
  readonly searchDebounced = debouncedSignal(this.search);
  readonly accionando  = signal<string | null>(null);
  readonly detalleOpen = signal<PedidoResponse | null>(null);

  readonly pedidos = computed(() => {
    const q = this.searchDebounced().toLowerCase().trim();
    return this.todos().filter(
      (p) => !q || p.numeroPedido.toLowerCase().includes(q) || p.nombreCliente.toLowerCase().includes(q),
    );
  });

  readonly kpiTotal = computed(() => this.todos().length);
  readonly kpiActivos = computed(() =>
    this.todos().filter((p) => !['ENTREGADO', 'CANCELADO', 'DEVUELTO'].includes(p.estado)).length);
  readonly kpiVentas = computed(() =>
    this.todos()
      .filter((p) => p.estado !== 'CANCELADO' && p.estado !== 'DEVUELTO')
      .reduce((s, p) => s + (Number(p.total) || 0), 0));

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    this.svc.listar().subscribe({
      next: (d) => {
        this.todos.set(d.filter((p) => p.canal === 'ECOMMERCE'));
        this.loading.set(false);
      },
      error: () => { this.error.set('No se pudieron cargar los pedidos.'); this.loading.set(false); },
    });
  }

  avanzar(p: PedidoResponse): void {
    this.accionando.set(p.id);
    let req$;
    switch (p.estado) {
      case 'NUEVO':          req$ = this.svc.confirmar(p.id);  break;
      case 'CONFIRMADO':     req$ = this.svc.preparar(p.id);   break;
      case 'EN_PREPARACION': req$ = this.svc.despachar(p.id);  break;
      case 'LISTO_DESPACHO': req$ = this.svc.entregar(p.id);   break;
      default: this.accionando.set(null); return;
    }
    req$.subscribe({
      next: () => { this.accionando.set(null); this.detalleOpen.set(null); this.cargar(); },
      error: () => this.accionando.set(null),
    });
  }

  cancelar(p: PedidoResponse): void {
    this.accionando.set(p.id);
    this.svc.cancelar(p.id).subscribe({
      next: () => { this.accionando.set(null); this.detalleOpen.set(null); this.cargar(); },
      error: () => this.accionando.set(null),
    });
  }

  estadoColor(e: string): string {
    const map: Record<string, string> = {
      NUEVO: 'bg-blue-100 text-blue-700',
      CONFIRMADO: 'bg-amber-100 text-amber-700',
      EN_PREPARACION: 'bg-orange-100 text-orange-700',
      LISTO_DESPACHO: 'bg-yellow-100 text-yellow-700',
      ENTREGADO: 'bg-green-100 text-green-700',
      CANCELADO: 'bg-gray-100 text-gray-500',
      DEVUELTO: 'bg-red-100 text-red-600',
    };
    return map[e] ?? 'bg-gray-100 text-gray-500';
  }

  pagadoColor(e: string): string {
    const map: Record<string, string> = {
      PAGADO: 'bg-green-100 text-green-700',
      PARCIAL: 'bg-yellow-100 text-yellow-700',
      PENDIENTE: 'bg-gray-100 text-gray-600',
      VENCIDO: 'bg-red-100 text-red-600',
    };
    return map[e] ?? 'bg-gray-100 text-gray-500';
  }

  puedeAvanzar(estado: string): boolean {
    return ['NUEVO', 'CONFIRMADO', 'EN_PREPARACION', 'LISTO_DESPACHO'].includes(estado);
  }

  accionLabel(estado: string): string {
    const map: Record<string, string> = {
      NUEVO: 'Confirmar', CONFIRMADO: 'Preparar', EN_PREPARACION: 'Despachar', LISTO_DESPACHO: 'Entregar',
    };
    return map[estado] ?? '';
  }

  formatMonto(v: number): string { return `S/ ${(v ?? 0).toFixed(2)}`; }
}
