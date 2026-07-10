import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { PedidoService }   from '../../services/pedido.service';
import { PedidoResponse }  from '../../models/pedido.model';
import { FechaPipe } from '../../../../shared/pipes/fecha.pipe';
import { debouncedSignal } from '../../../../shared/utils/debounce';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';

interface Columna {
  estado: string;
  label: string;
  color: string;
  dot: string;
  accionLabel: string;
  accionIcon: string;
}

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [MatIconModule, RouterLink, FechaPipe, BreadcrumbComponent],
  templateUrl: './pedidos.html',
})
export class Pedidos implements OnInit {
  private readonly svc = inject(PedidoService);

  readonly loading  = signal(true);
  readonly error    = signal<string | null>(null);
  readonly pedidos  = signal<PedidoResponse[]>([]);
  readonly search           = signal('');
  readonly searchDebounced  = debouncedSignal(this.search);
  readonly mostraCancelados = signal(false);
  readonly fechaDesde       = signal('');
  readonly fechaHasta       = signal('');

  readonly columnas: Columna[] = [
    { estado: 'NUEVO',           label: 'Nuevo',       color: 'border-t-blue-400',   dot: 'bg-blue-400',   accionLabel: 'Confirmar',  accionIcon: 'check_circle' },
    { estado: 'CONFIRMADO',      label: 'Confirmado',  color: 'border-t-primary',    dot: 'bg-primary',    accionLabel: 'Preparar',   accionIcon: 'inventory_2' },
    { estado: 'EN_PREPARACION',  label: 'Preparación', color: 'border-t-orange-400', dot: 'bg-orange-400', accionLabel: 'Despachar',  accionIcon: 'local_shipping' },
    { estado: 'LISTO_DESPACHO',  label: 'Despacho',    color: 'border-t-amber-400',  dot: 'bg-amber-400',  accionLabel: 'Entregar',   accionIcon: 'done_all' },
    { estado: 'EN_CAMINO',       label: 'En camino',   color: 'border-t-purple-400', dot: 'bg-purple-400', accionLabel: 'Entregar',   accionIcon: 'done_all' },
    { estado: 'ENTREGADO',       label: 'Entregado',   color: 'border-t-green-500',  dot: 'bg-green-500',  accionLabel: '',           accionIcon: '' },
  ];

  readonly pedidosPorEstado = computed(() => {
    const q     = this.searchDebounced().toLowerCase().trim();
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();
    const todos = this.pedidos().filter((p) => {
      const matchQ = !q || p.numeroPedido.toLowerCase().includes(q) || p.nombreCliente.toLowerCase().includes(q);
      const fecha = (p.fechaCreacion ?? '').slice(0, 10);
      const matchDesde = !desde || fecha >= desde;
      const matchHasta = !hasta || fecha <= hasta;
      return matchQ && matchDesde && matchHasta;
    });
    return new Map(this.columnas.map((col) => [
      col.estado,
      todos.filter((p) => p.estado === col.estado),
    ]));
  });

  readonly cancelados = computed(() =>
    this.pedidos().filter((p) => p.estado === 'CANCELADO' || p.estado === 'DEVUELTO'));

  readonly kpiHoy = computed(() => {
    const hoy = new Date().toISOString().slice(0, 10);
    return this.pedidos().filter((p) =>
      p.estado === 'ENTREGADO' && (p.fechaModificacion ?? '').startsWith(hoy)).length;
  });

  readonly kpiActivos = computed(() =>
    this.pedidos().filter((p) => !['ENTREGADO', 'CANCELADO', 'DEVUELTO'].includes(p.estado)).length);

  readonly kpiTotal = computed(() =>
    this.pedidos()
      .filter((p) => p.estado !== 'CANCELADO' && p.estado !== 'DEVUELTO')
      .reduce((s, p) => s + (Number(p.total) || 0), 0));

  // ── Acción en curso ───────────────────────────────────────────
  readonly accionando  = signal<string | null>(null);
  readonly accionError = signal<string | null>(null);

  // ── Modal detalle ─────────────────────────────────────────────
  readonly detalleOpen = signal<PedidoResponse | null>(null);

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    this.svc.listar().subscribe({
      next: (d) => { this.pedidos.set(d); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar los pedidos.'); this.loading.set(false); },
    });
  }

  avanzar(p: PedidoResponse): void {
    this.accionando.set(p.id);
    this.accionError.set(null);
    let req$;
    switch (p.estado) {
      case 'NUEVO':          req$ = this.svc.confirmar(p.id); break;
      case 'CONFIRMADO':     req$ = this.svc.preparar(p.id);  break;
      case 'EN_PREPARACION': req$ = this.svc.despachar(p.id); break;
      case 'LISTO_DESPACHO': req$ = this.svc.entregar(p.id);  break;
      case 'EN_CAMINO':      req$ = this.svc.entregar(p.id);  break;
      default: this.accionando.set(null); return;
    }
    req$.subscribe({
      next: () => { this.accionando.set(null); this.cargar(); },
      error: (err) => { this.accionando.set(null); this.accionError.set(err?.error?.message ?? 'Error al cambiar estado.'); },
    });
  }

  cancelar(p: PedidoResponse): void {
    this.accionando.set(p.id);
    this.accionError.set(null);
    this.svc.cancelar(p.id).subscribe({
      next: () => { this.accionando.set(null); this.cargar(); },
      error: (err) => { this.accionando.set(null); this.accionError.set(err?.error?.message ?? 'Error al cancelar.'); },
    });
  }

  // ── Helpers visuales ─────────────────────────────────────────
  canalInfo(canal: string): { label: string; icon: string } {
    switch (canal) {
      case 'PRESENCIAL':   return { label: 'Presencial',  icon: 'storefront' };
      case 'TELEFONO':     return { label: 'Teléfono',    icon: 'phone' };
      case 'WHATSAPP':     return { label: 'WhatsApp',    icon: 'chat' };
      case 'ECOMMERCE':    return { label: 'E-commerce',  icon: 'language' };
      case 'EMAIL':        return { label: 'Email',       icon: 'email' };
      case 'MARKETPLACE':  return { label: 'Marketplace', icon: 'store' };
      default:             return { label: canal,          icon: 'receipt_long' };
    }
  }

  prioridadInfo(p: string): { label: string; classes: string } {
    switch (p) {
      case 'URGENTE': return { label: 'Urgente', classes: 'bg-red-100 text-red-700' };
      case 'ALTA':    return { label: 'Alta',    classes: 'bg-orange-100 text-orange-700' };
      case 'NORMAL':  return { label: 'Normal',  classes: 'bg-gray-100 text-gray-600' };
      case 'BAJA':    return { label: 'Baja',    classes: 'bg-gray-50 text-gray-400' };
      default:        return { label: p,          classes: 'bg-gray-100 text-gray-500' };
    }
  }

  pagadoInfo(e: string): { label: string; classes: string } {
    switch (e) {
      case 'PAGADO':    return { label: 'Pagado',   classes: 'bg-green-100 text-green-700' };
      case 'PARCIAL':   return { label: 'Parcial',  classes: 'bg-yellow-100 text-yellow-700' };
      case 'PENDIENTE': return { label: 'Pendiente', classes: 'bg-gray-100 text-gray-600' };
      default:          return { label: e,            classes: 'bg-gray-100 text-gray-500' };
    }
  }

  formatMonto(v: number): string { return `S/ ${(v ?? 0).toFixed(2)}`; }


  accionLabelPara(estado: string): string {
    return this.columnas.find((c) => c.estado === estado)?.accionLabel ?? 'Avanzar';
  }
}
