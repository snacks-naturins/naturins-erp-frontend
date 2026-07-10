import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { PedidoService }        from '../../../services/pedido.service';
import { DetallePedidoService } from '../../../services/detalle-pedido.service';
import { PedidoResponse }       from '../../../models/pedido.model';
import { DetallePedidoResponse } from '../../../models/detalle-pedido.model';
import { FechaPipe } from '../../../../../shared/pipes/fecha.pipe';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb';

interface EstadoPaso {
  key: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-pedido-detalle',
  standalone: true,
  imports: [RouterLink, MatIconModule, FechaPipe, BreadcrumbComponent],
  templateUrl: './pedido-detalle.html',
})
export class PedidoDetalle implements OnInit {
  private readonly route      = inject(ActivatedRoute);
  private readonly svcPedido  = inject(PedidoService);
  private readonly svcDetalle = inject(DetallePedidoService);

  readonly loading  = signal(true);
  readonly error    = signal<string | null>(null);
  readonly pedido   = signal<PedidoResponse | null>(null);
  readonly detalles = signal<DetallePedidoResponse[]>([]);
  readonly accionando = signal(false);
  readonly accionError = signal<string | null>(null);

  readonly pasos: EstadoPaso[] = [
    { key: 'NUEVO',           label: 'Nuevo',       icon: 'fiber_new' },
    { key: 'CONFIRMADO',      label: 'Confirmado',   icon: 'check_circle' },
    { key: 'EN_PREPARACION',  label: 'Preparando',   icon: 'inventory' },
    { key: 'LISTO_DESPACHO',  label: 'Listo',        icon: 'done_all' },
    { key: 'EN_CAMINO',       label: 'En camino',    icon: 'local_shipping' },
    { key: 'ENTREGADO',       label: 'Entregado',    icon: 'task_alt' },
  ];

  readonly pasoActual = computed(() => {
    const p = this.pedido();
    return this.pasos.findIndex((s) => s.key === p?.estado);
  });

  readonly subtotal = computed(() =>
    this.detalles().reduce((s, d) => s + d.subtotal, 0));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.error.set('ID de pedido no encontrado.'); this.loading.set(false); return; }
    this.cargar(id);
  }

  cargar(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.svcPedido.buscarPorId(id).subscribe({
      next: (p) => {
        this.pedido.set(p);
        this.svcDetalle.porPedido(id).subscribe({
          next: (d) => { this.detalles.set(d); this.loading.set(false); },
          error: () => { this.detalles.set([]); this.loading.set(false); },
        });
      },
      error: () => { this.error.set('No se pudo cargar el pedido.'); this.loading.set(false); },
    });
  }

  avanzar(): void {
    const p = this.pedido();
    if (!p || this.accionando()) return;
    this.accionando.set(true);
    this.accionError.set(null);
    let req$;
    switch (p.estado) {
      case 'NUEVO':          req$ = this.svcPedido.confirmar(p.id); break;
      case 'CONFIRMADO':     req$ = this.svcPedido.preparar(p.id);  break;
      case 'EN_PREPARACION': req$ = this.svcPedido.despachar(p.id); break;
      case 'LISTO_DESPACHO': req$ = this.svcPedido.entregar(p.id); break;
      case 'EN_CAMINO':      req$ = this.svcPedido.entregar(p.id);  break;
      default: this.accionando.set(false); return;
    }
    req$.subscribe({
      next: () => { this.accionando.set(false); this.cargar(p.id); },
      error: (err) => { this.accionando.set(false); this.accionError.set(err?.error?.message ?? 'Error al avanzar el estado.'); },
    });
  }

  cancelar(): void {
    const p = this.pedido();
    if (!p || this.accionando()) return;
    this.accionando.set(true);
    this.svcPedido.cancelar(p.id).subscribe({
      next: () => { this.accionando.set(false); this.cargar(p.id); },
      error: (err) => { this.accionando.set(false); this.accionError.set(err?.error?.message ?? 'Error al cancelar.'); },
    });
  }

  get puedeAvanzar(): boolean {
    const estado = this.pedido()?.estado;
    return !!estado && !['ENTREGADO', 'CANCELADO', 'DEVUELTO'].includes(estado);
  }

  get puedeCancelar(): boolean {
    const estado = this.pedido()?.estado;
    return !!estado && !['ENTREGADO', 'CANCELADO', 'DEVUELTO'].includes(estado);
  }

  labelAvanzar(): string {
    switch (this.pedido()?.estado) {
      case 'NUEVO':          return 'Confirmar';
      case 'CONFIRMADO':     return 'Iniciar preparación';
      case 'EN_PREPARACION': return 'Marcar listo';
      case 'LISTO_DESPACHO': return 'En camino';
      case 'EN_CAMINO':      return 'Marcar entregado';
      default: return 'Avanzar';
    }
  }

  estadoClase(estado: string): string {
    switch (estado) {
      case 'NUEVO':           return 'bg-gray-100 text-gray-600';
      case 'CONFIRMADO':      return 'bg-blue-100 text-blue-700';
      case 'EN_PREPARACION':  return 'bg-amber-100 text-amber-700';
      case 'LISTO_DESPACHO':  return 'bg-indigo-100 text-indigo-700';
      case 'EN_CAMINO':       return 'bg-purple-100 text-purple-700';
      case 'ENTREGADO':       return 'bg-green-100 text-green-700';
      case 'CANCELADO':       return 'bg-red-100 text-red-600';
      case 'DEVUELTO':        return 'bg-orange-100 text-orange-700';
      default:                return 'bg-gray-100 text-gray-500';
    }
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      NUEVO: 'Nuevo', CONFIRMADO: 'Confirmado', EN_PREPARACION: 'En preparación',
      LISTO_DESPACHO: 'Listo para despacho', EN_CAMINO: 'En camino',
      ENTREGADO: 'Entregado', CANCELADO: 'Cancelado', DEVUELTO: 'Devuelto',
    };
    return map[estado] ?? estado;
  }

  formatMonto(v: number): string { return `S/ ${(v ?? 0).toFixed(2)}`; }

  imprimir(): void { window.print(); }
}
