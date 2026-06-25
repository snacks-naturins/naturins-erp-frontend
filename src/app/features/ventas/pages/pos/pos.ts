import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';

import { PresentacionService }   from '../../../inventario/services/presentacion.service';
import { LoteService }           from '../../../inventario/services/lote.service';
import { ProductoService }       from '../../../inventario/services/producto.service';
import { ClienteService }        from '../../../clientes/services/cliente.service';
import { MetodoPagoService }     from '../../services/metodo-pago.service';
import { PedidoService }         from '../../services/pedido.service';
import { DetallePedidoService }  from '../../services/detalle-pedido.service';

import { PresentacionResponse }  from '../../../inventario/models/presentacion.model';
import { LoteResponse }          from '../../../inventario/models/lote.model';
import { ClienteResponse }       from '../../../clientes/models/cliente.model';
import { MetodoPagoResponse }    from '../../models/metodo-pago.model';
import { PedidoResponse }        from '../../models/pedido.model';

interface PresentacionPOS extends PresentacionResponse {
  urlImagen?: string | null;
  nombreCategoria?: string;
  categoriaId?: string;
  stockDisponible: number;
}

interface CarritoItem {
  presentacion: PresentacionPOS;
  lote: LoteResponse;
  cantidad: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  templateUrl: './pos.html',
  styleUrl: './pos.css',
})
export class Pos implements OnInit {
  private readonly svcPres    = inject(PresentacionService);
  private readonly svcLote    = inject(LoteService);
  private readonly svcProd    = inject(ProductoService);
  private readonly svcCliente = inject(ClienteService);
  private readonly svcMetodo  = inject(MetodoPagoService);
  private readonly svcPedido  = inject(PedidoService);
  private readonly svcDetalle = inject(DetallePedidoService);

  readonly loading = signal(true);
  readonly error   = signal<string | null>(null);

  // ── Catálogo ────────────────────────────────────────────────
  readonly presentaciones  = signal<PresentacionPOS[]>([]);
  readonly categorias      = signal<string[]>([]);
  readonly categoriaActiva = signal('Todos');
  readonly busqueda        = signal('');

  readonly productosFiltrados = computed(() => {
    const cat = this.categoriaActiva();
    const q   = this.busqueda().toLowerCase().trim();
    return this.presentaciones().filter((p) => {
      const matchCat = cat === 'Todos' || p.nombreCategoria === cat;
      const matchQ   = !q || p.nombreProducto.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q);
      return matchCat && matchQ && p.stockDisponible > 0;
    });
  });

  // ── Carrito ──────────────────────────────────────────────────
  readonly carrito    = signal<CarritoItem[]>([]);
  readonly cartAlert  = signal<string | null>(null);
  private alertTimer: ReturnType<typeof setTimeout> | null = null;

  readonly subtotal = computed(() =>
    this.carrito().reduce((s, i) => s + i.cantidad * i.presentacion.precioVenta, 0));

  readonly igv = computed(() => {
    const c = this.clienteSeleccionado();
    const aplica = c ? c.aplicaIgv : true;
    return aplica ? Math.round(this.subtotal() * 0.18 * 100) / 100 : 0;
  });

  readonly total = computed(() => this.subtotal() + this.igv());

  // ── Cliente ──────────────────────────────────────────────────
  readonly clientes           = signal<ClienteResponse[]>([]);
  readonly clienteIdSignal    = signal('');
  readonly clienteSearch      = signal('');
  readonly clienteDropdown    = signal(false);
  readonly clienteSeleccionado = computed(() =>
    this.clientes().find((c) => c.id === this.clienteIdSignal()) ?? null);
  readonly clientesFiltrados  = computed(() => {
    const q = this.clienteSearch().toLowerCase().trim();
    return q
      ? this.clientes().filter((c) =>
          c.nombreCompleto.toLowerCase().includes(q) ||
          (c.ruc ?? '').includes(q) ||
          (c.razonSocial ?? '').toLowerCase().includes(q))
      : this.clientes();
  });

  // ── Tipo de entrega ──────────────────────────────────────────
  readonly tipoEntregaSignal  = signal<'RECOJO_TIENDA' | 'DELIVERY' | 'AGENCIA'>('RECOJO_TIENDA');
  readonly direccionEntrega   = signal('');

  readonly tiposEntrega: { value: 'RECOJO_TIENDA' | 'DELIVERY' | 'AGENCIA'; label: string; icon: string }[] = [
    { value: 'RECOJO_TIENDA', label: 'Recojo en tienda', icon: 'storefront' },
    { value: 'DELIVERY',      label: 'Delivery',         icon: 'local_shipping' },
    { value: 'AGENCIA',       label: 'Agencia',          icon: 'inventory_2' },
  ];

  // ── Métodos de pago ──────────────────────────────────────────
  readonly metodosPago      = signal<MetodoPagoResponse[]>([]);
  readonly metodoPagoId     = signal('');
  readonly metodoPagoNombre = signal('');

  // ── Venta ────────────────────────────────────────────────────
  readonly saving       = signal(false);
  readonly errorVenta   = signal<string | null>(null);
  readonly pedidoCreado = signal<PedidoResponse | null>(null);
  readonly modalExito   = signal(false);
  readonly totalVenta   = signal(0);

  // ── Lotes internos ───────────────────────────────────────────
  private lotesPorPres = new Map<string, LoteResponse[]>();

  // ── Lifecycle ────────────────────────────────────────────────
  ngOnInit(): void {
    forkJoin([
      this.svcPres.listar(),
      this.svcLote.listarDisponibles(),
      this.svcProd.listar(),
      this.svcCliente.listar(),
      this.svcMetodo.listarActivos(),
    ]).subscribe({
      next: ([pres, lotes, prods, clientes, metodos]) => {
        // Indexar lotes por presentación (FEFO sort)
        this.lotesPorPres = new Map();
        for (const l of lotes) {
          if (l.stockLote > 0) {
            const arr = this.lotesPorPres.get(l.presentacionProductoId) ?? [];
            arr.push(l);
            this.lotesPorPres.set(l.presentacionProductoId, arr);
          }
        }
        // Ordenar cada grupo por fecha vencimiento ASC (nulls al final)
        this.lotesPorPres.forEach((arr) =>
          arr.sort((a, b) => {
            if (!a.fechaVencimiento) return 1;
            if (!b.fechaVencimiento) return -1;
            return a.fechaVencimiento.localeCompare(b.fechaVencimiento);
          }));

        // Construir presentaciones POS
        const prodMap = new Map(prods.map((p) => [p.id, p]));
        const presentacionesPOS: PresentacionPOS[] = pres
          .filter((p) => p.estado === 'ACTIVO')
          .map((p) => {
            const prod = prodMap.get(p.productoId);
            const lotesDisp = this.lotesPorPres.get(p.id) ?? [];
            const stock = lotesDisp.reduce((s, l) => s + l.stockLote, 0);
            return {
              ...p,
              urlImagen: prod?.urlImagen ?? null,
              nombreCategoria: prod?.nombreCategoria ?? 'Sin categoría',
              categoriaId: prod?.categoriaId,
              stockDisponible: stock,
            };
          });

        this.presentaciones.set(presentacionesPOS);

        // Categorías únicas
        const cats = [...new Set(presentacionesPOS.map((p) => p.nombreCategoria ?? 'Sin categoría'))];
        this.categorias.set(cats.sort());

        // Clientes activos
        this.clientes.set(clientes.filter((c) => c.estado === 'ACTIVO'));

        // Métodos de pago
        this.metodosPago.set(metodos);
        if (metodos.length > 0) {
          this.metodoPagoId.set(metodos[0].id);
          this.metodoPagoNombre.set(metodos[0].nombre);
        }

        this.loading.set(false);
      },
      error: () => { this.error.set('No se pudo cargar el catálogo.'); this.loading.set(false); },
    });
  }

  // ── Catálogo helpers ─────────────────────────────────────────
  onBusqueda(e: Event): void { this.busqueda.set((e.target as HTMLInputElement).value); }
  setCategoria(cat: string): void { this.categoriaActiva.set(cat); }

  iconoProducto(pres: PresentacionPOS): string {
    const cat = (pres.nombreCategoria ?? '').toLowerCase();
    if (cat.includes('snack') || cat.includes('papa')) return 'local_pizza';
    if (cat.includes('cereal') || cat.includes('avena')) return 'grain';
    if (cat.includes('fruto') || cat.includes('nuts')) return 'spa';
    if (cat.includes('bebida') || cat.includes('jugo')) return 'local_drink';
    if (cat.includes('barra')) return 'inventory_2';
    return 'eco';
  }

  bgCard(pres: PresentacionPOS): string {
    const cat = (pres.nombreCategoria ?? '').toLowerCase();
    if (cat.includes('snack')) return 'bg-orange-50';
    if (cat.includes('cereal')) return 'bg-yellow-50';
    if (cat.includes('fruto')) return 'bg-green-50';
    if (cat.includes('bebida')) return 'bg-blue-50';
    if (cat.includes('barra')) return 'bg-purple-50';
    return 'bg-primary/5';
  }

  // ── Carrito helpers ──────────────────────────────────────────
  agregarAlCarrito(pres: PresentacionPOS): void {
    if (pres.stockDisponible === 0) {
      this.mostrarAlerta(`Sin stock disponible para "${pres.nombreProducto} — ${pres.nombre}"`);
      return;
    }

    const lote = this.mejorLoteConStock(pres);
    if (!lote) {
      this.mostrarAlerta(`Stock máximo alcanzado para "${pres.nombre}"`);
      return;
    }

    const existente = this.carrito().find(
      (i) => i.presentacion.id === pres.id && i.lote.id === lote.id,
    );

    if (existente) {
      if (existente.cantidad >= lote.stockLote) {
        this.mostrarAlerta(`Stock máximo alcanzado para "${pres.nombre}"`);
        return;
      }
      this.carrito.update((c) =>
        c.map((i) => (i === existente ? { ...i, cantidad: i.cantidad + 1 } : i)),
      );
    } else {
      this.carrito.update((c) => [...c, { presentacion: pres, lote, cantidad: 1 }]);
    }
  }

  private mostrarAlerta(msg: string): void {
    if (this.alertTimer) clearTimeout(this.alertTimer);
    this.cartAlert.set(msg);
    this.alertTimer = setTimeout(() => this.cartAlert.set(null), 3000);
  }

  private mejorLote(pres: PresentacionPOS): LoteResponse | null {
    return (this.lotesPorPres.get(pres.id) ?? [])[0] ?? null;
  }

  private mejorLoteConStock(pres: PresentacionPOS): LoteResponse | null {
    const enCarrito = this.carrito().filter((i) => i.presentacion.id === pres.id);
    const usadoPorLote = new Map<string, number>();
    enCarrito.forEach((i) => usadoPorLote.set(i.lote.id, (usadoPorLote.get(i.lote.id) ?? 0) + i.cantidad));

    const lotes = this.lotesPorPres.get(pres.id) ?? [];
    return lotes.find((l) => l.stockLote > (usadoPorLote.get(l.id) ?? 0)) ?? null;
  }

  cantidadEnCarrito(pres: PresentacionPOS): number {
    return this.carrito().filter((i) => i.presentacion.id === pres.id).reduce((s, i) => s + i.cantidad, 0);
  }

  stockReal(pres: PresentacionPOS): number {
    return Math.max(0, pres.stockDisponible - this.cantidadEnCarrito(pres));
  }

  colorStockClass(pres: PresentacionPOS): string {
    const s = this.stockReal(pres);
    if (s === 0) return 'color:#ef4444;font-weight:600';
    if (s <= 10) return 'color:#d97706;font-weight:600';
    return 'color:#6b7280';
  }

  incrementar(item: CarritoItem): void {
    const lote = this.mejorLoteConStock(item.presentacion);
    if (!lote) return;
    this.carrito.update((c) =>
      c.map((i) => i === item && i.cantidad < i.lote.stockLote ? { ...i, cantidad: i.cantidad + 1 } : i));
  }

  decrementar(item: CarritoItem): void {
    if (item.cantidad <= 1) {
      this.eliminarDelCarrito(item);
    } else {
      this.carrito.update((c) => c.map((i) => i === item ? { ...i, cantidad: i.cantidad - 1 } : i));
    }
  }

  eliminarDelCarrito(item: CarritoItem): void {
    this.carrito.update((c) => c.filter((i) => i !== item));
  }

  vaciarCarrito(): void { this.carrito.set([]); }

  // ── Cliente helpers ───────────────────────────────────────────
  seleccionarCliente(c: ClienteResponse): void {
    this.clienteIdSignal.set(c.id);
    this.clienteSearch.set('');
    this.clienteDropdown.set(false);
  }

  limpiarCliente(): void { this.clienteIdSignal.set(''); }

  // ── Método de pago ────────────────────────────────────────────
  seleccionarMetodo(m: MetodoPagoResponse): void {
    this.metodoPagoId.set(m.id);
    this.metodoPagoNombre.set(m.nombre);
  }

  // ── Finalizar venta ───────────────────────────────────────────
  get canFinalizar(): boolean {
    const needsDir = this.tipoEntregaSignal() === 'DELIVERY' && !this.direccionEntrega().trim();
    return this.carrito().length > 0 && !!this.clienteIdSignal() && !!this.metodoPagoId() && !this.saving() && !needsDir;
  }

  finalizarVenta(): void {
    if (!this.canFinalizar) return;
    this.saving.set(true);
    this.errorVenta.set(null);

    this.svcPedido.crear({
      clienteId: this.clienteIdSignal(),
      metodoPagoId: this.metodoPagoId(),
      canal: 'PRESENCIAL',
      prioridad: 'NORMAL',
      tipoEntrega: this.tipoEntregaSignal(),
      costoEnvio: 0,
      descuento: 0,
      ...(this.tipoEntregaSignal() === 'DELIVERY' && this.direccionEntrega().trim()
          ? { direccionEntrega: this.direccionEntrega().trim() } : {}),
    }).subscribe({
      next: (pedido) => {
        forkJoin(this.carrito().map((item) =>
          this.svcDetalle.crear({
            pedidoId: pedido.id,
            presentacionProductoId: item.presentacion.id,
            loteId: item.lote.id,
            precioUnitario: item.presentacion.precioVenta,
            cantidad: item.cantidad,
            descuento: 0,
          })
        )).subscribe({
          next: () => {
            this.svcPedido.confirmar(pedido.id).subscribe({
              next: () => {
                this.totalVenta.set(this.total());
                this.pedidoCreado.set(pedido);
                this.carrito.set([]);
                this.clienteIdSignal.set('');
                this.saving.set(false);
                this.modalExito.set(true);
                // Recargar lotes para reflejar nuevo stock
                this.recargarLotes();
              },
              error: (err) => {
                this.saving.set(false);
                this.errorVenta.set(err?.error?.message ?? 'Error al confirmar el pedido.');
              },
            });
          },
          error: (err) => {
            this.saving.set(false);
            this.errorVenta.set(err?.error?.message ?? 'Error al agregar los ítems.');
          },
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.errorVenta.set(err?.error?.message ?? 'Error al crear el pedido.');
      },
    });
  }

  cerrarModalExito(): void { this.modalExito.set(false); this.pedidoCreado.set(null); }

  private recargarLotes(): void {
    this.svcLote.listarDisponibles().subscribe({
      next: (lotes) => {
        this.lotesPorPres = new Map();
        for (const l of lotes) {
          if (l.stockLote > 0) {
            const arr = this.lotesPorPres.get(l.presentacionProductoId) ?? [];
            arr.push(l);
            this.lotesPorPres.set(l.presentacionProductoId, arr);
          }
        }
        this.lotesPorPres.forEach((arr) =>
          arr.sort((a, b) => {
            if (!a.fechaVencimiento) return 1;
            if (!b.fechaVencimiento) return -1;
            return a.fechaVencimiento.localeCompare(b.fechaVencimiento);
          }));
        // Recalcular stock en presentaciones
        this.presentaciones.update((pres) =>
          pres.map((p) => ({
            ...p,
            stockDisponible: (this.lotesPorPres.get(p.id) ?? []).reduce((s, l) => s + l.stockLote, 0),
          }))
        );
      },
    });
  }

  // ── Format helpers ────────────────────────────────────────────
  formatMonto(v: number): string { return `S/ ${(v ?? 0).toFixed(2)}`; }
  formatNum(v: number): string   { return (v ?? 0).toFixed(3).replace(/\.?0+$/, ''); }

  metodoIcono(nombre: string): string {
    const n = nombre.toLowerCase();
    if (n.includes('efectivo') || n.includes('cash')) return 'payments';
    if (n.includes('tarjeta') || n.includes('visa') || n.includes('master')) return 'credit_card';
    if (n.includes('yape') || n.includes('plin') || n.includes('qr')) return 'qr_code';
    if (n.includes('transferencia') || n.includes('banco')) return 'account_balance';
    return 'point_of_sale';
  }
}
