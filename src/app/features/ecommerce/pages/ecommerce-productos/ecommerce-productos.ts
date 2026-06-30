import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { ProductoService } from '../../../inventario/services/producto.service';
import { ProductoResponse } from '../../../inventario/models/producto.model';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';
import { debouncedSignal } from '../../../../shared/utils/debounce';

@Component({
  selector: 'app-ecommerce-productos',
  standalone: true,
  imports: [MatIconModule, BreadcrumbComponent],
  templateUrl: './ecommerce-productos.html',
})
export class EcommerceProductos implements OnInit {
  private readonly svc = inject(ProductoService);

  readonly loading  = signal(true);
  readonly error    = signal<string | null>(null);
  readonly productos = signal<ProductoResponse[]>([]);
  readonly search   = signal('');
  readonly searchDebounced = debouncedSignal(this.search);
  readonly toggling = signal<string | null>(null);

  readonly filtrados = computed(() => {
    const q = this.searchDebounced().toLowerCase().trim();
    return this.productos().filter(
      (p) => !q || p.nombre.toLowerCase().includes(q) || (p.nombreCategoria ?? '').toLowerCase().includes(q),
    );
  });

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    this.svc.listar().subscribe({
      next: (d) => { this.productos.set(d); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar los productos.'); this.loading.set(false); },
    });
  }

  toggleVisible(p: ProductoResponse): void {
    this.toggling.set(p.id);
    const nuevoValor = !p.visibleEcommerce;
    this.svc.actualizar(p.id, { visibleEcommerce: nuevoValor } as any).subscribe({
      next: (actualizado) => {
        this.productos.update((lista) =>
          lista.map((item) => (item.id === p.id ? actualizado : item)),
        );
        this.toggling.set(null);
      },
      error: () => this.toggling.set(null),
    });
  }
}
