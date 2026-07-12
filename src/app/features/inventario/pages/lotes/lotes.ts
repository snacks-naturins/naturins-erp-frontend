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

type SortDir = 'asc' | 'desc';
type Clasif  = 'vigente' | 'proximo' | 'vencido' | 'cuarentena' | 'bloqueado' | 'agotado';

@Component({
  selector: 'app-lotes',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, DatePipe, BreadcrumbComponent, EmptyState],
  templateUrl: './lotes.html',
})
export class Lotes implements OnInit {
  private readonly fb                  = inject(FormBuilder);
  private readonly service             = inject(LoteService);
  private readonly presentacionService = inject(PresentacionService);
  private readonly almacenService      = inject(AlmacenService);

  // ── Datos ─────────────────────────────────────────
  readonly loading       = signal(true);
  readonly error         = signal<string | null>(null);
  readonly items         = signal<LoteResponse[]>([]);
  readonly presentaciones = signal<PresentacionResponse[]>([]);
  readonly almacenes      = signal<AlmacenResponse[]>([]);

  // ── Filtros ───────────────────────────────────────
  readonly search          = signal('');
  readonly searchDebounced = debouncedSignal(this.search);
  readonly filtroClasif    = signal('');   // 'vigente'|'proximo'|'vencido'|...
  readonly filtroAlmacen   = signal('');   // almacenId UUID

  // ── Ordenamiento ─────────────────────────────────
  readonly sortCol = signal('');
  readonly sortDir = signal<SortDir>('asc');

  // ── Paginación ───────────────────────────────────
  readonly pagina   = signal(0);
  readonly pageSize = signal(25);

  // ── Modales ──────────────────────────────────────
  readonly modalOpen  = signal(false);
  readonly saving     = signal(false);
  readonly formError  = signal<string | null>(null);
  readonly editId     = signal<string | null>(null);

  readonly deleteTarget = signal<LoteResponse | null>(null);
  readonly deleting     = signal(false);
  readonly deleteError  = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    presentacionProductoId: ['', [Validators.required]],
    almacenId:              ['', [Validators.required]],
    codigoLote:             ['', [Validators.required, Validators.maxLength(60)]],
    numeroLoteProveedor:    ['', [Validators.maxLength(60)]],
    fechaFabricacion:       [''],
    fechaIngreso:           [''],
    fechaVencimiento:       [''],
    stockLote:              [0, [Validators.required, Validators.min(0.001)]],
    costoUnitario:          [0, [Validators.required, Validators.min(0)]],
  });

  // ── KPIs ─────────────────────────────────────────
  readonly kpiVigentes = computed(() => this.items().filter(l => this.clasif(l) === 'vigente').length);
  readonly kpiProximos = computed(() => this.items().filter(l => this.clasif(l) === 'proximo').length);
  readonly kpiVencidos = computed(() => this.items().filter(l => this.clasif(l) === 'vencido').length);
  readonly kpiValor    = computed(() =>
    this.items().reduce((s, l) => s + (Number(l.stockLote) || 0) * (Number(l.costoUnitario) || 0), 0)
  );
  readonly kpiValorTexto = computed(() => {
    const v = this.kpiValor();
    if (v >= 1_000_000) return `S/ ${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1000)      return `S/ ${(v / 1000).toFixed(1)}K`;
    return `S/ ${v.toFixed(2)}`;
  });

  // ── Lista filtrada + ordenada ─────────────────────
  readonly filtrados = computed(() => {
    const q    = this.searchDebounced().toLowerCase().trim();
    const clas = this.filtroClasif();
    const alm  = this.filtroAlmacen();
    const col  = this.sortCol();
    const dir  = this.sortDir();

    let list = this.items().filter(l => {
      if (q && !l.codigoLote.toLowerCase().includes(q) &&
          !(l.nombreProducto ?? '').toLowerCase().includes(q) &&
          !(l.nombreAlmacen  ?? '').toLowerCase().includes(q)) return false;
      if (clas && this.clasif(l) !== clas) return false;
      if (alm  && l.almacenId  !== alm)   return false;
      return true;
    });

    if (col) {
      list = [...list].sort((a, b) => {
        let va: string | number, vb: string | number;
        switch (col) {
          case 'codigo':   va = a.codigoLote.toLowerCase();                  vb = b.codigoLote.toLowerCase();                  break;
          case 'producto': va = (a.nombreProducto ?? '').toLowerCase();      vb = (b.nombreProducto ?? '').toLowerCase();      break;
          case 'almacen':  va = (a.nombreAlmacen  ?? '').toLowerCase();      vb = (b.nombreAlmacen  ?? '').toLowerCase();      break;
          case 'ingreso':  va = a.fechaIngreso ?? '';                        vb = b.fechaIngreso ?? '';                        break;
          case 'vence':    va = a.fechaVencimiento ?? '';                    vb = b.fechaVencimiento ?? '';                    break;
          case 'costo':    va = Number(a.costoUnitario) || 0;                vb = Number(b.costoUnitario) || 0;                break;
          case 'stock':    va = Number(a.stockLote) || 0;                    vb = Number(b.stockLote) || 0;                    break;
          default: return 0;
        }
        if (va < vb) return dir === 'asc' ? -1 : 1;
        if (va > vb) return dir === 'asc' ?  1 : -1;
        return 0;
      });
    }
    return list;
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
      this.searchDebounced(); this.filtroClasif(); this.filtroAlmacen(); this.pageSize();
      this.pagina.set(0);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.cargar();
    this.presentacionService.listar().subscribe({
      next: p => this.presentaciones.set(p),
      error: () => this.presentaciones.set([]),
    });
    this.almacenService.listar().subscribe({
      next: a => this.almacenes.set(a),
      error: () => this.almacenes.set([]),
    });
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.listar().subscribe({
      next: d => { this.items.set(d); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar los lotes.'); this.loading.set(false); },
    });
  }

  onSearch(e: Event): void { this.search.set((e.target as HTMLInputElement).value); }

  // ── Filtro KPI ────────────────────────────────────
  filtrarPorClasif(valor: string): void {
    this.filtroClasif.set(this.filtroClasif() === valor ? '' : valor);
  }

  // ── Ordenamiento ─────────────────────────────────
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

  // ── Helpers ───────────────────────────────────────
  diasParaVencer(fecha?: string | null): number | null {
    if (!fecha) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return Math.round((new Date(fecha).getTime() - hoy.getTime()) / 86400000);
  }

  clasif(l: LoteResponse): Clasif {
    const dias = this.diasParaVencer(l.fechaVencimiento);
    if (l.estado === 'VENCIDO'       || (dias !== null && dias < 0))  return 'vencido';
    if (l.estado === 'EN_CUARENTENA')                                  return 'cuarentena';
    if (l.estado === 'BLOQUEADO')                                      return 'bloqueado';
    if (l.estado === 'AGOTADO'       || l.estado === 'AGOTADO_MERMA') return 'agotado';
    if (dias !== null && dias <= 30)                                   return 'proximo';
    return 'vigente';
  }

  estado(l: LoteResponse): { label: string; dot: string; classes: string } {
    switch (this.clasif(l)) {
      case 'vigente':    return { label: 'Vigente',        dot: 'bg-green-500', classes: 'bg-green-100 text-green-700' };
      case 'proximo':    return { label: 'Próx. a vencer', dot: 'bg-amber-500', classes: 'bg-amber-100 text-amber-700' };
      case 'vencido':    return { label: 'Vencido',        dot: 'bg-red-500',   classes: 'bg-red-100 text-red-700' };
      case 'cuarentena': return { label: 'En cuarentena',  dot: 'bg-amber-500', classes: 'bg-amber-100 text-amber-700' };
      case 'bloqueado':  return { label: 'Bloqueado',      dot: 'bg-gray-400',  classes: 'bg-gray-100 text-gray-600' };
      default:           return { label: 'Agotado',        dot: 'bg-gray-400',  classes: 'bg-gray-100 text-gray-600' };
    }
  }

  borde(l: LoteResponse): string {
    switch (this.clasif(l)) {
      case 'vigente':    return 'border-l-green-400';
      case 'proximo':
      case 'cuarentena': return 'border-l-amber-400';
      case 'vencido':    return 'border-l-red-400';
      default:           return 'border-l-border-soft';
    }
  }

  diasBadge(l: LoteResponse): { texto: string; clase: string } | null {
    const dias = this.diasParaVencer(l.fechaVencimiento);
    if (dias === null)  return null;
    if (dias < 0)       return { texto: `Hace ${Math.abs(dias)}d`,    clase: 'text-red-500' };
    if (dias === 0)     return { texto: 'Vence hoy',                  clase: 'font-semibold text-red-600' };
    if (dias <= 7)      return { texto: `Vence en ${dias}d`,          clase: 'text-red-500' };
    if (dias <= 30)     return { texto: `Vence en ${dias}d`,          clase: 'text-amber-600' };
    return null;
  }

  // ── CRUD ─────────────────────────────────────────
  private hoyISO(): string { return new Date().toISOString().slice(0, 10); }

  generarCodigo(): void {
    const d   = new Date();
    const yy  = String(d.getFullYear()).slice(2);
    const mm  = String(d.getMonth() + 1).padStart(2, '0');
    const rnd = Math.floor(100 + Math.random() * 900);
    this.form.controls.codigoLote.setValue(`L-${yy}${mm}${rnd}`);
  }

  abrirCrear(): void {
    this.editId.set(null);
    this.formError.set(null);
    this.form.reset({
      presentacionProductoId: '', almacenId: '', codigoLote: '',
      numeroLoteProveedor: '', fechaFabricacion: '',
      fechaIngreso: this.hoyISO(), fechaVencimiento: '',
      stockLote: 0, costoUnitario: 0,
    });
    this.modalOpen.set(true);
  }

  abrirEditar(l: LoteResponse): void {
    this.editId.set(l.id);
    this.formError.set(null);
    this.form.reset({
      presentacionProductoId: l.presentacionProductoId,
      almacenId:              l.almacenId,
      codigoLote:             l.codigoLote,
      numeroLoteProveedor:    l.numeroLoteProveedor ?? '',
      fechaFabricacion:       l.fechaFabricacion    ?? '',
      fechaIngreso:           l.fechaIngreso        ?? '',
      fechaVencimiento:       l.fechaVencimiento    ?? '',
      stockLote:              l.stockLote,
      costoUnitario:          l.costoUnitario,
    });
    this.modalOpen.set(true);
  }

  cerrarModal(): void { this.modalOpen.set(false); }

  guardar(): void {
    this.formError.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const payload = {
      presentacionProductoId: v.presentacionProductoId,
      almacenId:              v.almacenId,
      codigoLote:             v.codigoLote,
      numeroLoteProveedor:    v.numeroLoteProveedor || null,
      fechaFabricacion:       v.fechaFabricacion    || null,
      fechaIngreso:           v.fechaIngreso        || null,
      fechaVencimiento:       v.fechaVencimiento    || null,
      stockLote:              v.stockLote,
      costoUnitario:          v.costoUnitario,
    };
    const id   = this.editId();
    const req$ = id ? this.service.actualizar(id, payload) : this.service.crear(payload);
    req$.subscribe({
      next: () => { this.saving.set(false); this.modalOpen.set(false); this.cargar(); },
      error: err => { this.saving.set(false); this.formError.set(err?.error?.message ?? 'No se pudo guardar el lote.'); },
    });
  }

  pedirEliminar(l: LoteResponse): void { this.deleteError.set(null); this.deleteTarget.set(l); }
  cancelarEliminar(): void { this.deleteTarget.set(null); }
  confirmarEliminar(): void {
    const t = this.deleteTarget();
    if (!t) return;
    this.deleting.set(true);
    this.service.eliminar(t.id).subscribe({
      next: () => { this.deleting.set(false); this.deleteTarget.set(null); this.items.update(l => l.filter(x => x.id !== t.id)); },
      error: err => { this.deleting.set(false); this.deleteError.set(err?.error?.message ?? 'No se pudo eliminar el lote.'); },
    });
  }

  exportar(): void {
    exportToCsv('lotes.csv', this.filtrados(), [
      { header: 'Código lote',       value: l => l.codigoLote },
      { header: 'Producto',          value: l => l.nombreProducto },
      { header: 'Almacén',           value: l => l.nombreAlmacen },
      { header: 'Stock',             value: l => l.stockLote },
      { header: 'Costo unitario',    value: l => l.costoUnitario },
      { header: 'Estado',            value: l => l.estado },
      { header: 'Fecha ingreso',     value: l => l.fechaIngreso     ?? '' },
      { header: 'Fecha vencimiento', value: l => l.fechaVencimiento ?? '' },
    ]);
  }
}
