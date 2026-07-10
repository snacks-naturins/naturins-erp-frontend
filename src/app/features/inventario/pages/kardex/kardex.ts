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

@Component({
  selector: 'app-kardex',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, DatePipe, BreadcrumbComponent],
  templateUrl: './kardex.html',
})
export class Kardex implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MovimientoService);
  private readonly loteService = inject(LoteService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<MovimientoInventarioResponse[]>([]);
  readonly lotes = signal<LoteResponse[]>([]);
  readonly search = signal('');
  readonly searchDebounced = debouncedSignal(this.search);

  readonly modalOpen = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    loteId: ['', [Validators.required]],
    tipoMovimiento: ['ENTRADA' as TipoMovimientoInventario, [Validators.required]],
    cantidad: [0, [Validators.required, Validators.min(0.001)]],
    costoUnitario: [null as number | null],
    tipoReferencia: ['' as TipoReferencia | ''],
    observacion: [''],
  });

  readonly tipos: { value: TipoMovimientoInventario; label: string }[] = [
    { value: 'ENTRADA', label: 'Entrada' },
    { value: 'SALIDA', label: 'Salida' },
    { value: 'AJUSTE_POSITIVO', label: 'Ajuste (+)' },
    { value: 'AJUSTE_NEGATIVO', label: 'Ajuste (−)' },
    { value: 'TRANSFERENCIA_ENTRADA', label: 'Transferencia entrada' },
    { value: 'TRANSFERENCIA_SALIDA', label: 'Transferencia salida' },
  ];

  private readonly loteMap = computed(() => {
    const m = new Map<string, LoteResponse>();
    for (const l of this.lotes()) m.set(l.id, l);
    return m;
  });

  readonly fechaDesde = signal('');
  readonly fechaHasta = signal('');

  readonly filtrados = computed(() => {
    const q      = this.searchDebounced().toLowerCase().trim();
    const desde  = this.fechaDesde();
    const hasta  = this.fechaHasta();
    return this.items().filter((mv) => {
      const l = this.loteMap().get(mv.loteId);
      const matchQ = !q ||
        (mv.codigoLote ?? '').toLowerCase().includes(q) ||
        (l?.nombreProducto ?? '').toLowerCase().includes(q);
      const fecha = (mv.fechaCreacion ?? '').slice(0, 10);
      const matchDesde = !desde || fecha >= desde;
      const matchHasta = !hasta || fecha <= hasta;
      return matchQ && matchDesde && matchHasta;
    });
  });

  readonly PAGE_SIZE    = 30;
  readonly pagina       = signal(0);
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / this.PAGE_SIZE)));
  readonly paginados    = computed(() => {
    const p = this.pagina();
    return this.filtrados().slice(p * this.PAGE_SIZE, (p + 1) * this.PAGE_SIZE);
  });

  constructor() {
    effect(() => {
      this.searchDebounced();
      this.fechaDesde();
      this.fechaHasta();
      this.pagina.set(0);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.cargar();
    this.loteService.listar().subscribe({
      next: (l) => this.lotes.set(l),
      error: () => this.lotes.set([]),
    });
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.listar().subscribe({
      next: (d) => {
        // más recientes primero
        this.items.set([...d].reverse());
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los movimientos.');
        this.loading.set(false);
      },
    });
  }

  onSearch(e: Event): void {
    this.search.set((e.target as HTMLInputElement).value);
  }

  abrirCrear(): void {
    this.formError.set(null);
    this.form.reset({
      loteId: '',
      tipoMovimiento: 'ENTRADA',
      cantidad: 0,
      costoUnitario: null,
      tipoReferencia: '',
      observacion: '',
    });
    this.modalOpen.set(true);
  }

  cerrarModal(): void {
    this.modalOpen.set(false);
  }

  guardar(): void {
    this.formError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.service
      .crear({
        loteId: v.loteId,
        tipoMovimiento: v.tipoMovimiento,
        cantidad: v.cantidad,
        costoUnitario: v.costoUnitario,
        tipoReferencia: (v.tipoReferencia as TipoReferencia) || null,
        observacion: v.observacion || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.modalOpen.set(false);
          this.cargar();
          // refresca el stock de los lotes para el select
          this.loteService.listar().subscribe({ next: (l) => this.lotes.set(l), error: () => {} });
        },
        error: (err) => {
          this.saving.set(false);
          this.formError.set(err?.error?.message ?? 'No se pudo registrar el movimiento.');
        },
      });
  }

  productoDe(mv: MovimientoInventarioResponse): string {
    return this.loteMap().get(mv.loteId)?.nombreProducto ?? '—';
  }

  esEntrada(tipo: string): boolean {
    return tipo === 'ENTRADA' || tipo === 'AJUSTE_POSITIVO' || tipo === 'TRANSFERENCIA_ENTRADA';
  }

  tipoView(tipo: string): { label: string; icon: string; classes: string } {
    if (this.esEntrada(tipo)) {
      return {
        label: this.tipos.find((t) => t.value === tipo)?.label ?? tipo,
        icon: 'south_west',
        classes: 'bg-[#DCFCE7] text-[#15803D]',
      };
    }
    return {
      label: this.tipos.find((t) => t.value === tipo)?.label ?? tipo,
      icon: 'north_east',
      classes: 'bg-[#FEE2E2] text-[#B91C1C]',
    };
  }

  exportar(): void {
    exportToCsv('kardex.csv', this.filtrados(), [
      { header: 'Fecha',             value: (m) => (m.fechaCreacion ?? '').slice(0, 10) },
      { header: 'Código lote',       value: (m) => m.codigoLote },
      { header: 'Producto',          value: (m) => this.loteMap().get(m.loteId)?.nombreProducto ?? '' },
      { header: 'Tipo movimiento',   value: (m) => m.tipoMovimiento },
      { header: 'Cantidad',          value: (m) => m.cantidad },
      { header: 'Stock resultante',  value: (m) => m.stockResultante ?? '' },
      { header: 'Costo unitario',    value: (m) => m.costoUnitario ?? '' },
      { header: 'Tipo referencia',   value: (m) => m.tipoReferencia ?? '' },
      { header: 'Observación',       value: (m) => m.observacion ?? '' },
    ]);
  }
}
