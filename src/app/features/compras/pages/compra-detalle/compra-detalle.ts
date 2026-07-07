import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { CompraService } from '../../services/compra.service';
import { DetalleCompraService } from '../../services/detalle-compra.service';
import { CompraResponse } from '../../models/compra.model';
import { DetalleCompraResponse } from '../../models/detalle-compra.model';
import { ProveedorService } from '../../../proveedores/services/proveedor.service';
import { ProveedorProductoResponse } from '../../../proveedores/models/proveedor.model';
import { FechaPipe } from '../../../../shared/pipes/fecha.pipe';

interface LineaItem {
  item: ProveedorProductoResponse;
  cantidad: string;
  precioCompra: string;
}

@Component({
  selector: 'app-compra-detalle',
  standalone: true,
  imports: [RouterLink, MatIconModule, FechaPipe],
  templateUrl: './compra-detalle.html',
})
export class CompraDetalle implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly compraService = inject(CompraService);
  private readonly detalleService = inject(DetalleCompraService);
  private readonly proveedorService = inject(ProveedorService);

  // ── Estado principal ───────────────────────────────────────
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly compra = signal<CompraResponse | null>(null);
  readonly detalles = signal<DetalleCompraResponse[]>([]);
  readonly loadingDetalles = signal(false);

  // ── Catálogo del proveedor ─────────────────────────────────
  readonly catalogo = signal<ProveedorProductoResponse[]>([]);
  readonly loadingCatalogo = signal(false);

  // ── Computed ───────────────────────────────────────────────
  readonly isPendiente = computed(() => this.compra()?.estado === 'PENDIENTE');
  readonly canReceive = computed(() => this.isPendiente() && this.detalles().length > 0);
  readonly canCancel = computed(() => this.isPendiente());

  // ── Modal agregar (multi-select con cards) ─────────────────
  readonly modalAgregar = signal(false);
  readonly savingAgregar = signal(false);
  readonly errorAgregar = signal<string | null>(null);
  readonly lineasSeleccionadas = signal<LineaItem[]>([]);

  readonly lineasValidas = computed(() =>
    this.lineasSeleccionadas().filter((l) => {
      const c = parseFloat(l.cantidad);
      const p = parseFloat(l.precioCompra);
      return !isNaN(c) && c > 0 && !isNaN(p) && p > 0;
    }),
  );

  // ── Modal editar ítem ──────────────────────────────────────
  readonly modalEditar = signal(false);
  readonly savingEditar = signal(false);
  readonly errorEditar = signal<string | null>(null);
  readonly editDetalleId = signal<string | null>(null);
  readonly editDetalleMp = signal('');
  readonly editCantidad = signal('');
  readonly editPrecio = signal('');

  // ── Confirmación eliminar ítem ─────────────────────────────
  readonly detalleToDelete = signal<DetalleCompraResponse | null>(null);
  readonly deletingDetalle = signal(false);
  readonly errorDelete = signal<string | null>(null);

  // ── Confirmación recibir ───────────────────────────────────
  readonly confirmRecibir = signal(false);
  readonly procesandoRecibir = signal(false);
  readonly errorRecibir = signal<string | null>(null);

  // ── Confirmación cancelar ──────────────────────────────────
  readonly confirmCancelar = signal(false);
  readonly procesandoCancelar = signal(false);
  readonly errorCancelar = signal<string | null>(null);

  // ── Lifecycle ──────────────────────────────────────────────
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/compras']); return; }
    this.cargarCompra(id);
  }

  private cargarCompra(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.compraService.buscarPorId(id).subscribe({
      next: (c) => {
        this.compra.set(c);
        this.loading.set(false);
        this.cargarDetalles(id);
        this.cargarCatalogo(c.proveedorId);
      },
      error: () => { this.error.set('No se pudo cargar la orden.'); this.loading.set(false); },
    });
  }

  private cargarDetalles(compraId: string): void {
    this.loadingDetalles.set(true);
    this.detalleService.porCompra(compraId).subscribe({
      next: (d) => { this.detalles.set(d); this.loadingDetalles.set(false); },
      error: () => this.loadingDetalles.set(false),
    });
  }

  private cargarCatalogo(proveedorId: string): void {
    if (this.catalogo().length > 0) return;
    this.loadingCatalogo.set(true);
    this.proveedorService.listarCatalogo(proveedorId).subscribe({
      next: (d) => { this.catalogo.set(d.filter((c) => c.estado === 'ACTIVO')); this.loadingCatalogo.set(false); },
      error: () => this.loadingCatalogo.set(false),
    });
  }

  private refrescarTodo(): void {
    const c = this.compra();
    if (!c) return;
    this.compraService.buscarPorId(c.id).subscribe({ next: (u) => this.compra.set(u) });
    this.cargarDetalles(c.id);
  }

  // ── Multi-select cards ─────────────────────────────────────
  abrirAgregar(): void {
    this.errorAgregar.set(null);
    this.lineasSeleccionadas.set([]);
    this.modalAgregar.set(true);
  }

  cerrarAgregar(): void { this.modalAgregar.set(false); }

  isSelected(id: string): boolean {
    return this.lineasSeleccionadas().some((l) => l.item.id === id);
  }

  getLinea(id: string): LineaItem | undefined {
    return this.lineasSeleccionadas().find((l) => l.item.id === id);
  }

  toggleItem(item: ProveedorProductoResponse): void {
    if (this.isSelected(item.id)) {
      this.lineasSeleccionadas.update((l) => l.filter((x) => x.item.id !== item.id));
    } else {
      this.lineasSeleccionadas.update((l) => [
        ...l,
        {
          item,
          cantidad: '',
          precioCompra: item.precioCompra != null ? item.precioCompra.toFixed(2) : '',
        },
      ]);
    }
  }

  setCantidad(id: string, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.lineasSeleccionadas.update((l) =>
      l.map((x) => (x.item.id === id ? { ...x, cantidad: val } : x)),
    );
  }

  setPrecio(id: string, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.lineasSeleccionadas.update((l) =>
      l.map((x) => (x.item.id === id ? { ...x, precioCompra: val } : x)),
    );
  }

  guardarTodos(): void {
    const validas = this.lineasValidas();
    if (validas.length === 0) {
      this.errorAgregar.set('Selecciona al menos un ítem y completa cantidad y precio.');
      return;
    }
    const compra = this.compra();
    if (!compra) return;
    this.savingAgregar.set(true);
    this.errorAgregar.set(null);

    const payload = validas.map((l) => ({
      compraId: compra.id,
      materiaPrimaId: l.item.materiaPrimaId,
      cantidad: parseFloat(l.cantidad),
      precioCompra: parseFloat(l.precioCompra),
    }));

    this.detalleService.crearBulk(payload).subscribe({
      next: () => {
        this.savingAgregar.set(false);
        this.modalAgregar.set(false);
        this.refrescarTodo();
      },
      error: (err) => {
        this.savingAgregar.set(false);
        this.errorAgregar.set(err?.error?.message ?? 'Error al agregar los ítems.');
      },
    });
  }

  // ── Modal editar ítem ──────────────────────────────────────
  abrirEditar(d: DetalleCompraResponse): void {
    this.errorEditar.set(null);
    this.editDetalleId.set(d.id);
    this.editDetalleMp.set(d.nombreMateriaPrima ?? '');
    this.editCantidad.set(String(d.cantidad));
    this.editPrecio.set(String(d.precioCompra));
    this.modalEditar.set(true);
  }

  cerrarEditar(): void { this.modalEditar.set(false); }

  onEditCantidad(e: Event): void { this.editCantidad.set((e.target as HTMLInputElement).value); }
  onEditPrecio(e: Event): void { this.editPrecio.set((e.target as HTMLInputElement).value); }

  guardarEditar(): void {
    const c = parseFloat(this.editCantidad());
    const p = parseFloat(this.editPrecio());
    if (isNaN(c) || c <= 0 || isNaN(p) || p <= 0) {
      this.errorEditar.set('Cantidad y precio deben ser mayores a 0.');
      return;
    }
    const id = this.editDetalleId();
    if (!id) return;
    this.savingEditar.set(true);
    this.detalleService.actualizar(id, { cantidad: c, precioCompra: p }).subscribe({
      next: () => { this.savingEditar.set(false); this.modalEditar.set(false); this.refrescarTodo(); },
      error: (err) => { this.savingEditar.set(false); this.errorEditar.set(err?.error?.message ?? 'No se pudo actualizar.'); },
    });
  }

  // ── Eliminar ítem ──────────────────────────────────────────
  pedirEliminarDetalle(d: DetalleCompraResponse): void { this.errorDelete.set(null); this.detalleToDelete.set(d); }
  cancelarEliminarDetalle(): void { this.detalleToDelete.set(null); }

  confirmarEliminarDetalle(): void {
    const d = this.detalleToDelete();
    if (!d) return;
    this.deletingDetalle.set(true);
    this.detalleService.eliminar(d.id).subscribe({
      next: () => { this.deletingDetalle.set(false); this.detalleToDelete.set(null); this.refrescarTodo(); },
      error: (err) => { this.deletingDetalle.set(false); this.errorDelete.set(err?.error?.message ?? 'No se pudo eliminar.'); },
    });
  }

  // ── Recibir ────────────────────────────────────────────────
  abrirConfirmRecibir(): void { this.errorRecibir.set(null); this.confirmRecibir.set(true); }
  cerrarConfirmRecibir(): void { this.confirmRecibir.set(false); }

  ejecutarRecibir(): void {
    const c = this.compra();
    if (!c) return;
    this.procesandoRecibir.set(true);
    this.compraService.recibir(c.id).subscribe({
      next: (u) => { this.compra.set(u); this.procesandoRecibir.set(false); this.confirmRecibir.set(false); this.cargarDetalles(c.id); },
      error: (err) => { this.procesandoRecibir.set(false); this.errorRecibir.set(err?.error?.message ?? 'No se pudo recibir.'); },
    });
  }

  // ── Cancelar ───────────────────────────────────────────────
  abrirConfirmCancelar(): void { this.errorCancelar.set(null); this.confirmCancelar.set(true); }
  cerrarConfirmCancelar(): void { this.confirmCancelar.set(false); }

  ejecutarCancelar(): void {
    const c = this.compra();
    if (!c) return;
    this.procesandoCancelar.set(true);
    this.compraService.cancelar(c.id).subscribe({
      next: () => {
        this.procesandoCancelar.set(false);
        this.confirmCancelar.set(false);
        this.compraService.buscarPorId(c.id).subscribe({ next: (u) => this.compra.set(u) });
      },
      error: (err) => { this.procesandoCancelar.set(false); this.errorCancelar.set(err?.error?.message ?? 'No se pudo cancelar.'); },
    });
  }

  // ── Helpers visuales ───────────────────────────────────────
  estadoBadge(estado: string): { label: string; classes: string } {
    const map: Record<string, { label: string; classes: string }> = {
      PENDIENTE:        { label: 'Pendiente',  classes: 'bg-amber-100 text-amber-700' },
      RECIBIDA_PARCIAL: { label: 'Parcial',     classes: 'bg-blue-100 text-blue-700' },
      COMPLETADA:       { label: 'Completada',  classes: 'bg-green-100 text-green-700' },
      CANCELADA:        { label: 'Cancelada',   classes: 'bg-red-100 text-red-600' },
    };
    return map[estado] ?? { label: estado, classes: 'bg-gray-100 text-gray-600' };
  }


  formatMonto(v: number): string { return `S/ ${(v ?? 0).toFixed(2)}`; }

  formatCantidad(v: number): string { return v.toFixed(3).replace(/\.?0+$/, ''); }
}
