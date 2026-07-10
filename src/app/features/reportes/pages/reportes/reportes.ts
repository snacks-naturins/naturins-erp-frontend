import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { ReporteService } from '../../services/reporte.service';
import {
  CuentaPorCobrar,
  LoteInventario,
  LoteProximoVencer,
  ProductoMasVendido,
  ResumenCompras,
  ResumenVentas,
} from '../../models/reporte.model';
import { ProduccionService } from '../../../produccion/services/produccion.service';
import { ProduccionResponse } from '../../../produccion/models/produccion.model';
import { FechaPipe } from '../../../../shared/pipes/fecha.pipe';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { exportToCsv } from '../../../../shared/utils/export-csv';

type TabId = 'ventas' | 'compras' | 'produccion' | 'inventario' | 'productos' | 'cuentas' | 'vencimientos';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [MatIconModule, FechaPipe, BreadcrumbComponent, EmptyState],
  templateUrl: './reportes.html',
})
export class Reportes implements OnInit {
  private readonly svc     = inject(ReporteService);
  private readonly svcProd = inject(ProduccionService);

  readonly activeTab = signal<TabId>('ventas');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly desde = signal(this.primeroDelMes());
  readonly hasta = signal(this.hoyISO());

  private primeroDelMes(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }
  private hoyISO(): string {
    return new Date().toISOString().slice(0, 10);
  }

  readonly tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'ventas',       label: 'Ventas',        icon: 'trending_up' },
    { id: 'compras',      label: 'Compras',       icon: 'shopping_cart' },
    { id: 'produccion',   label: 'Producción',    icon: 'precision_manufacturing' },
    { id: 'inventario',   label: 'Inventario',    icon: 'inventory_2' },
    { id: 'productos',    label: 'Más vendidos',  icon: 'star' },
    { id: 'cuentas',      label: 'Por cobrar',    icon: 'payments' },
    { id: 'vencimientos', label: 'Por vencer',    icon: 'schedule' },
  ];

  // ── Datos ──────────────────────────────────────────────────
  readonly resumenVentas  = signal<ResumenVentas | null>(null);
  readonly resumenCompras = signal<ResumenCompras | null>(null);
  readonly opsPeriodo     = signal<ProduccionResponse[]>([]);
  readonly inventario     = signal<LoteInventario[]>([]);
  readonly topProductos   = signal<ProductoMasVendido[]>([]);
  readonly cuentas        = signal<CuentaPorCobrar[]>([]);
  readonly vencimientos   = signal<LoteProximoVencer[]>([]);

  readonly loadingVentas     = signal(false);
  readonly loadingCompras    = signal(false);
  readonly loadingProduccion = signal(false);
  readonly loadingInv        = signal(false);
  readonly loadingProd       = signal(false);
  readonly loadingCtas       = signal(false);
  readonly loadingVenc       = signal(false);

  readonly loadingTab = computed(() => {
    const t = this.activeTab();
    return t === 'ventas'       ? this.loadingVentas()
         : t === 'compras'      ? this.loadingCompras()
         : t === 'produccion'   ? this.loadingProduccion()
         : t === 'inventario'   ? this.loadingInv()
         : t === 'productos'    ? this.loadingProd()
         : t === 'cuentas'      ? this.loadingCtas()
         : this.loadingVenc();
  });

  // ── Computed producción ────────────────────────────────────
  readonly opsCompletadas   = computed(() => this.opsPeriodo().filter((o) => o.estado === 'COMPLETADA').length);
  readonly opsEnProceso     = computed(() => this.opsPeriodo().filter((o) => o.estado === 'EN_PROCESO').length);
  readonly opsCanceladas    = computed(() => this.opsPeriodo().filter((o) => o.estado === 'CANCELADA').length);
  readonly costoTotalProd   = computed(() =>
    this.opsPeriodo().filter((o) => o.estado === 'COMPLETADA').reduce((s, o) => s + (o.costoTotal ?? 0), 0));

  ngOnInit(): void {
    this.cargarTabActiva();
  }

  setTab(t: TabId): void {
    this.activeTab.set(t);
    this.error.set(null);
    this.cargarTabActiva();
  }

  private cargarTabActiva(): void {
    switch (this.activeTab()) {
      case 'ventas':       this.cargarVentas(); break;
      case 'compras':      this.cargarCompras(); break;
      case 'produccion':   this.cargarProduccion(); break;
      case 'inventario':   this.cargarInventario(); break;
      case 'productos':    this.cargarProductos(); break;
      case 'cuentas':      this.cargarCuentas(); break;
      case 'vencimientos': this.cargarVencimientos(); break;
    }
  }

  aplicarFechas(): void {
    this.cargarTabActiva();
  }

  private cargarProduccion(): void {
    this.loadingProduccion.set(true);
    this.svcProd.listar().subscribe({
      next: (ops) => {
        const desde = this.desde();
        const hasta = this.hasta();
        this.opsPeriodo.set(
          ops.filter((o) => {
            const fecha = (o.fechaProduccion ?? o.fechaCreacion ?? '').slice(0, 10);
            return fecha >= desde && fecha <= hasta;
          })
        );
        this.loadingProduccion.set(false);
      },
      error: () => { this.error.set('No se pudo cargar el reporte de producción.'); this.loadingProduccion.set(false); },
    });
  }

  private cargarVentas(): void {
    this.loadingVentas.set(true);
    this.svc.resumenVentas(this.desde(), this.hasta()).subscribe({
      next: (d) => { this.resumenVentas.set(d); this.loadingVentas.set(false); },
      error: () => { this.error.set('No se pudo cargar el reporte de ventas.'); this.loadingVentas.set(false); },
    });
  }

  private cargarCompras(): void {
    this.loadingCompras.set(true);
    this.svc.resumenCompras(this.desde(), this.hasta()).subscribe({
      next: (d) => { this.resumenCompras.set(d); this.loadingCompras.set(false); },
      error: () => { this.error.set('No se pudo cargar el reporte de compras.'); this.loadingCompras.set(false); },
    });
  }

  private cargarInventario(): void {
    this.loadingInv.set(true);
    this.svc.inventarioActual().subscribe({
      next: (d) => { this.inventario.set(d); this.loadingInv.set(false); },
      error: () => { this.error.set('No se pudo cargar el inventario.'); this.loadingInv.set(false); },
    });
  }

  private cargarProductos(): void {
    this.loadingProd.set(true);
    this.svc.productosMasVendidos(this.desde(), this.hasta(), 10).subscribe({
      next: (d) => { this.topProductos.set(d); this.loadingProd.set(false); },
      error: () => { this.error.set('No se pudieron cargar los productos.'); this.loadingProd.set(false); },
    });
  }

  private cargarCuentas(): void {
    this.loadingCtas.set(true);
    this.svc.cuentasPorCobrar().subscribe({
      next: (d) => { this.cuentas.set(d); this.loadingCtas.set(false); },
      error: () => { this.error.set('No se pudieron cargar las cuentas por cobrar.'); this.loadingCtas.set(false); },
    });
  }

  private cargarVencimientos(): void {
    this.loadingVenc.set(true);
    this.svc.lotesProximosAVencer(30).subscribe({
      next: (d) => { this.vencimientos.set(d); this.loadingVenc.set(false); },
      error: () => { this.error.set('No se pudieron cargar los lotes por vencer.'); this.loadingVenc.set(false); },
    });
  }

  exportarVentas(): void {
    const rv = this.resumenVentas();
    if (!rv) return;
    exportToCsv('reporte-ventas.csv', rv.detalle, [
      { header: 'Pedido',       value: (r) => r.numeroPedido },
      { header: 'Cliente',      value: (r) => r.nombreCliente },
      { header: 'Total',        value: (r) => r.total },
      { header: 'Estado',       value: (r) => r.estado },
      { header: 'Estado pago',  value: (r) => r.estadoPago },
      { header: 'Fecha',        value: (r) => r.fechaCreacion?.slice(0, 10) ?? '' },
    ]);
  }

  exportarCompras(): void {
    const rc = this.resumenCompras();
    if (!rc) return;
    exportToCsv('reporte-compras.csv', rc.detalle, [
      { header: 'Orden',       value: (r) => r.numeroOrden },
      { header: 'Proveedor',   value: (r) => r.nombreProveedor },
      { header: 'Total',       value: (r) => r.total },
      { header: 'Estado',      value: (r) => r.estado },
      { header: 'Fecha',       value: (r) => r.fechaCompra?.slice(0, 10) ?? '' },
    ]);
  }

  exportarProduccion(): void {
    exportToCsv('reporte-produccion.csv', this.opsPeriodo(), [
      { header: 'Nro. Orden',   value: (o) => o.numeroOrden },
      { header: 'Responsable',  value: (o) => o.nombreCompleto ?? o.nombreUsuario ?? '' },
      { header: 'Fecha',        value: (o) => o.fechaProduccion?.slice(0, 10) ?? '' },
      { header: 'Costo total',  value: (o) => o.costoTotal ?? 0 },
      { header: 'Estado',       value: (o) => o.estado },
    ]);
  }

  formatMonto(v: number): string { return `S/ ${(v ?? 0).toFixed(2)}`; }

  estadoColor(e: string): string {
    const map: Record<string, string> = {
      PENDIENTE:      'bg-yellow-100 text-yellow-700',
      COMPLETADA:     'bg-green-100 text-green-700',
      CANCELADA:      'bg-gray-100 text-gray-500',
      PLANIFICADA:    'bg-gray-100 text-gray-600',
      EN_PROCESO:     'bg-amber-100 text-amber-700',
      NUEVO:          'bg-blue-100 text-blue-700',
      CONFIRMADO:     'bg-amber-100 text-amber-700',
      EN_PREPARACION: 'bg-orange-100 text-orange-700',
      LISTO_DESPACHO: 'bg-yellow-100 text-yellow-700',
      ENTREGADO:      'bg-green-100 text-green-700',
      DEVUELTO:       'bg-red-100 text-red-600',
      PAGADO:         'bg-green-100 text-green-700',
      PARCIAL:        'bg-yellow-100 text-yellow-700',
    };
    return map[e] ?? 'bg-gray-100 text-gray-500';
  }

  vencimientoColor(dias: number): string {
    if (dias <= 0) return 'text-red-600 font-semibold';
    if (dias <= 7) return 'text-orange-600 font-semibold';
    if (dias <= 15) return 'text-amber-600';
    return 'text-text-muted';
  }

  totalValorInventario = computed(() =>
    this.inventario().reduce((s, l) => s + (l.valorTotal ?? 0), 0)
  );

  totalCuentas = computed(() =>
    this.cuentas().reduce((s, c) => s + (c.total ?? 0), 0)
  );
}
