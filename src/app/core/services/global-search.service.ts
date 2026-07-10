import { Injectable, inject, signal, computed } from '@angular/core';
import { forkJoin } from 'rxjs';

import { ProductoService } from '../../features/inventario/services/producto.service';
import { ClienteService } from '../../features/clientes/services/cliente.service';
import { PedidoService } from '../../features/ventas/services/pedido.service';
import { ProductoResponse } from '../../features/inventario/models/producto.model';
import { ClienteResponse } from '../../features/clientes/models/cliente.model';
import { PedidoResponse } from '../../features/ventas/models/pedido.model';

export interface SearchResult {
  type: 'producto' | 'cliente' | 'pedido';
  label: string;
  subtitle: string;
  route: string;
  icon: string;
}

@Injectable({ providedIn: 'root' })
export class GlobalSearchService {
  private readonly productoService = inject(ProductoService);
  private readonly clienteService  = inject(ClienteService);
  private readonly pedidoService   = inject(PedidoService);

  private readonly productos = signal<ProductoResponse[]>([]);
  private readonly clientes  = signal<ClienteResponse[]>([]);
  private readonly pedidos   = signal<PedidoResponse[]>([]);

  readonly loaded  = signal(false);
  readonly loading = signal(false);
  readonly query   = signal('');

  readonly results = computed((): SearchResult[] => {
    const q = this.query().toLowerCase().trim();
    if (!q || q.length < 2) return [];

    const r: SearchResult[] = [];

    this.productos()
      .filter((p) => p.nombre.toLowerCase().includes(q) || p.nombreCategoria?.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach((p) =>
        r.push({ type: 'producto', label: p.nombre, subtitle: p.nombreCategoria ?? '', route: `/productos/${p.id}/editar`, icon: 'inventory_2' }),
      );

    this.clientes()
      .filter((c) =>
        c.nombreCompleto?.toLowerCase().includes(q) ||
        c.razonSocial?.toLowerCase().includes(q) ||
        (c.ruc ?? '').includes(q),
      )
      .slice(0, 5)
      .forEach((c) =>
        r.push({ type: 'cliente', label: c.nombreCompleto, subtitle: c.ruc ?? c.razonSocial ?? '', route: `/clientes`, icon: 'groups' }),
      );

    this.pedidos()
      .filter((p) =>
        p.numeroPedido?.toLowerCase().includes(q) ||
        p.nombreCliente?.toLowerCase().includes(q),
      )
      .slice(0, 5)
      .forEach((p) =>
        r.push({ type: 'pedido', label: p.numeroPedido, subtitle: `${p.nombreCliente} · S/ ${p.total.toFixed(2)}`, route: `/pedidos/${p.id}`, icon: 'receipt_long' }),
      );

    return r;
  });

  readonly hasResults = computed(() => this.results().length > 0);

  load(): void {
    if (this.loaded() || this.loading()) return;
    this.loading.set(true);
    forkJoin({
      productos: this.productoService.listar(),
      clientes:  this.clienteService.listar(),
      pedidos:   this.pedidoService.listar(),
    }).subscribe({
      next: ({ productos, clientes, pedidos }) => {
        this.productos.set(productos);
        this.clientes.set(clientes);
        this.pedidos.set(pedidos);
        this.loaded.set(true);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); },
    });
  }
}
