import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { ProductoService } from '../../services/producto.service';
import { PresentacionService } from '../../services/presentacion.service';
import { LoteService } from '../../services/lote.service';
import { ProductoResponse } from '../../models/producto.model';
import { PresentacionResponse } from '../../models/presentacion.model';
import { LoteResponse } from '../../models/lote.model';
import { debouncedSignal } from '../../../../shared/utils/debounce';
import { exportToCsv } from '../../../../shared/utils/export-csv';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { RbacPipe } from '../../../../shared/pipes/rbac.pipe';

interface EstadoView {
  label: string;
  dot: string;
  classes: string;
}

interface StockInfo {
  stock: number;
  lotes: number;
  vencido: boolean;
  proxVence: boolean;
}

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [RouterLink, MatIconModule, BreadcrumbComponent, EmptyState, RbacPipe],
  templateUrl: './products-list.html',
})
export class ProductList implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly presentacionService = inject(PresentacionService);
  private readonly loteService = inject(LoteService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly productos = signal<ProductoResponse[]>([]);
  readonly presentaciones = signal<PresentacionResponse[]>([]);
  readonly lotes = signal<LoteResponse[]>([]);
  readonly search = signal('');
  readonly searchDebounced = debouncedSignal(this.search);
  readonly filtroCategoria = signal('');
  readonly filtroEstado    = signal('');

  readonly categoriasDisponibles = computed(() =>
    [...new Set(this.productos().map((p) => p.categoriaId ? (p.nombreCategoria ?? '') : '').filter(Boolean))].sort()
  );

  /** Stock agregado por producto: suma de lotes de todas sus presentaciones. */
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

  // Modales
  readonly verTarget = signal<ProductoResponse | null>(null);
  readonly eliminarTarget = signal<ProductoResponse | null>(null);
  readonly eliminando = signal(false);
  readonly eliminarError = signal<string | null>(null);

  readonly filtrados = computed(() => {
    const q   = this.searchDebounced().toLowerCase().trim();
    const cat = this.filtroCategoria();
    const est = this.filtroEstado();
    return this.productos().filter((p) => {
      if (q && !p.nombre.toLowerCase().includes(q) && !(p.nombreCategoria ?? '').toLowerCase().includes(q)) return false;
      if (cat && (p.nombreCategoria ?? '') !== cat) return false;
      if (est && p.estado !== est) return false;
      return true;
    });
  });

  readonly PAGE_SIZE    = 20;
  readonly pagina       = signal(0);
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / this.PAGE_SIZE)));
  readonly paginados    = computed(() => {
    const p = this.pagina();
    return this.filtrados().slice(p * this.PAGE_SIZE, (p + 1) * this.PAGE_SIZE);
  });

  readonly totalCategorias = computed(
    () => new Set(this.productos().map((p) => p.categoriaId)).size,
  );

  constructor() {
    effect(() => {
      this.searchDebounced();
      this.filtroCategoria();
      this.filtroEstado();
      this.pagina.set(0);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.productoService.listar().subscribe({
      next: (data) => {
        this.productos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los productos. Verifica el backend.');
        this.loading.set(false);
      },
    });

    // Datos de inventario para el stock agregado (no bloquean el listado)
    this.presentacionService.listar().subscribe({
      next: (p) => this.presentaciones.set(p),
      error: () => this.presentaciones.set([]),
    });
    this.loteService.listar().subscribe({
      next: (l) => this.lotes.set(l),
      error: () => this.lotes.set([]),
    });
  }

  stockDe(productoId: string): StockInfo {
    return this.stockMap().get(productoId) ?? { stock: 0, lotes: 0, vencido: false, proxVence: false };
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  codigo(p: ProductoResponse): string {
    return 'SNK-' + (p.id ?? '').replace(/-/g, '').slice(0, 6).toUpperCase();
  }

  estado(e: string): EstadoView {
    switch (e) {
      case 'ACTIVO':
        return { label: 'Activo', dot: 'bg-[#22C55E]', classes: 'bg-[#DCFCE7] text-[#15803D]' };
      case 'DESCONTINUADO':
        return { label: 'Descontinuado', dot: 'bg-[#EF4444]', classes: 'bg-[#FEE2E2] text-[#B91C1C]' };
      default:
        return { label: 'Inactivo', dot: 'bg-[#9CA3AF]', classes: 'bg-[#F3F4F6] text-[#6B7280]' };
    }
  }

  irNuevoProducto(): void { this.router.navigate(['/productos/nuevo']); }

  exportar(): void {
    exportToCsv('productos.csv', this.filtrados(), [
      { header: 'Código',         value: (p) => this.codigo(p) },
      { header: 'Nombre',         value: (p) => p.nombre },
      { header: 'Categoría',      value: (p) => p.nombreCategoria ?? '' },
      { header: 'Estado',         value: (p) => p.estado },
      { header: 'Precio compra',  value: (p) => p.precioCompra ?? '' },
      { header: 'Stock',          value: (p) => this.stockDe(p.id).stock },
      { header: 'Stock mínimo',   value: (p) => p.stockMinimo ?? '' },
      { header: 'Stock crítico',  value: (p) => p.stockCritico ?? '' },
    ]);
  }

  // --- Ver ---
  ver(p: ProductoResponse): void {
    this.verTarget.set(p);
  }
  cerrarVer(): void {
    this.verTarget.set(null);
  }

  // --- Eliminar ---
  pedirEliminar(p: ProductoResponse): void {
    this.eliminarError.set(null);
    this.eliminarTarget.set(p);
  }
  cancelarEliminar(): void {
    this.eliminarTarget.set(null);
  }
  confirmarEliminar(): void {
    const target = this.eliminarTarget();
    if (!target) return;

    this.eliminando.set(true);
    this.eliminarError.set(null);
    this.productoService.eliminar(target.id).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.eliminarTarget.set(null);
        this.productos.update((list) => list.filter((p) => p.id !== target.id));
      },
      error: (err) => {
        this.eliminando.set(false);
        this.eliminarError.set(err?.error?.message ?? 'No se pudo eliminar el producto.');
      },
    });
  }
}
