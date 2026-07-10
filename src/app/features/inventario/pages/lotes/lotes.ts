import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { LoteService } from '../../services/lote.service';
import { PresentacionService } from '../../services/presentacion.service';
import { AlmacenService } from '../../services/almacen.service';
import { LoteResponse } from '../../models/lote.model';
import { PresentacionResponse } from '../../models/presentacion.model';
import { AlmacenResponse } from '../../models/almacen.model';
import { debouncedSignal } from '../../../../shared/utils/debounce';
import { exportToCsv } from '../../../../shared/utils/export-csv';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-lotes',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, DatePipe, BreadcrumbComponent, EmptyState],
  templateUrl: './lotes.html',
})
export class Lotes implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(LoteService);
  private readonly presentacionService = inject(PresentacionService);
  private readonly almacenService = inject(AlmacenService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<LoteResponse[]>([]);
  readonly presentaciones = signal<PresentacionResponse[]>([]);
  readonly almacenes = signal<AlmacenResponse[]>([]);
  readonly search = signal('');
  readonly searchDebounced = debouncedSignal(this.search);

  readonly modalOpen = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly editId = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    presentacionProductoId: ['', [Validators.required]],
    almacenId: ['', [Validators.required]],
    codigoLote: ['', [Validators.required, Validators.maxLength(60)]],
    numeroLoteProveedor: ['', [Validators.maxLength(60)]],
    fechaFabricacion: [''],
    fechaIngreso: [''],
    fechaVencimiento: [''],
    stockLote: [0, [Validators.required, Validators.min(0.001)]],
    costoUnitario: [0, [Validators.required, Validators.min(0)]],
  });

  private hoyISO(): string {
    return new Date().toISOString().slice(0, 10);
  }

  readonly deleteTarget = signal<LoteResponse | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  readonly filtrados = computed(() => {
    const q = this.searchDebounced().toLowerCase().trim();
    const list = this.items();
    if (!q) return list;
    return list.filter(
      (l) =>
        l.codigoLote.toLowerCase().includes(q) ||
        (l.nombreProducto ?? '').toLowerCase().includes(q) ||
        (l.nombreAlmacen ?? '').toLowerCase().includes(q),
    );
  });

  readonly PAGE_SIZE    = 25;
  readonly pagina       = signal(0);
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / this.PAGE_SIZE)));
  readonly paginados    = computed(() => {
    const p = this.pagina();
    return this.filtrados().slice(p * this.PAGE_SIZE, (p + 1) * this.PAGE_SIZE);
  });

  constructor() {
    effect(() => {
      this.searchDebounced();
      this.pagina.set(0);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.cargar();
    this.presentacionService.listar().subscribe({
      next: (p) => this.presentaciones.set(p),
      error: () => this.presentaciones.set([]),
    });
    this.almacenService.listar().subscribe({
      next: (a) => this.almacenes.set(a),
      error: () => this.almacenes.set([]),
    });
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.listar().subscribe({
      next: (d) => {
        this.items.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los lotes.');
        this.loading.set(false);
      },
    });
  }

  onSearch(e: Event): void {
    this.search.set((e.target as HTMLInputElement).value);
  }

  generarCodigo(): void {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const rnd = Math.floor(100 + Math.random() * 900);
    this.form.controls.codigoLote.setValue(`L-${yy}${mm}${rnd}`);
  }

  abrirCrear(): void {
    this.editId.set(null);
    this.formError.set(null);
    this.form.reset({
      presentacionProductoId: '',
      almacenId: '',
      codigoLote: '',
      numeroLoteProveedor: '',
      fechaFabricacion: '',
      fechaIngreso: this.hoyISO(),
      fechaVencimiento: '',
      stockLote: 0,
      costoUnitario: 0,
    });
    this.modalOpen.set(true);
  }

  abrirEditar(l: LoteResponse): void {
    this.editId.set(l.id);
    this.formError.set(null);
    this.form.reset({
      presentacionProductoId: l.presentacionProductoId,
      almacenId: l.almacenId,
      codigoLote: l.codigoLote,
      numeroLoteProveedor: l.numeroLoteProveedor ?? '',
      fechaFabricacion: l.fechaFabricacion ?? '',
      fechaIngreso: l.fechaIngreso ?? '',
      fechaVencimiento: l.fechaVencimiento ?? '',
      stockLote: l.stockLote,
      costoUnitario: l.costoUnitario,
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
    this.saving.set(true);
    const v = this.form.getRawValue();
    const payload = {
      presentacionProductoId: v.presentacionProductoId,
      almacenId: v.almacenId,
      codigoLote: v.codigoLote,
      numeroLoteProveedor: v.numeroLoteProveedor || null,
      fechaFabricacion: v.fechaFabricacion || null,
      fechaIngreso: v.fechaIngreso || null,
      fechaVencimiento: v.fechaVencimiento || null,
      stockLote: v.stockLote,
      costoUnitario: v.costoUnitario,
    };
    const id = this.editId();
    const req$ = id ? this.service.actualizar(id, payload) : this.service.crear(payload);
    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.cargar();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.error?.message ?? 'No se pudo guardar el lote.');
      },
    });
  }

  pedirEliminar(l: LoteResponse): void {
    this.deleteError.set(null);
    this.deleteTarget.set(l);
  }
  cancelarEliminar(): void {
    this.deleteTarget.set(null);
  }
  confirmarEliminar(): void {
    const t = this.deleteTarget();
    if (!t) return;
    this.deleting.set(true);
    this.service.eliminar(t.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.items.update((l) => l.filter((x) => x.id !== t.id));
      },
      error: (err) => {
        this.deleting.set(false);
        this.deleteError.set(err?.error?.message ?? 'No se pudo eliminar el lote.');
      },
    });
  }

  /** Días hasta el vencimiento (null si no tiene fecha). */
  diasParaVencer(fecha?: string | null): number | null {
    if (!fecha) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const venc = new Date(fecha);
    return Math.round((venc.getTime() - hoy.getTime()) / 86400000);
  }

  /** Clasificación visual del lote, combinando estado real + vencimiento. */
  clasif(l: LoteResponse): 'vigente' | 'proximo' | 'vencido' | 'cuarentena' | 'bloqueado' | 'agotado' {
    const dias = this.diasParaVencer(l.fechaVencimiento);
    if (l.estado === 'VENCIDO' || (dias !== null && dias < 0)) return 'vencido';
    if (l.estado === 'EN_CUARENTENA') return 'cuarentena';
    if (l.estado === 'BLOQUEADO') return 'bloqueado';
    if (l.estado === 'AGOTADO' || l.estado === 'AGOTADO_MERMA') return 'agotado';
    if (dias !== null && dias <= 30) return 'proximo';
    return 'vigente';
  }

  estado(l: LoteResponse): { label: string; dot: string; classes: string } {
    switch (this.clasif(l)) {
      case 'vigente':
        return { label: 'Vigente', dot: 'bg-[#22C55E]', classes: 'bg-[#DCFCE7] text-[#15803D]' };
      case 'proximo':
        return { label: 'Próx. a vencer', dot: 'bg-[#F59E0B]', classes: 'bg-[#FEF3C7] text-[#B45309]' };
      case 'vencido':
        return { label: 'Vencido', dot: 'bg-[#EF4444]', classes: 'bg-[#FEE2E2] text-[#B91C1C]' };
      case 'cuarentena':
        return { label: 'En cuarentena', dot: 'bg-[#F59E0B]', classes: 'bg-[#FEF3C7] text-[#B45309]' };
      case 'bloqueado':
        return { label: 'Bloqueado', dot: 'bg-[#6B7280]', classes: 'bg-[#F3F4F6] text-[#6B7280]' };
      default:
        return { label: 'Agotado', dot: 'bg-[#9CA3AF]', classes: 'bg-[#F3F4F6] text-[#6B7280]' };
    }
  }

  /** Color del borde izquierdo de la fila según clasificación. */
  borde(l: LoteResponse): string {
    switch (this.clasif(l)) {
      case 'vigente':
        return 'border-l-[#22C55E]';
      case 'proximo':
      case 'cuarentena':
        return 'border-l-[#F59E0B]';
      case 'vencido':
        return 'border-l-[#EF4444]';
      default:
        return 'border-l-[#E5E7EB]';
    }
  }

  // --- KPIs ---
  readonly kpiVigentes = computed(() => this.items().filter((l) => this.clasif(l) === 'vigente').length);
  readonly kpiProximos = computed(() => this.items().filter((l) => this.clasif(l) === 'proximo').length);
  readonly kpiVencidos = computed(() => this.items().filter((l) => this.clasif(l) === 'vencido').length);
  readonly kpiValor = computed(() =>
    this.items().reduce((s, l) => s + (Number(l.stockLote) || 0) * (Number(l.costoUnitario) || 0), 0),
  );
  readonly kpiValorTexto = computed(() => {
    const v = this.kpiValor();
    if (v >= 1_000_000) return `S/ ${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1000) return `S/ ${(v / 1000).toFixed(1)}K`;
    return `S/ ${v.toFixed(2)}`;
  });

  exportar(): void {
    exportToCsv('lotes.csv', this.filtrados(), [
      { header: 'Código lote',        value: (l) => l.codigoLote },
      { header: 'Producto',           value: (l) => l.nombreProducto },
      { header: 'Almacén',            value: (l) => l.nombreAlmacen },
      { header: 'Stock',              value: (l) => l.stockLote },
      { header: 'Costo unitario',     value: (l) => l.costoUnitario },
      { header: 'Estado',             value: (l) => l.estado },
      { header: 'Fecha ingreso',      value: (l) => l.fechaIngreso ?? '' },
      { header: 'Fecha vencimiento',  value: (l) => l.fechaVencimiento ?? '' },
    ]);
  }
}
