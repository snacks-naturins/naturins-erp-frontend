import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { PedidoService }        from '../../../services/pedido.service';
import { DetallePedidoService } from '../../../services/detalle-pedido.service';
import { PedidoResponse }       from '../../../models/pedido.model';
import { DetallePedidoResponse } from '../../../models/detalle-pedido.model';
import { FechaPipe } from '../../../../../shared/pipes/fecha.pipe';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb';

interface EstadoPaso {
  key: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-pedido-detalle',
  standalone: true,
  imports: [RouterLink, MatIconModule, FechaPipe, BreadcrumbComponent],
  templateUrl: './pedido-detalle.html',
})
export class PedidoDetalle implements OnInit {
  private readonly route      = inject(ActivatedRoute);
  private readonly svcPedido  = inject(PedidoService);
  private readonly svcDetalle = inject(DetallePedidoService);

  readonly loading  = signal(true);
  readonly error    = signal<string | null>(null);
  readonly pedido   = signal<PedidoResponse | null>(null);
  readonly detalles = signal<DetallePedidoResponse[]>([]);
  readonly accionando = signal(false);
  readonly accionError = signal<string | null>(null);

  readonly pasos: EstadoPaso[] = [
    { key: 'NUEVO',           label: 'Nuevo',       icon: 'fiber_new' },
    { key: 'CONFIRMADO',      label: 'Confirmado',   icon: 'check_circle' },
    { key: 'EN_PREPARACION',  label: 'Preparando',   icon: 'inventory' },
    { key: 'LISTO_DESPACHO',  label: 'Listo',        icon: 'done_all' },
    { key: 'EN_CAMINO',       label: 'En camino',    icon: 'local_shipping' },
    { key: 'ENTREGADO',       label: 'Entregado',    icon: 'task_alt' },
  ];

  readonly pasoActual = computed(() => {
    const p = this.pedido();
    return this.pasos.findIndex((s) => s.key === p?.estado);
  });

  readonly subtotal = computed(() =>
    this.detalles().reduce((s, d) => s + d.subtotal, 0));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.error.set('ID de pedido no encontrado.'); this.loading.set(false); return; }
    this.cargar(id);
  }

  cargar(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.svcPedido.buscarPorId(id).subscribe({
      next: (p) => {
        this.pedido.set(p);
        this.svcDetalle.porPedido(id).subscribe({
          next: (d) => { this.detalles.set(d); this.loading.set(false); },
          error: () => { this.detalles.set([]); this.loading.set(false); },
        });
      },
      error: () => { this.error.set('No se pudo cargar el pedido.'); this.loading.set(false); },
    });
  }

  avanzar(): void {
    const p = this.pedido();
    if (!p || this.accionando()) return;
    this.accionando.set(true);
    this.accionError.set(null);
    let req$;
    switch (p.estado) {
      case 'NUEVO':          req$ = this.svcPedido.confirmar(p.id); break;
      case 'CONFIRMADO':     req$ = this.svcPedido.preparar(p.id);  break;
      case 'EN_PREPARACION': req$ = this.svcPedido.despachar(p.id); break;
      case 'LISTO_DESPACHO': req$ = this.svcPedido.entregar(p.id); break;
      case 'EN_CAMINO':      req$ = this.svcPedido.entregar(p.id);  break;
      default: this.accionando.set(false); return;
    }
    req$.subscribe({
      next: () => { this.accionando.set(false); this.cargar(p.id); },
      error: (err) => { this.accionando.set(false); this.accionError.set(err?.error?.message ?? 'Error al avanzar el estado.'); },
    });
  }

  cancelar(): void {
    const p = this.pedido();
    if (!p || this.accionando()) return;
    this.accionando.set(true);
    this.svcPedido.cancelar(p.id).subscribe({
      next: () => { this.accionando.set(false); this.cargar(p.id); },
      error: (err) => { this.accionando.set(false); this.accionError.set(err?.error?.message ?? 'Error al cancelar.'); },
    });
  }

  get puedeAvanzar(): boolean {
    const estado = this.pedido()?.estado;
    return !!estado && !['ENTREGADO', 'CANCELADO', 'DEVUELTO'].includes(estado);
  }

  get puedeCancelar(): boolean {
    const estado = this.pedido()?.estado;
    return !!estado && !['ENTREGADO', 'CANCELADO', 'DEVUELTO'].includes(estado);
  }

  labelAvanzar(): string {
    switch (this.pedido()?.estado) {
      case 'NUEVO':          return 'Confirmar';
      case 'CONFIRMADO':     return 'Iniciar preparación';
      case 'EN_PREPARACION': return 'Marcar listo';
      case 'LISTO_DESPACHO': return 'En camino';
      case 'EN_CAMINO':      return 'Marcar entregado';
      default: return 'Avanzar';
    }
  }

  estadoClase(estado: string): string {
    switch (estado) {
      case 'NUEVO':           return 'bg-gray-100 text-gray-600';
      case 'CONFIRMADO':      return 'bg-blue-100 text-blue-700';
      case 'EN_PREPARACION':  return 'bg-amber-100 text-amber-700';
      case 'LISTO_DESPACHO':  return 'bg-indigo-100 text-indigo-700';
      case 'EN_CAMINO':       return 'bg-purple-100 text-purple-700';
      case 'ENTREGADO':       return 'bg-green-100 text-green-700';
      case 'CANCELADO':       return 'bg-red-100 text-red-600';
      case 'DEVUELTO':        return 'bg-orange-100 text-orange-700';
      default:                return 'bg-gray-100 text-gray-500';
    }
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      NUEVO: 'Nuevo', CONFIRMADO: 'Confirmado', EN_PREPARACION: 'En preparación',
      LISTO_DESPACHO: 'Listo para despacho', EN_CAMINO: 'En camino',
      ENTREGADO: 'Entregado', CANCELADO: 'Cancelado', DEVUELTO: 'Devuelto',
    };
    return map[estado] ?? estado;
  }

  formatMonto(v: number): string { return `S/ ${(v ?? 0).toFixed(2)}`; }

  imprimir(): void {
    const p = this.pedido();
    const items = this.detalles();
    if (!p) return;

    const esc = (s: string) => (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const fmt = (v: number) => `S/ ${(v ?? 0).toFixed(2)}`;

    const fecha = p.fechaCreacion
      ? new Date(p.fechaCreacion).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
      : '—';

    const estadoLabels: Record<string, string> = {
      NUEVO: 'Nuevo', CONFIRMADO: 'Confirmado', EN_PREPARACION: 'En preparación',
      LISTO_DESPACHO: 'Listo para despacho', EN_CAMINO: 'En camino',
      ENTREGADO: 'Entregado', CANCELADO: 'Cancelado', DEVUELTO: 'Devuelto',
    };

    const pagoBadge = p.estadoPago === 'PAGADO'
      ? 'background:#dcfce7;color:#166534'
      : p.estadoPago === 'PENDIENTE'
        ? 'background:#fef9c3;color:#854d0e'
        : 'background:#f3f4f6;color:#374151';

    const filas = items.map(d => `
      <tr>
        <td style="padding:9px 10px;border-bottom:1px solid #f0f0f0;font-weight:500">
          ${esc(d.nombreProducto)}
          <div style="font-size:11px;color:#888;font-weight:400;margin-top:1px">${esc(d.nombrePresentacion)}</div>
        </td>
        <td style="padding:9px 10px;border-bottom:1px solid #f0f0f0;font-family:monospace;font-size:11px;color:#555">${esc(d.codigoLote)}</td>
        <td style="padding:9px 10px;border-bottom:1px solid #f0f0f0;text-align:right">${d.cantidad}</td>
        <td style="padding:9px 10px;border-bottom:1px solid #f0f0f0;text-align:right;color:#555">${fmt(d.precioUnitario)}</td>
        <td style="padding:9px 10px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600">${fmt(d.subtotal)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante ${esc(p.numeroPedido)}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#1a1a1a;background:#fff;padding:36px;max-width:794px;margin:0 auto}
    @media print{body{padding:0}@page{margin:12mm;size:A4}}
  </style>
</head>
<body>

  <!-- Cabecera -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid #c85a1e">
    <div>
      <div style="font-size:26px;font-weight:800;color:#c85a1e;letter-spacing:-0.5px">Snacks Naturins</div>
      <div style="font-size:11px;color:#888;margin-top:3px">Alimentos naturales y saludables</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1.5px">Comprobante de Venta</div>
      <div style="font-size:24px;font-weight:800;color:#1a1a1a;margin-top:4px;letter-spacing:-0.5px">${esc(p.numeroPedido)}</div>
      <div style="font-size:12px;color:#666;margin-top:3px">${fecha}</div>
    </div>
  </div>

  <!-- Info -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px">
    <div style="background:#f7f7f7;border-radius:8px;padding:14px">
      <div style="font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px">Cliente</div>
      <div style="font-weight:700;font-size:15px">${esc(p.nombreCliente)}</div>
    </div>
    <div style="background:#f7f7f7;border-radius:8px;padding:14px">
      <div style="font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px">Estado del pedido</div>
      <div style="font-weight:600">${estadoLabels[p.estado] ?? esc(p.estado)}</div>
    </div>
    <div style="background:#f7f7f7;border-radius:8px;padding:14px">
      <div style="font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px">Método de pago</div>
      <div style="font-weight:600">${esc(p.metodoPagoNombre)}</div>
      <span style="display:inline-block;margin-top:5px;padding:2px 10px;border-radius:9999px;font-size:11px;font-weight:600;${pagoBadge}">${esc(p.estadoPago)}</span>
    </div>
    <div style="background:#f7f7f7;border-radius:8px;padding:14px">
      <div style="font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px">Canal / Entrega</div>
      <div style="font-weight:600">${esc(p.canal)}</div>
      <div style="font-size:11px;color:#888;margin-top:2px">${esc(p.tipoEntrega.replace(/_/g, ' '))}</div>
      ${p.direccionEntrega ? `<div style="font-size:11px;color:#555;margin-top:5px">📍 ${esc(p.direccionEntrega)}</div>` : ''}
    </div>
    ${p.nombreUsuarioVendedor ? `
    <div style="background:#f7f7f7;border-radius:8px;padding:14px">
      <div style="font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px">Vendedor</div>
      <div style="font-weight:600">${esc(p.nombreUsuarioVendedor)}</div>
    </div>` : ''}
  </div>

  <!-- Tabla de ítems -->
  <table style="width:100%;border-collapse:collapse">
    <thead>
      <tr style="background:#1a1a1a;color:#fff">
        <th style="padding:10px 10px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Producto</th>
        <th style="padding:10px 10px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Lote</th>
        <th style="padding:10px 10px;text-align:right;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Cant.</th>
        <th style="padding:10px 10px;text-align:right;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">P. Unit.</th>
        <th style="padding:10px 10px;text-align:right;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Subtotal</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>

  <!-- Totales -->
  <div style="display:flex;justify-content:flex-end;margin-top:16px">
    <div style="min-width:260px;border-top:1px solid #e5e5e5;padding-top:12px">
      ${p.igv > 0 ? `
      <div style="display:flex;justify-content:space-between;padding:4px 0;color:#555;font-size:13px">
        <span>Subtotal</span><span>${fmt(p.subTotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;color:#555;font-size:13px">
        <span>IGV (18%)</span><span>${fmt(p.igv)}</span>
      </div>` : ''}
      ${p.costoEnvio > 0 ? `
      <div style="display:flex;justify-content:space-between;padding:4px 0;color:#555;font-size:13px">
        <span>Costo de envío</span><span>${fmt(p.costoEnvio)}</span>
      </div>` : ''}
      ${(p.descuento ?? 0) > 0 ? `
      <div style="display:flex;justify-content:space-between;padding:4px 0;color:#dc2626;font-size:13px">
        <span>Descuento</span><span>-${fmt(p.descuento ?? 0)}</span>
      </div>` : ''}
      <div style="display:flex;justify-content:space-between;padding:12px 0 0;border-top:2px solid #1a1a1a;margin-top:8px;font-size:17px;font-weight:800">
        <span>TOTAL</span>
        <span style="color:#c85a1e">${fmt(p.total)}</span>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e5e5e5;display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:11px;color:#bbb">Generado por Naturins ERP · ${new Date().toLocaleDateString('es-PE')}</div>
    <div style="text-align:center;font-size:12px;color:#555">
      <strong>¡Gracias por su compra!</strong><br>
      <span style="font-size:11px;color:#999">Snacks Naturins — Alimentos que cuidan tu bienestar</span>
    </div>
  </div>

</body>
</html>`;

    const win = window.open('', '_blank', 'width=860,height=1060,scrollbars=yes');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }
}
