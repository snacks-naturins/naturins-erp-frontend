import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { CompraService } from '../../services/compra.service';
import { CompraResponse, EstadoCompra } from '../../models/compra.model';
import { ProveedorService } from '../../../proveedores/services/proveedor.service';
import { ProveedorResponse } from '../../../proveedores/models/proveedor.model';
import { FechaPipe } from '../../../../shared/pipes/fecha.pipe';
import { debouncedSignal } from '../../../../shared/utils/debounce';
import { exportToCsv } from '../../../../shared/utils/export-csv';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';

type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-compras-lista',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatIconModule, FechaPipe, BreadcrumbComponent],
  templateUrl: './compras-lista.html',
})
export class ComprasLista implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly compraService = inject(CompraService);
  private readonly proveedorService = inject(ProveedorService);

  // ── Lista ──────────────────────────────────────────────────
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<CompraResponse[]>([]);
  readonly search = signal('');
  readonly searchDebounced = debouncedSignal(this.search);
  readonly filtroEstado = signal<string>('TODOS');
  readonly fechaDesde   = signal('');
  readonly fechaHasta   = signal('');

  // ── Ordenamiento ───────────────────────────────────────────
  readonly sortCol = signal('');
  readonly sortDir = signal<SortDir>('asc');

  readonly filtrados = computed(() => {
    const q      = this.searchDebounced().toLowerCase().trim();
    const estado = this.filtroEstado();
    const desde  = this.fechaDesde();
    const hasta  = this.fechaHasta();
    const col    = this.sortCol();
    const dir    = this.sortDir();

    let list = this.items().filter((c) => {
      if (q && !c.numeroOrden.toLowerCase().includes(q) && !c.nombreProveedor.toLowerCase().includes(q)) return false;
      if (estado !== 'TODOS' && c.estado !== estado) return false;
      const fecha = (c.fechaCompra ?? '').slice(0, 10);
      if (desde && fecha < desde) return false;
      if (hasta && fecha > hasta) return false;
      return true;
    });

    if (col) {
      list = [...list].sort((a, b) => {
        let va: string | number, vb: string | number;
        switch (col) {
          case 'orden':     va = a.numeroOrden;     vb = b.numeroOrden;     break;
          case 'proveedor': va = a.nombreProveedor.toLowerCase(); vb = b.nombreProveedor.toLowerCase(); break;
          case 'fecha':     va = a.fechaCompra;     vb = b.fechaCompra;     break;
          case 'total':     va = a.total;            vb = b.total;           break;
          default: return 0;
        }
        if (va < vb) return dir === 'asc' ? -1 : 1;
        if (va > vb) return dir === 'asc' ?  1 : -1;
        return 0;
      });
    }
    return list;
  });

  // ── Stats ──────────────────────────────────────────────────
  readonly totalPendientes  = computed(() => this.items().filter((c) => c.estado === 'PENDIENTE').length);
  readonly totalParciales   = computed(() => this.items().filter((c) => c.estado === 'RECIBIDA_PARCIAL').length);
  readonly totalCompletadas = computed(() => this.items().filter((c) => c.estado === 'COMPLETADA').length);
  readonly totalCanceladas  = computed(() => this.items().filter((c) => c.estado === 'CANCELADA').length);

  readonly kpiValorTotal = computed(() =>
    this.items().filter(c => c.estado === 'COMPLETADA').reduce((s, c) => s + (c.total ?? 0), 0)
  );
  readonly kpiValorTexto = computed(() => {
    const v = this.kpiValorTotal();
    if (v >= 1_000_000) return `S/ ${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1000)      return `S/ ${(v / 1000).toFixed(1)}K`;
    return `S/ ${v.toFixed(2)}`;
  });

  // ── Modal nueva OC ─────────────────────────────────────────
  readonly modalOpen = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly proveedores = signal<ProveedorResponse[]>([]);
  readonly loadingProveedores = signal(false);

  readonly form = this.fb.nonNullable.group({
    proveedorId: ['', [Validators.required]],
    observacion: [''],
  });

  // ── Lifecycle ──────────────────────────────────────────────
  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.compraService.listar().subscribe({
      next: (d) => {
        this.items.set(d.sort((a, b) => b.fechaCompra.localeCompare(a.fechaCompra)));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las órdenes de compra.');
        this.loading.set(false);
      },
    });
  }

  onSearch(e: Event): void {
    this.search.set((e.target as HTMLInputElement).value);
  }

  setFiltroEstado(e: string): void {
    this.filtroEstado.set(this.filtroEstado() === e ? 'TODOS' : e);
  }

  toggleSort(col: string): void {
    if (this.sortCol() === col) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortCol.set(col);
      this.sortDir.set('asc');
    }
  }

  sortIcon(col: string): string {
    if (this.sortCol() !== col) return 'unfold_more';
    return this.sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  // ── Modal ──────────────────────────────────────────────────
  abrirNuevaOC(): void {
    this.formError.set(null);
    this.form.reset({ proveedorId: '', observacion: '' });
    this.modalOpen.set(true);
    if (this.proveedores().length === 0) {
      this.loadingProveedores.set(true);
      this.proveedorService.listar().subscribe({
        next: (d) => {
          this.proveedores.set(d.filter((p) => p.estado === 'ACTIVO'));
          this.loadingProveedores.set(false);
        },
        error: () => this.loadingProveedores.set(false),
      });
    }
  }

  cerrarModal(): void {
    this.modalOpen.set(false);
  }

  crearOC(): void {
    this.formError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.compraService
      .crear({ proveedorId: v.proveedorId, observacion: v.observacion || undefined })
      .subscribe({
        next: (oc) => {
          this.saving.set(false);
          this.modalOpen.set(false);
          this.router.navigate(['/compras', oc.id]);
        },
        error: (err) => {
          this.saving.set(false);
          this.formError.set(err?.error?.message ?? 'No se pudo crear la orden de compra.');
        },
      });
  }

  // ── Helpers visuales ───────────────────────────────────────
  estadoBadge(estado: string): { label: string; classes: string } {
    const map: Record<string, { label: string; classes: string }> = {
      PENDIENTE:        { label: 'Pendiente',   classes: 'bg-amber-100 text-amber-700' },
      RECIBIDA_PARCIAL: { label: 'Parcial',      classes: 'bg-blue-100 text-blue-700' },
      COMPLETADA:       { label: 'Completada',   classes: 'bg-green-100 text-green-700' },
      CANCELADA:        { label: 'Cancelada',    classes: 'bg-red-100 text-red-600' },
    };
    return map[estado] ?? { label: estado, classes: 'bg-gray-100 text-gray-600' };
  }


  formatMonto(v: number): string {
    return `S/ ${v.toFixed(2)}`;
  }

  verDetalle(id: string): void {
    this.router.navigate(['/compras', id]);
  }

  exportar(): void {
    exportToCsv('compras.csv', this.filtrados(), [
      { header: 'Nro orden',           value: (c) => c.numeroOrden },
      { header: 'Proveedor',           value: (c) => c.nombreProveedor },
      { header: 'Fecha compra',        value: (c) => (c.fechaCompra ?? '').slice(0, 10) },
      { header: 'Fecha entrega esp.',  value: (c) => c.fechaEntregaEsperada ?? '' },
      { header: 'Nro factura',         value: (c) => c.nroFacturaProveedor ?? '' },
      { header: 'Estado',              value: (c) => c.estado },
      { header: 'Subtotal',            value: (c) => c.subtotal },
      { header: 'IGV',                 value: (c) => c.igv },
      { header: 'Total',               value: (c) => c.total },
    ]);
  }
}
