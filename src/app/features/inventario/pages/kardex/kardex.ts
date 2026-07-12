import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { MovimientoService } from '../../services/movimiento.service';
import { LoteService } from '../../services/lote.service';
import {
  MovimientoInventarioResponse,
  TipoMovimientoInventario,
  TipoReferencia,
} from '../../models/movimiento.model';
import { LoteResponse } from '../../models/lote.model';
import { debouncedSignal } from '../../../../shared/utils/debounce';
import { exportToCsv } from '../../../../shared/utils/export-csv';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';

type Categoria = 'entrada' | 'salida' | '';

@Component({
  selector: 'app-kardex',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, DatePipe, BreadcrumbComponent, EmptyState],
  templateUrl: './kardex.html',
})
export class Kardex implements OnInit {
  private readonly fb           = inject(FormBuilder);
  private readonly service      = inject(MovimientoService);
  private readonly loteService  = inject(LoteService);

  // ── Datos ─────────────────────────────────────────
  readonly loading = signal(true);
  readonly error   = signal<string | null>(null);
  readonly items   = signal<MovimientoInventarioResponse[]>([]);
  readonly lotes   = signal<LoteResponse[]>([]);

  // ── Filtros ───────────────────────────────────────
  readonly search          = signal('');
  readonly searchDebounced = debouncedSignal(this.search);
  readonly fechaDesde      = signal('');
  readonly fechaHasta      = signal('');
  readonly filtroTipo      = signal('');       // tipoMovimiento exacto
  readonly filtroCategoria = signal<Categoria>(''); // 'entrada'|'salida'|''

  // ── Paginación ───────────────────────────────────
  readonly pagina   = signal(0);
  readonly pageSize = signal(30);

  // ── Modal ────────────────────────────────────────
  readonly modalOpen  = signal(false);
  readonly saving     = signal(false);
  readonly formError  = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    loteId:          ['', [Validators.required]],
    tipoMovimiento:  ['ENTRADA' as TipoMovimientoInventario, [Validators.required]],
    cantidad:        [0, [Validators.required, Validators.min(0.001)]],
    costoUnitario:   [null as number | null],
    tipoReferencia:  ['' as TipoReferencia | ''],
    observacion:     [''],
  });

  readonly tipos: { value: TipoMovimientoInventario; label: string }[] = [
    { value: 'ENTRADA',              label: 'Entrada' },
    { value: 'SALIDA',               label: 'Salida' },
    { value: 'AJUSTE_POSITIVO',      label: 'Ajuste (+)' },
    { value: 'AJUSTE_NEGATIVO',      label: 'Ajuste (−)' },
    { value: 'TRANSFERENCIA_ENTRADA',label: 'Transferencia entrada' },
    { value: 'TRANSFERENCIA_SALIDA', label: 'Transferencia salida' },
  ];

  // ── Mapa de lotes ─────────────────────────────────
  private readonly loteMap = computed(() => {
    const m = new Map<string, LoteResponse>();
    for (const l of this.lotes()) m.set(l.id, l);
    return m;
  });

  // ── KPIs (sobre todos los items sin filtro) ───────
  readonly kpiTotal    = computed(() => this.items().length);
  readonly kpiEntradas = computed(() => this.items().filter(m => this.esEntrada(m.tipoMovimiento)).length);
  readonly kpiSalidas  = computed(() => this.items().filter(m => !this.esEntrada(m.tipoMovimiento)).length);
  readonly kpiUnidades = computed(() =>
    this.items().reduce((s, m) => s + (Number(m.cantidad) || 0), 0)
  );

  // ── Lista filtrada ────────────────────────────────
  readonly filtrados = computed(() => {
    const q    = this.searchDebounced().toLowerCase().trim();
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();
    const tipo  = this.filtroTipo();
    const cat   = this.filtroCategoria();

    return this.items().filter(mv => {
      const l     = this.loteMap().get(mv.loteId);
      const fecha = (mv.fechaCreacion ?? '').slice(0, 10);
      if (q && !(mv.codigoLote ?? '').toLowerCase().includes(q) &&
               !(l?.nombreProducto ?? '').toLowerCase().includes(q)) return false;
      if (desde && fecha < desde) return false;
      if (hasta && fecha > hasta) return false;
      if (tipo && mv.tipoMovimiento !== tipo) return false;
      if (cat === 'entrada' && !this.esEntrada(mv.tipoMovimiento)) return false;
      if (cat === 'salida'  &&  this.esEntrada(mv.tipoMovimiento)) return false;
      return true;
    });
  });

  readonly totalPaginas  = computed(() => Math.max(1, Math.ceil(this.filtrados().length / this.pageSize())));
  readonly paginados     = computed(() => {
    const p  = this.pagina();
    const ps = this.pageSize();
    return this.filtrados().slice(p * ps, (p + 1) * ps);
  });
  readonly paginacionFin = computed(() => Math.min((this.pagina() + 1) * this.pageSize(), this.filtrados().length));

  constructor() {
    effect(() => {
      this.searchDebounced(); this.fechaDesde(); this.fechaHasta();
      this.filtroTipo(); this.filtroCategoria(); this.pageSize();
      this.pagina.set(0);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.cargar();
    this.loteService.listar().subscribe({
      next: l => this.lotes.set(l),
      error: () => this.lotes.set([]),
    });
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.listar().subscribe({
      next: d => { this.items.set([...d].reverse()); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar los movimientos.'); this.loading.set(false); },
    });
  }

  onSearch(e: Event): void { this.search.set((e.target as HTMLInputElement).value); }

  filtrarPorCategoria(valor: Categoria): void {
    this.filtroTipo.set('');
    this.filtroCategoria.set(this.filtroCategoria() === valor ? '' : valor);
  }

  limpiarFiltros(): void {
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.filtroTipo.set('');
    this.filtroCategoria.set('');
  }

  // ── Helpers ───────────────────────────────────────
  productoDe(mv: MovimientoInventarioResponse): string {
    return this.loteMap().get(mv.loteId)?.nombreProducto ?? '—';
  }

  esEntrada(tipo: string): boolean {
    return tipo === 'ENTRADA' || tipo === 'AJUSTE_POSITIVO' || tipo === 'TRANSFERENCIA_ENTRADA';
  }

  tipoView(tipo: string): { label: string; icon: string; classes: string } {
    const label = this.tipos.find(t => t.value === tipo)?.label ?? tipo;
    if (this.esEntrada(tipo)) return { label, icon: 'south_west', classes: 'bg-green-100 text-green-700' };
    return { label, icon: 'north_east', classes: 'bg-red-100 text-red-700' };
  }

  referenciaView(tipo?: string | null): { label: string; classes: string } | null {
    switch (tipo) {
      case 'COMPRA':        return { label: 'Compra',        classes: 'bg-blue-100 text-blue-700' };
      case 'PEDIDO':        return { label: 'Pedido',        classes: 'bg-purple-100 text-purple-700' };
      case 'PRODUCCION':    return { label: 'Producción',    classes: 'bg-amber-100 text-amber-700' };
      case 'MERMA':         return { label: 'Merma',         classes: 'bg-orange-100 text-orange-700' };
      case 'TRANSFERENCIA': return { label: 'Transferencia', classes: 'bg-cyan-100 text-cyan-700' };
      case 'AJUSTE_MANUAL': return { label: 'Ajuste manual', classes: 'bg-gray-100 text-gray-600' };
      case 'DEVOLUCION':    return { label: 'Devolución',    classes: 'bg-indigo-100 text-indigo-700' };
      default: return null;
    }
  }

  // ── CRUD ─────────────────────────────────────────
  abrirCrear(): void {
    this.formError.set(null);
    this.form.reset({
      loteId: '', tipoMovimiento: 'ENTRADA',
      cantidad: 0, costoUnitario: null,
      tipoReferencia: '', observacion: '',
    });
    this.modalOpen.set(true);
  }

  cerrarModal(): void { this.modalOpen.set(false); }

  guardar(): void {
    this.formError.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.service.crear({
      loteId:          v.loteId,
      tipoMovimiento:  v.tipoMovimiento,
      cantidad:        v.cantidad,
      costoUnitario:   v.costoUnitario,
      tipoReferencia:  (v.tipoReferencia as TipoReferencia) || null,
      observacion:     v.observacion || null,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.cargar();
        this.loteService.listar().subscribe({ next: l => this.lotes.set(l), error: () => {} });
      },
      error: err => {
        this.saving.set(false);
        this.formError.set(err?.error?.message ?? 'No se pudo registrar el movimiento.');
      },
    });
  }

  exportar(): void {
    exportToCsv('kardex.csv', this.filtrados(), [
      { header: 'Fecha',            value: m => (m.fechaCreacion ?? '').slice(0, 10) },
      { header: 'Código lote',      value: m => m.codigoLote },
      { header: 'Producto',         value: m => this.loteMap().get(m.loteId)?.nombreProducto ?? '' },
      { header: 'Tipo movimiento',  value: m => m.tipoMovimiento },
      { header: 'Referencia',       value: m => m.tipoReferencia ?? '' },
      { header: 'Cantidad',         value: m => m.cantidad },
      { header: 'Saldo resultante', value: m => m.stockResultante ?? '' },
      { header: 'Costo unitario',   value: m => m.costoUnitario ?? '' },
      { header: 'Observación',      value: m => m.observacion ?? '' },
    ]);
  }
}
