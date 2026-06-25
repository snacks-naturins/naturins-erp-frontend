import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';

import { CotizacionService }          from '../../services/cotizacion.service';
import { DetalleCotizacionService }    from '../../services/detalle-cotizacion.service';
import { PresentacionService }         from '../../../inventario/services/presentacion.service';
import { ClienteService }              from '../../../clientes/services/cliente.service';

import { CotizacionResponse }          from '../../models/cotizacion.model';
import { PresentacionResponse }        from '../../../inventario/models/presentacion.model';
import { ClienteResponse }             from '../../../clientes/models/cliente.model';
import { FechaPipe } from '../../../../shared/pipes/fecha.pipe';
import { debouncedSignal } from '../../../../shared/utils/debounce';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';

interface LineaCotizacion {
  presentacion: PresentacionResponse;
  cantidad: number;
  precioUnitario: number;
}

@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  imports: [MatIconModule, FechaPipe, BreadcrumbComponent, EmptyState],
  templateUrl: './cotizaciones.html',
})
export class Cotizaciones implements OnInit {
  private readonly svcCot    = inject(CotizacionService);
  private readonly svcDet    = inject(DetalleCotizacionService);
  private readonly svcPres   = inject(PresentacionService);
  private readonly svcCli    = inject(ClienteService);

  // ── Vista ─────────────────────────────────────────────────────
  readonly view = signal<'list' | 'form'>('list');

  // ── Lista ─────────────────────────────────────────────────────
  readonly loading       = signal(true);
  readonly error         = signal<string | null>(null);
  readonly cotizaciones  = signal<CotizacionResponse[]>([]);
  readonly search           = signal('');
  readonly searchDebounced  = debouncedSignal(this.search);
  readonly estadoFiltro     = signal('');
  readonly editId        = signal<string | null>(null);

  readonly filtradas = computed(() => {
    const q = this.searchDebounced().toLowerCase().trim();
    const e = this.estadoFiltro();
    return this.cotizaciones().filter((c) => {
      const matchE = !e || c.estado === e;
      const matchQ = !q || c.numeroCotizacion.toLowerCase().includes(q) || c.nombreCliente.toLowerCase().includes(q);
      return matchE && matchQ;
    });
  });

  // ── Catálogos para el formulario ─────────────────────────────
  readonly clientes      = signal<ClienteResponse[]>([]);
  readonly presentaciones = signal<PresentacionResponse[]>([]);
  readonly loadingForm   = signal(false);

  // ── Cliente dropdown ─────────────────────────────────────────
  readonly clienteIdSignal    = signal('');
  readonly clienteSearch      = signal('');
  readonly clienteDropdown    = signal(false);
  readonly clienteSeleccionado = computed(() =>
    this.clientes().find((c) => c.id === this.clienteIdSignal()) ?? null);
  readonly clientesFiltrados  = computed(() => {
    const q = this.clienteSearch().toLowerCase().trim();
    return q ? this.clientes().filter((c) =>
      c.nombreCompleto.toLowerCase().includes(q) || (c.ruc ?? '').includes(q)) : this.clientes();
  });

  // ── Buscador producto (en el form) ───────────────────────────
  readonly productoSearch    = signal('');
  readonly productoDropdown  = signal(false);
  readonly productosFiltrados = computed(() => {
    const q = this.productoSearch().toLowerCase().trim();
    return q ? this.presentaciones().filter((p) =>
      p.nombreProducto.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q)) : this.presentaciones();
  });

  // ── Líneas de la cotización ───────────────────────────────────
  readonly lineas     = signal<LineaCotizacion[]>([]);
  readonly incluyeIgv = signal(true);
  readonly descuento  = signal(0);
  readonly observacion = signal('');
  readonly fechaVencimiento = signal('');

  readonly subTotal = computed(() =>
    this.lineas().reduce((s, l) => s + l.cantidad * l.precioUnitario, 0));
  readonly igv = computed(() =>
    this.incluyeIgv() ? Math.round(this.subTotal() * 0.18 * 100) / 100 : 0);
  readonly total = computed(() =>
    Math.max(0, this.subTotal() + this.igv() - this.descuento()));

  // ── Guardado ─────────────────────────────────────────────────
  readonly saving    = signal(false);
  readonly formError = signal<string | null>(null);

  // ── Acciones de estado (en la lista) ────────────────────────
  readonly accionando = signal<string | null>(null);
  readonly accionError = signal<string | null>(null);

  // ── Delete ────────────────────────────────────────────────────
  readonly deleteTarget = signal<CotizacionResponse | null>(null);
  readonly deleting     = signal(false);
  readonly deleteError  = signal<string | null>(null);

  // ── Detalle expandido ─────────────────────────────────────────
  readonly detalleOpen  = signal<string | null>(null);

  // ── Lifecycle ────────────────────────────────────────────────
  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    this.svcCot.listar().subscribe({
      next: (d) => { this.cotizaciones.set(d); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar las cotizaciones.'); this.loading.set(false); },
    });
  }

  // ── Abrir formulario ─────────────────────────────────────────
  abrirNueva(): void {
    this.editId.set(null);
    this.resetForm();
    this.cargarCatalogosForm();
    this.view.set('form');
  }

  private resetForm(): void {
    this.clienteIdSignal.set('');
    this.clienteSearch.set('');
    this.lineas.set([]);
    this.incluyeIgv.set(true);
    this.descuento.set(0);
    this.observacion.set('');
    this.fechaVencimiento.set('');
    this.formError.set(null);
  }

  private cargarCatalogosForm(): void {
    if (this.clientes().length && this.presentaciones().length) return;
    this.loadingForm.set(true);
    forkJoin([this.svcCli.listar(), this.svcPres.listar()]).subscribe({
      next: ([cli, pres]) => {
        this.clientes.set(cli.filter((c) => c.estado === 'ACTIVO'));
        this.presentaciones.set(pres.filter((p) => p.estado === 'ACTIVO'));
        this.loadingForm.set(false);
      },
      error: () => this.loadingForm.set(false),
    });
  }

  volver(): void { this.view.set('list'); }

  // ── Cliente helpers ───────────────────────────────────────────
  seleccionarCliente(c: ClienteResponse): void {
    this.clienteIdSignal.set(c.id);
    this.clienteSearch.set('');
    this.clienteDropdown.set(false);
    // auto-detectar IGV del cliente
    this.incluyeIgv.set(c.aplicaIgv);
  }
  limpiarCliente(): void { this.clienteIdSignal.set(''); }

  // ── Producto helpers ─────────────────────────────────────────
  agregarProducto(p: PresentacionResponse): void {
    const existe = this.lineas().find((l) => l.presentacion.id === p.id);
    if (existe) {
      this.lineas.update((ls) => ls.map((l) => l === existe ? { ...l, cantidad: l.cantidad + 1 } : l));
    } else {
      this.lineas.update((ls) => [...ls, { presentacion: p, cantidad: 1, precioUnitario: p.precioVenta }]);
    }
    this.productoSearch.set('');
    this.productoDropdown.set(false);
  }

  quitarLinea(i: number): void {
    this.lineas.update((ls) => ls.filter((_, idx) => idx !== i));
  }

  setCantidad(i: number, val: number): void {
    if (val < 1) return;
    this.lineas.update((ls) => ls.map((l, idx) => idx === i ? { ...l, cantidad: val } : l));
  }

  setPrecio(i: number, val: number): void {
    if (val < 0) return;
    this.lineas.update((ls) => ls.map((l, idx) => idx === i ? { ...l, precioUnitario: val } : l));
  }

  // ── Guardar cotización ────────────────────────────────────────
  get canGuardar(): boolean {
    return !!this.clienteIdSignal() && this.lineas().length > 0 && !this.saving();
  }

  guardar(): void {
    if (!this.canGuardar) return;
    this.saving.set(true);
    this.formError.set(null);

    this.svcCot.crear({
      clienteId: this.clienteIdSignal(),
      incluyeIgv: this.incluyeIgv(),
      descuento: this.descuento() || null,
      fechaVencimiento: this.fechaVencimiento() || null,
      observacion: this.observacion() || null,
    }).subscribe({
      next: (cot) => {
        forkJoin(this.lineas().map((l) =>
          this.svcDet.crear({
            cotizacionId: cot.id,
            presentacionProductoId: l.presentacion.id,
            cantidad: l.cantidad,
            precioUnitario: l.precioUnitario,
          })
        )).subscribe({
          next: () => {
            this.saving.set(false);
            this.view.set('list');
            this.cargar();
          },
          error: (err) => { this.saving.set(false); this.formError.set(err?.error?.message ?? 'Error al guardar ítems.'); },
        });
      },
      error: (err) => { this.saving.set(false); this.formError.set(err?.error?.message ?? 'Error al crear la cotización.'); },
    });
  }

  // ── Acciones de estado ────────────────────────────────────────
  enviar(c: CotizacionResponse): void {
    this.accionando.set(c.id);
    this.accionError.set(null);
    this.svcCot.enviar(c.id).subscribe({
      next: () => { this.accionando.set(null); this.cargar(); },
      error: (err) => { this.accionando.set(null); this.accionError.set(err?.error?.message ?? 'Error al enviar.'); },
    });
  }

  aceptar(c: CotizacionResponse): void {
    this.accionando.set(c.id);
    this.accionError.set(null);
    this.svcCot.aceptar(c.id).subscribe({
      next: () => { this.accionando.set(null); this.cargar(); },
      error: (err) => { this.accionando.set(null); this.accionError.set(err?.error?.message ?? 'Error al aceptar.'); },
    });
  }

  rechazar(c: CotizacionResponse): void {
    this.accionando.set(c.id);
    this.accionError.set(null);
    this.svcCot.rechazar(c.id).subscribe({
      next: () => { this.accionando.set(null); this.cargar(); },
      error: (err) => { this.accionando.set(null); this.accionError.set(err?.error?.message ?? 'Error al rechazar.'); },
    });
  }

  pedirEliminar(c: CotizacionResponse): void { this.deleteError.set(null); this.deleteTarget.set(c); }
  cancelarEliminar(): void { this.deleteTarget.set(null); }
  confirmarEliminar(): void {
    const t = this.deleteTarget();
    if (!t) return;
    this.deleting.set(true);
    this.svcCot.eliminar(t.id).subscribe({
      next: () => { this.deleting.set(false); this.deleteTarget.set(null); this.cotizaciones.update((l) => l.filter((x) => x.id !== t.id)); },
      error: (err) => { this.deleting.set(false); this.deleteError.set(err?.error?.message ?? 'Error al eliminar.'); },
    });
  }

  // ── Imprimir preview ─────────────────────────────────────────
  imprimirPreview(): void { window.print(); }

  // ── Helpers visuales ─────────────────────────────────────────
  estadoInfo(estado: string): { label: string; classes: string } {
    switch (estado) {
      case 'BORRADOR':   return { label: 'Borrador',   classes: 'bg-gray-100 text-gray-600' };
      case 'ENVIADA':    return { label: 'Enviada',    classes: 'bg-blue-100 text-blue-700' };
      case 'ACEPTADA':   return { label: 'Aceptada',   classes: 'bg-green-100 text-green-700' };
      case 'RECHAZADA':  return { label: 'Rechazada',  classes: 'bg-red-100 text-red-700' };
      case 'VENCIDA':    return { label: 'Vencida',    classes: 'bg-orange-100 text-orange-700' };
      case 'CONVERTIDA': return { label: 'Convertida', classes: 'bg-purple-100 text-purple-700' };
      default:           return { label: estado,        classes: 'bg-gray-100 text-gray-500' };
    }
  }

  formatMonto(v: number): string { return `S/ ${(v ?? 0).toFixed(2)}`; }
  hoyISO(): string { return new Date().toISOString().slice(0, 10); }
}
