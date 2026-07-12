import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { MateriaPrimaService } from '../../services/materia-prima.service';
import { MovimientoMateriaService } from '../../services/movimiento-materia.service';
import {
  EstadoMateriaPrima,
  MateriaPrimaResponse,
} from '../../models/materia-prima.model';
import { debouncedSignal } from '../../../../shared/utils/debounce';
import { exportToCsv } from '../../../../shared/utils/export-csv';
import { RbacPipe } from '../../../../shared/pipes/rbac.pipe';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';

type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-materias-primas',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, RbacPipe, BreadcrumbComponent],
  templateUrl: './materias-primas.html',
})
export class MateriasPrimas implements OnInit {
  private readonly fb         = inject(FormBuilder);
  private readonly service    = inject(MateriaPrimaService);
  private readonly movService = inject(MovimientoMateriaService);
  private readonly router     = inject(Router);

  // ── Datos ──────────────────────────────────────────
  readonly loading = signal(true);
  readonly error   = signal<string | null>(null);
  readonly items   = signal<MateriaPrimaResponse[]>([]);
  readonly search  = signal('');
  readonly searchDebounced = debouncedSignal(this.search);
  readonly filtroEstado    = signal<string>('TODOS');

  // ── Ordenamiento ───────────────────────────────────
  readonly sortCol = signal('');
  readonly sortDir = signal<SortDir>('asc');

  // ── KPIs ───────────────────────────────────────────
  readonly totalActivas   = computed(() => this.items().filter((m) => m.estado === 'ACTIVO').length);
  readonly totalInactivas = computed(() => this.items().filter((m) => m.estado === 'INACTIVO').length);
  readonly totalAgotadas  = computed(() => this.items().filter((m) => m.estado === 'AGOTADO').length);
  readonly bajoMinimo     = computed(() =>
    this.items().filter((m) => m.estado === 'ACTIVO' && m.stockMinimo != null && m.stock <= m.stockMinimo).length
  );
  readonly kpiValorTotal = computed(() =>
    this.items().reduce((s, m) => s + (m.stock * m.costoUnitario), 0)
  );
  readonly kpiValorTexto = computed(() => {
    const v = this.kpiValorTotal();
    if (v >= 1_000_000) return `S/ ${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1000)      return `S/ ${(v / 1000).toFixed(1)}K`;
    return `S/ ${v.toFixed(2)}`;
  });

  // ── Lista filtrada + ordenada ─────────────────────
  readonly filtrados = computed(() => {
    const q      = this.searchDebounced().toLowerCase().trim();
    const estado = this.filtroEstado();
    const col    = this.sortCol();
    const dir    = this.sortDir();

    let list = this.items().filter((m) => {
      if (q && !m.nombre.toLowerCase().includes(q) && !m.unidadMedida.toLowerCase().includes(q)) return false;
      if (estado === 'BAJO_MINIMO') return m.estado === 'ACTIVO' && m.stockMinimo != null && m.stock <= m.stockMinimo;
      if (estado !== 'TODOS' && m.estado !== estado) return false;
      return true;
    });

    if (col) {
      list = [...list].sort((a, b) => {
        let va: string | number, vb: string | number;
        switch (col) {
          case 'nombre': va = a.nombre.toLowerCase();  vb = b.nombre.toLowerCase();  break;
          case 'stock':  va = a.stock;                 vb = b.stock;                 break;
          case 'costo':  va = a.costoUnitario;         vb = b.costoUnitario;         break;
          default: return 0;
        }
        if (va < vb) return dir === 'asc' ? -1 : 1;
        if (va > vb) return dir === 'asc' ?  1 : -1;
        return 0;
      });
    }
    return list;
  });

  // ── Modal crear/editar ─────────────────────────────
  readonly modalOpen  = signal(false);
  readonly saving     = signal(false);
  readonly formError  = signal<string | null>(null);
  readonly editId     = signal<string | null>(null);
  readonly editNombre = signal('');

  readonly form = this.fb.nonNullable.group({
    nombre:        ['', [Validators.required, Validators.maxLength(120)]],
    unidadMedida:  ['', [Validators.required, Validators.maxLength(20)]],
    stock:         [0 as number, [Validators.required, Validators.min(0)]],
    costoUnitario: [0 as number, [Validators.required, Validators.min(0)]],
    estado:        ['ACTIVO' as EstadoMateriaPrima, [Validators.required]],
    stockMinimo:   [null as number | null, [Validators.min(0)]],
    stockCritico:  [null as number | null, [Validators.min(0)]],
  });

  // ── Modal eliminar ─────────────────────────────────
  readonly deleteTarget = signal<MateriaPrimaResponse | null>(null);
  readonly deleting     = signal(false);
  readonly deleteError  = signal<string | null>(null);

  // ── Modal ajustar stock ────────────────────────────
  readonly ajusteTarget   = signal<MateriaPrimaResponse | null>(null);
  readonly ajusteTipo     = signal<'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO'>('AJUSTE_POSITIVO');
  readonly ajusteCantidad = signal<number>(0);
  readonly ajusteObs      = signal('');
  readonly savingAjuste   = signal(false);
  readonly errorAjuste    = signal<string | null>(null);

  readonly Math = Math;

  // ── Lifecycle ──────────────────────────────────────
  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.listar().subscribe({
      next:  (d) => { this.items.set(d); this.loading.set(false); },
      error: ()  => { this.error.set('No se pudieron cargar las materias primas.'); this.loading.set(false); },
    });
  }

  onSearch(e: Event): void { this.search.set((e.target as HTMLInputElement).value); }

  setFiltroEstado(v: string): void {
    this.filtroEstado.set(this.filtroEstado() === v ? 'TODOS' : v);
  }

  // ── Ordenamiento ───────────────────────────────────
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

  // ── Helpers visuales ───────────────────────────────
  estadoBadge(e: string): { label: string; classes: string } {
    if (e === 'ACTIVO')  return { label: 'Activo',   classes: 'bg-green-100 text-green-700' };
    if (e === 'AGOTADO') return { label: 'Agotado',  classes: 'bg-red-100 text-red-700' };
    return { label: 'Inactivo', classes: 'bg-gray-100 text-gray-500' };
  }

  stockLabel(v: number): string {
    return v.toFixed(3).replace(/\.?0+$/, '');
  }

  costoLabel(v: number): string {
    return `S/ ${v.toFixed(2)}`;
  }

  nivelStock(m: MateriaPrimaResponse): 'critico' | 'bajo' | 'normal' {
    if (m.stock <= 0) return 'critico';
    if (m.stockCritico != null && m.stock <= m.stockCritico) return 'critico';
    if (m.stockMinimo  != null && m.stock <= m.stockMinimo)  return 'bajo';
    return 'normal';
  }

  stockClass(m: MateriaPrimaResponse): string {
    const nivel = this.nivelStock(m);
    if (nivel === 'critico') return 'text-red-600 font-semibold';
    if (nivel === 'bajo')    return 'text-amber-600 font-semibold';
    return 'text-text-main';
  }

  // ── Navegación ─────────────────────────────────────
  verKardex(m: MateriaPrimaResponse): void {
    this.router.navigate(['/materia-prima', m.id, 'kardex']);
  }

  // ── Export ─────────────────────────────────────────
  exportar(): void {
    exportToCsv('materias-primas.csv', this.filtrados(), [
      { header: 'Nombre',        value: m => m.nombre },
      { header: 'Unidad',        value: m => m.unidadMedida },
      { header: 'Stock',         value: m => m.stock },
      { header: 'Costo unitario',value: m => m.costoUnitario },
      { header: 'Stock mínimo',  value: m => m.stockMinimo ?? '' },
      { header: 'Stock crítico', value: m => m.stockCritico ?? '' },
      { header: 'Estado',        value: m => m.estado },
    ]);
  }

  // ── CRUD ───────────────────────────────────────────
  abrirCrear(): void {
    this.editId.set(null);
    this.editNombre.set('');
    this.formError.set(null);
    this.form.reset({ nombre: '', unidadMedida: '', stock: 0, costoUnitario: 0, estado: 'ACTIVO', stockMinimo: null, stockCritico: null });
    this.form.controls.nombre.enable();
    this.form.controls.stock.enable();
    this.modalOpen.set(true);
  }

  abrirEditar(m: MateriaPrimaResponse): void {
    this.editId.set(m.id);
    this.editNombre.set(m.nombre);
    this.formError.set(null);
    this.form.reset({
      nombre:        m.nombre,
      unidadMedida:  m.unidadMedida,
      stock:         m.stock,
      costoUnitario: m.costoUnitario,
      estado:        (m.estado as EstadoMateriaPrima) ?? 'ACTIVO',
      stockMinimo:   m.stockMinimo ?? null,
      stockCritico:  m.stockCritico ?? null,
    });
    this.form.controls.nombre.disable();
    this.form.controls.stock.disable();
    this.modalOpen.set(true);
  }

  cerrarModal(): void { this.modalOpen.set(false); }

  guardar(): void {
    this.formError.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v  = this.form.getRawValue();
    const id = this.editId();

    const req$ = id
      ? this.service.actualizar(id, {
          unidadMedida:  v.unidadMedida,
          costoUnitario: v.costoUnitario,
          estado:        v.estado,
          stockMinimo:   v.stockMinimo,
          stockCritico:  v.stockCritico,
        })
      : this.service.crear({
          nombre:        v.nombre,
          unidadMedida:  v.unidadMedida,
          stock:         v.stock,
          costoUnitario: v.costoUnitario,
          estado:        v.estado,
          stockMinimo:   v.stockMinimo,
          stockCritico:  v.stockCritico,
        });

    req$.subscribe({
      next:  () => { this.saving.set(false); this.modalOpen.set(false); this.cargar(); },
      error: (err) => { this.saving.set(false); this.formError.set(err?.error?.message ?? 'No se pudo guardar.'); },
    });
  }

  // ── Ajuste rápido de stock ─────────────────────────
  abrirAjustarStock(m: MateriaPrimaResponse): void {
    this.ajusteTarget.set(m);
    this.ajusteTipo.set('AJUSTE_POSITIVO');
    this.ajusteCantidad.set(0);
    this.ajusteObs.set('');
    this.errorAjuste.set(null);
  }

  cerrarAjuste(): void { this.ajusteTarget.set(null); }

  guardarAjuste(): void {
    const m = this.ajusteTarget();
    const cantidad = this.ajusteCantidad();
    if (!m || cantidad <= 0 || this.savingAjuste()) return;
    this.savingAjuste.set(true);
    this.errorAjuste.set(null);
    this.movService.crear({
      materiaPrimaId: m.id,
      tipo: this.ajusteTipo(),
      cantidad,
      observacion: this.ajusteObs() || undefined,
    }).subscribe({
      next: () => { this.savingAjuste.set(false); this.ajusteTarget.set(null); this.cargar(); },
      error: (err) => {
        this.savingAjuste.set(false);
        this.errorAjuste.set(err?.error?.message ?? 'No se pudo registrar el ajuste.');
      },
    });
  }

  pedirEliminar(m: MateriaPrimaResponse): void { this.deleteError.set(null); this.deleteTarget.set(m); }
  cancelarEliminar(): void { this.deleteTarget.set(null); }

  confirmarEliminar(): void {
    const t = this.deleteTarget();
    if (!t) return;
    this.deleting.set(true);
    this.service.eliminar(t.id).subscribe({
      next: () => { this.deleting.set(false); this.deleteTarget.set(null); this.items.update((l) => l.filter((x) => x.id !== t.id)); },
      error: (err) => { this.deleting.set(false); this.deleteError.set(err?.error?.message ?? 'No se pudo eliminar la materia prima.'); },
    });
  }
}
