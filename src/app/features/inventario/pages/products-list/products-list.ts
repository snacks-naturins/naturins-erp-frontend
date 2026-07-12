import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { ProductoService } from '../../services/producto.service';
import { PresentacionService } from '../../services/presentacion.service';
import { LoteService } from '../../services/lote.service';
import { CategoriaService } from '../../services/categoria.service';
import { ProductoResponse } from '../../models/producto.model';
import { PresentacionResponse } from '../../models/presentacion.model';
import { LoteResponse } from '../../models/lote.model';
import { CategoriaResponse } from '../../models/categoria.model';
import { debouncedSignal } from '../../../../shared/utils/debounce';
import { exportToCsv } from '../../../../shared/utils/export-csv';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { RbacPipe } from '../../../../shared/pipes/rbac.pipe';

interface EstadoView { label: string; dot: string; classes: string; }
interface StockInfo  { stock: number; lotes: number; vencido: boolean; proxVence: boolean; }
interface StockBadge { label: string; text: string; bg: string; }

type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [RouterLink, MatIconModule, BreadcrumbComponent, EmptyState, RbacPipe],
  templateUrl: './products-list.html',
})
export class ProductList implements OnInit {
  private readonly productoService    = inject(ProductoService);
  private readonly presentacionService = inject(PresentacionService);
  private readonly loteService        = inject(LoteService);
  private readonly categoriaService   = inject(CategoriaService);
  private readonly router             = inject(Router);

  // ── Datos ──────────────────────────────────────────
  readonly loading        = signal(true);
  readonly error          = signal<string | null>(null);
  readonly productos      = signal<ProductoResponse[]>([]);
  readonly presentaciones = signal<PresentacionResponse[]>([]);
  readonly lotes          = signal<LoteResponse[]>([]);
  readonly categorias     = signal<CategoriaResponse[]>([]);

  // ── Filtros y vista ────────────────────────────────
  readonly search          = signal('');
  readonly searchDebounced = debouncedSignal(this.search);
  readonly filtroCategoria = signal('');
  readonly filtroEstado    = signal('');
  readonly filtroStock     = signal('');
  readonly vistaGrid       = signal(false);

  // ── Ordenamiento ───────────────────────────────────
  readonly sortCol = signal('');
  readonly sortDir = signal<SortDir>('asc');

  // ── Paginación ────────────────────────────────────
  readonly pagina   = signal(0);
  readonly pageSize = signal(20);

  // ── Modales ───────────────────────────────────────
  readonly verTarget      = signal<ProductoResponse | null>(null);
  readonly eliminarTarget = signal<ProductoResponse | null>(null);
  readonly eliminando     = signal(false);
  readonly eliminarError  = signal<string | null>(null);

  // ── Mapas derivados ───────────────────────────────
  readonly catColorMap = computed(() =>
    new Map(this.categorias().map(c => [c.id, c.colorInterfaz ?? '#6b7280']))
  );

  readonly categoriasDisponibles = computed(() =>
    [...new Set(this.productos().map(p => p.categoriaId ? (p.nombreCategoria ?? '') : '').filter(Boolean))].sort()
  );

  readonly stockMap = computed(() => {
    const presToProd = new Map<string, string>();
    for (const p of this.presentaciones()) presToProd.set(p.id, p.productoId);

    const map = new Map<string, StockInfo>();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    for (const l of this.lotes()) {
      const prodId = presToProd.get(l.presentacionProductoId);
      if (!prodId) continue;
      const info = map.get(prodId) ?? { stock: 0, lotes: 0, vencido: false, proxVence: false };
      info.stock += Number(l.stockLote) || 0;
      info.lotes += 1;
      if (l.fechaVencimiento) {
        const dias = Math.round((new Date(l.fechaVencimiento).getTime() - hoy.getTime()) / 86400000);
        if (dias < 0) info.vencido = true;
        else if (dias <= 30) info.proxVence = true;
      }
      map.set(prodId, info);
    }
    return map;
  });

  // ── KPIs de alertas ───────────────────────────────
  readonly kpiSinStock = computed(() =>
    this.productos().filter(p => this.stockDe(p.id).stock === 0).length
  );
  readonly kpiCritico = computed(() =>
    this.productos().filter(p => {
      const s = this.stockDe(p.id);
      return s.stock > 0 && p.stockCritico != null && s.stock <= p.stockCritico;
    }).length
  );
  readonly kpiBajo = computed(() =>
    this.productos().filter(p => {
      const s = this.stockDe(p.id);
      return s.stock > 0 && p.stockMinimo != null && s.stock <= p.stockMinimo &&
             !(p.stockCritico != null && s.stock <= p.stockCritico);
    }).length
  );
  readonly kpiVencePronto = computed(() =>
    this.productos().filter(p => { const s = this.stockDe(p.id); return s.proxVence && !s.vencido; }).length
  );

  // ── Lista filtrada + ordenada ─────────────────────
  readonly filtrados = computed(() => {
    const q   = this.searchDebounced().toLowerCase().trim();
    const cat = this.filtroCategoria();
    const est = this.filtroEstado();
    const stk = this.filtroStock();
    const col = this.sortCol();
    const dir = this.sortDir();

    let list = this.productos().filter(p => {
      if (q && !p.nombre.toLowerCase().includes(q) && !(p.nombreCategoria ?? '').toLowerCase().includes(q)) return false;
      if (cat && (p.nombreCategoria ?? '') !== cat) return false;
      if (est && p.estado !== est) return false;
      if (stk) {
        const info = this.stockDe(p.id);
        switch (stk) {
          case 'SIN_STOCK':    if (info.stock !== 0) return false; break;
          case 'CRITICO':      if (!(info.stock > 0 && p.stockCritico != null && info.stock <= p.stockCritico)) return false; break;
          case 'BAJO':         if (!(info.stock > 0 && p.stockMinimo != null && info.stock <= p.stockMinimo && !(p.stockCritico != null && info.stock <= p.stockCritico))) return false; break;
          case 'VENCE_PRONTO': if (!info.proxVence || info.vencido) return false; break;
          case 'VENCIDO':      if (!info.vencido) return false; break;
        }
      }
      return true;
    });

    if (col) {
      list = [...list].sort((a, b) => {
        let va: string | number, vb: string | number;
        switch (col) {
          case 'nombre':    va = a.nombre.toLowerCase();              vb = b.nombre.toLowerCase(); break;
          case 'categoria': va = (a.nombreCategoria ?? '').toLowerCase(); vb = (b.nombreCategoria ?? '').toLowerCase(); break;
          case 'stock':     va = this.stockDe(a.id).stock;            vb = this.stockDe(b.id).stock; break;
          case 'precio':    va = a.precioCompra ?? 0;                 vb = b.precioCompra ?? 0; break;
          default: return 0;
        }
        if (va < vb) return dir === 'asc' ? -1 : 1;
        if (va > vb) return dir === 'asc' ?  1 : -1;
        return 0;
      });
    }
    return list;
  });

  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / this.pageSize())));
  readonly paginados    = computed(() => {
    const p  = this.pagina();
    const ps = this.pageSize();
    return this.filtrados().slice(p * ps, (p + 1) * ps);
  });
  readonly totalCategorias = computed(() => new Set(this.productos().map(p => p.categoriaId)).size);

  constructor() {
    effect(() => {
      this.searchDebounced(); this.filtroCategoria(); this.filtroEstado(); this.filtroStock(); this.pageSize();
      this.pagina.set(0);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.productoService.listar().subscribe({
      next: d => { this.productos.set(d); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar los productos.'); this.loading.set(false); },
    });
    this.presentacionService.listar().subscribe({ next: p => this.presentaciones.set(p), error: () => this.presentaciones.set([]) });
    this.loteService.listar().subscribe({ next: l => this.lotes.set(l), error: () => this.lotes.set([]) });
    this.categoriaService.listar().subscribe({ next: c => this.categorias.set(c), error: () => this.categorias.set([]) });
  }

  // ── Helpers ──────────────────────────────────────
  stockDe(productoId: string): StockInfo {
    return this.stockMap().get(productoId) ?? { stock: 0, lotes: 0, vencido: false, proxVence: false };
  }

  onSearch(event: Event): void { this.search.set((event.target as HTMLInputElement).value); }

  codigo(p: ProductoResponse): string {
    return 'SNK-' + (p.id ?? '').replace(/-/g, '').slice(0, 6).toUpperCase();
  }

  estado(e: string): EstadoView {
    switch (e) {
      case 'ACTIVO':        return { label: 'Activo',        dot: 'bg-green-500', classes: 'bg-green-100 text-green-700' };
      case 'DESCONTINUADO': return { label: 'Descontinuado', dot: 'bg-red-500',   classes: 'bg-red-100 text-red-700' };
      default:              return { label: 'Inactivo',      dot: 'bg-gray-400',  classes: 'bg-gray-100 text-gray-600' };
    }
  }

  catColor(categoriaId: string): string { return this.catColorMap().get(categoriaId) ?? '#6b7280'; }

  catChipStyle(categoriaId: string): string {
    const c = this.catColor(categoriaId);
    return `border-color:${c}55;background-color:${c}18;color:${c}`;
  }

  catDotStyle(categoriaId: string): string { return `background-color:${this.catColor(categoriaId)}`; }

  stockBadge(p: ProductoResponse): StockBadge {
    const info = this.stockDe(p.id);
    if (info.stock === 0)                                           return { label: 'Sin stock',    text: 'text-red-700',    bg: 'bg-red-100' };
    if (info.vencido)                                               return { label: 'Lote vencido', text: 'text-red-700',    bg: 'bg-red-100' };
    if (p.stockCritico != null && info.stock <= p.stockCritico)    return { label: 'Crítico',      text: 'text-orange-700', bg: 'bg-orange-100' };
    if (info.proxVence)                                             return { label: 'Vence pronto', text: 'text-amber-700',  bg: 'bg-amber-100' };
    if (p.stockMinimo  != null && info.stock <= p.stockMinimo)     return { label: 'Stock bajo',   text: 'text-yellow-700', bg: 'bg-yellow-100' };
    return { label: 'En stock', text: 'text-green-700', bg: 'bg-green-100' };
  }

  // ── Filtro rápido por KPI ─────────────────────────
  filtrarPorStock(valor: string): void {
    this.filtroStock.set(this.filtroStock() === valor ? '' : valor);
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

  irNuevoProducto(): void { this.router.navigate(['/productos/nuevo']); }

  exportar(): void {
    exportToCsv('productos.csv', this.filtrados(), [
      { header: 'Código',        value: p => this.codigo(p) },
      { header: 'Nombre',        value: p => p.nombre },
      { header: 'Categoría',     value: p => p.nombreCategoria ?? '' },
      { header: 'Estado',        value: p => p.estado },
      { header: 'Precio compra', value: p => p.precioCompra ?? '' },
      { header: 'Stock',         value: p => this.stockDe(p.id).stock },
      { header: 'Stock mínimo',  value: p => p.stockMinimo ?? '' },
      { header: 'Stock crítico', value: p => p.stockCritico ?? '' },
    ]);
  }

  ver(p: ProductoResponse): void { this.verTarget.set(p); }
  cerrarVer(): void { this.verTarget.set(null); }

  pedirEliminar(p: ProductoResponse): void { this.eliminarError.set(null); this.eliminarTarget.set(p); }
  cancelarEliminar(): void { this.eliminarTarget.set(null); }
  confirmarEliminar(): void {
    const target = this.eliminarTarget();
    if (!target) return;
    this.eliminando.set(true);
    this.eliminarError.set(null);
    this.productoService.eliminar(target.id).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.eliminarTarget.set(null);
        this.productos.update(list => list.filter(p => p.id !== target.id));
      },
      error: err => {
        this.eliminando.set(false);
        this.eliminarError.set(err?.error?.message ?? 'No se pudo eliminar el producto.');
      },
    });
  }
}
