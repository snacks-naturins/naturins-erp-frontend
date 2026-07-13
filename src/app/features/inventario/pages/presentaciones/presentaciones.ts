import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { PresentacionService } from '../../services/presentacion.service';
import { ProductoService } from '../../services/producto.service';
import { PresentacionResponse, EstadoPresentacion } from '../../models/presentacion.model';
import { ProductoResponse } from '../../models/producto.model';
import { debouncedSignal } from '../../../../shared/utils/debounce';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';

type SortDir = 'asc' | 'desc';
interface EstadoView { label: string; dot: string; classes: string; }

@Component({
  selector: 'app-presentaciones',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, BreadcrumbComponent, EmptyState],
  templateUrl: './presentaciones.html',
})
export class Presentaciones implements OnInit {
  private readonly fb             = inject(FormBuilder);
  private readonly service        = inject(PresentacionService);
  private readonly productoService = inject(ProductoService);

  // ── Datos ─────────────────────────────────────────
  readonly loading  = signal(true);
  readonly error    = signal<string | null>(null);
  readonly items    = signal<PresentacionResponse[]>([]);
  readonly productos = signal<ProductoResponse[]>([]);

  // ── Filtros ───────────────────────────────────────
  readonly search          = signal('');
  readonly searchDebounced = debouncedSignal(this.search);
  readonly filtroEstado    = signal('');

  // ── Ordenamiento ─────────────────────────────────
  readonly sortCol = signal('');
  readonly sortDir = signal<SortDir>('asc');

  // ── Paginación ───────────────────────────────────
  readonly pagina   = signal(0);
  readonly pageSize = signal(20);

  // ── Modales ──────────────────────────────────────
  readonly modalOpen  = signal(false);
  readonly saving     = signal(false);
  readonly formError  = signal<string | null>(null);
  readonly editId     = signal<string | null>(null);

  readonly deleteTarget = signal<PresentacionResponse | null>(null);
  readonly deleting     = signal(false);
  readonly deleteError  = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    productoId:       ['', [Validators.required]],
    nombre:           ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    peso:             [null as number | null, [Validators.min(0.001)]],
    unidadMedida:     ['g'],
    factorConversion: [1, [Validators.required, Validators.min(0.001)]],
    precioVenta:      [null as number | null, [Validators.required, Validators.min(0.01)]],
    estado:           ['ACTIVO' as EstadoPresentacion, [Validators.required]],
  });

  // ── Producto search dropdown ──────────────────────
  readonly productoSearch       = signal('');
  readonly productoDropdown     = signal(false);
  readonly productoIdSignal     = signal('');
  readonly productoSeleccionado = computed(() =>
    this.productos().find(p => p.id === this.productoIdSignal()) ?? null
  );
  readonly productosFiltrados = computed(() => {
    const q = this.productoSearch().toLowerCase().trim();
    return q
      ? this.productos().filter(p => p.nombre.toLowerCase().includes(q) || (p.nombreCategoria ?? '').toLowerCase().includes(q))
      : this.productos();
  });

  // ── Mapa id → producto ────────────────────────────
  readonly productosMap = computed(() => new Map(this.productos().map(p => [p.id, p])));

  // ── KPIs ─────────────────────────────────────────
  readonly kpiTotal          = computed(() => this.items().length);
  readonly kpiActivas        = computed(() => this.items().filter(p => p.estado === 'ACTIVO').length);
  readonly kpiDescontinuadas = computed(() => this.items().filter(p => p.estado === 'DESCONTINUADO').length);
  readonly kpiProximamente   = computed(() => this.items().filter(p => p.estado === 'PROXIMAMENTE').length);

  // ── Lista filtrada + ordenada ─────────────────────
  readonly filtrados = computed(() => {
    const q   = this.searchDebounced().toLowerCase().trim();
    const est = this.filtroEstado();
    const col = this.sortCol();
    const dir = this.sortDir();

    let list = this.items().filter(p => {
      if (q && !p.nombre.toLowerCase().includes(q) && !(p.nombreProducto ?? '').toLowerCase().includes(q)) return false;
      if (est && p.estado !== est) return false;
      return true;
    });

    if (col) {
      list = [...list].sort((a, b) => {
        let va: string | number, vb: string | number;
        switch (col) {
          case 'nombre':   va = a.nombre.toLowerCase();                 vb = b.nombre.toLowerCase();                 break;
          case 'producto': va = (a.nombreProducto ?? '').toLowerCase(); vb = (b.nombreProducto ?? '').toLowerCase(); break;
          case 'precio':   va = a.precioVenta;                          vb = b.precioVenta;                          break;
          case 'peso':     va = a.peso ?? 0;                            vb = b.peso ?? 0;                            break;
          default: return 0;
        }
        if (va < vb) return dir === 'asc' ? -1 : 1;
        if (va > vb) return dir === 'asc' ?  1 : -1;
        return 0;
      });
    }
    return list;
  });

  readonly totalPaginas   = computed(() => Math.max(1, Math.ceil(this.filtrados().length / this.pageSize())));
  readonly paginados      = computed(() => {
    const p  = this.pagina();
    const ps = this.pageSize();
    return this.filtrados().slice(p * ps, (p + 1) * ps);
  });
  readonly paginacionFin  = computed(() => Math.min((this.pagina() + 1) * this.pageSize(), this.filtrados().length));

  constructor() {
    effect(() => {
      this.searchDebounced(); this.filtroEstado(); this.pageSize();
      this.pagina.set(0);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.cargar();
    this.productoService.listar().subscribe({
      next: p => this.productos.set(p),
      error: () => this.productos.set([]),
    });
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.listar().subscribe({
      next: d => { this.items.set(d); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar las presentaciones.'); this.loading.set(false); },
    });
  }

  onSearch(e: Event): void { this.search.set((e.target as HTMLInputElement).value); }

  // ── Helpers ───────────────────────────────────────
  productoDe(p: PresentacionResponse): ProductoResponse | null {
    return this.productosMap().get(p.productoId) ?? null;
  }

  margenDe(p: PresentacionResponse): number | null {
    const prod = this.productoDe(p);
    if (!prod?.precioCompra || prod.precioCompra <= 0 || p.precioVenta <= 0) return null;
    return Math.round(((p.precioVenta - prod.precioCompra) / p.precioVenta) * 100);
  }

  setFiltroEstado(v: string): void {
    this.filtroEstado.set(this.filtroEstado() === v ? '' : v);
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

  estado(e: string): EstadoView {
    switch (e) {
      case 'ACTIVO':        return { label: 'Activo',        dot: 'bg-green-500', classes: 'bg-green-100 text-green-700' };
      case 'DESCONTINUADO': return { label: 'Descontinuado', dot: 'bg-red-500',   classes: 'bg-red-100 text-red-700' };
      case 'PROXIMAMENTE':  return { label: 'Próximamente',  dot: 'bg-blue-500',  classes: 'bg-blue-100 text-blue-700' };
      default:              return { label: 'Inactivo',      dot: 'bg-gray-400',  classes: 'bg-gray-100 text-gray-600' };
    }
  }

  // ── Producto dropdown ─────────────────────────────
  seleccionarProducto(p: ProductoResponse): void {
    this.form.controls.productoId.setValue(p.id);
    this.productoIdSignal.set(p.id);
    this.productoSearch.set('');
    this.productoDropdown.set(false);
  }

  limpiarProducto(): void {
    this.form.controls.productoId.setValue('');
    this.productoIdSignal.set('');
  }

  recalcularFactor(): void {
    const peso   = this.form.controls.peso.value;
    const unidad = this.form.controls.unidadMedida.value;
    if (peso === null || peso <= 0) return;
    let fc = 1;
    switch (unidad) {
      case 'g':      fc = +(peso / 1000).toFixed(5); break;
      case 'kg':     fc = +peso.toFixed(5);           break;
      case 'mL':     fc = +(peso / 1000).toFixed(5); break;
      case 'L':      fc = +peso.toFixed(5);           break;
      case 'unidad': fc = 1;                          break;
      default:       fc = +peso.toFixed(5);
    }
    this.form.controls.factorConversion.setValue(fc);
  }

  unidadBase(): string {
    const u = this.form.controls.unidadMedida.value;
    return (u === 'L' || u === 'mL') ? 'L' : 'kg';
  }

  // ── CRUD ─────────────────────────────────────────
  abrirCrear(): void {
    this.editId.set(null);
    this.formError.set(null);
    this.productoSearch.set('');
    this.productoDropdown.set(false);
    this.productoIdSignal.set('');
    this.form.reset({ productoId: '', nombre: '', peso: null, unidadMedida: 'g', factorConversion: 1, precioVenta: null, estado: 'ACTIVO' });
    this.form.controls.productoId.enable();
    this.modalOpen.set(true);
  }

  abrirEditar(p: PresentacionResponse): void {
    this.editId.set(p.id);
    this.formError.set(null);
    this.productoSearch.set('');
    this.productoDropdown.set(false);
    this.productoIdSignal.set(p.productoId);
    this.form.reset({
      productoId:       p.productoId,
      nombre:           p.nombre,
      peso:             p.peso ?? null,
      unidadMedida:     p.unidadMedida ?? 'g',
      factorConversion: p.factorConversion,
      precioVenta:      p.precioVenta,
      estado:           (p.estado as EstadoPresentacion) ?? 'ACTIVO',
    });
    this.form.controls.productoId.disable();
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
          nombre: v.nombre, factorConversion: v.factorConversion,
          precioVenta: v.precioVenta!, peso: v.peso ?? null,
          unidadMedida: v.unidadMedida || null, estado: v.estado,
        })
      : this.service.crear({
          productoId: v.productoId, nombre: v.nombre,
          factorConversion: v.factorConversion, precioVenta: v.precioVenta!,
          peso: v.peso ?? null, unidadMedida: v.unidadMedida || null, estado: v.estado,
        });
    req$.subscribe({
      next: () => { this.saving.set(false); this.modalOpen.set(false); this.cargar(); },
      error: err => { this.saving.set(false); this.formError.set(err?.error?.message ?? 'No se pudo guardar la presentación.'); },
    });
  }

  pedirEliminar(p: PresentacionResponse): void { this.deleteError.set(null); this.deleteTarget.set(p); }
  cancelarEliminar(): void { this.deleteTarget.set(null); }
  confirmarEliminar(): void {
    const t = this.deleteTarget();
    if (!t) return;
    this.deleting.set(true);
    this.service.eliminar(t.id).subscribe({
      next: () => { this.deleting.set(false); this.deleteTarget.set(null); this.items.update(l => l.filter(x => x.id !== t.id)); },
      error: err => { this.deleting.set(false); this.deleteError.set(err?.error?.message ?? 'No se pudo eliminar la presentación.'); },
    });
  }
}
