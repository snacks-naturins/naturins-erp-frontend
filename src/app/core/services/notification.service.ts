import { Injectable, inject, signal, computed } from '@angular/core';
import { forkJoin } from 'rxjs';

import { PedidoService } from '../../features/ventas/services/pedido.service';
import { LoteService } from '../../features/inventario/services/lote.service';
import { ProduccionService } from '../../features/produccion/services/produccion.service';

export interface NotificationCounts {
  urgentOrders: number;
  pendingOrders: number;
  expiringLotes: number;
  activeOps: number;
}

export interface NotificationGroup {
  icon: string;
  label: string;
  count: number;
  route: string;
  tone: 'red' | 'amber' | 'blue';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly pedidoService = inject(PedidoService);
  private readonly loteService   = inject(LoteService);
  private readonly prodService   = inject(ProduccionService);

  readonly counts = signal<NotificationCounts>({
    urgentOrders: 0,
    pendingOrders: 0,
    expiringLotes: 0,
    activeOps: 0,
  });

  readonly totalUnread = computed(() => {
    const c = this.counts();
    return c.urgentOrders + c.pendingOrders + c.expiringLotes + c.activeOps;
  });

  readonly hasNotifications = computed(() => this.totalUnread() > 0);

  readonly groups = computed((): NotificationGroup[] => {
    const c = this.counts();
    const list: NotificationGroup[] = [];
    if (c.urgentOrders > 0)
      list.push({ icon: 'priority_high', label: `${c.urgentOrders} pedido${c.urgentOrders > 1 ? 's' : ''} urgente${c.urgentOrders > 1 ? 's' : ''}`, count: c.urgentOrders, route: '/pedidos', tone: 'red' });
    if (c.pendingOrders > 0)
      list.push({ icon: 'receipt_long', label: `${c.pendingOrders} pedido${c.pendingOrders > 1 ? 's' : ''} sin cobrar`, count: c.pendingOrders, route: '/pedidos', tone: 'amber' });
    if (c.expiringLotes > 0)
      list.push({ icon: 'event_busy', label: `${c.expiringLotes} lote${c.expiringLotes > 1 ? 's' : ''} por vencer`, count: c.expiringLotes, route: '/lotes', tone: 'amber' });
    if (c.activeOps > 0)
      list.push({ icon: 'precision_manufacturing', label: `${c.activeOps} OP${c.activeOps > 1 ? 's' : ''} en proceso`, count: c.activeOps, route: '/produccion', tone: 'blue' });
    return list;
  });

  refresh(): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    forkJoin({
      pedidos: this.pedidoService.listar(),
      lotes:   this.loteService.listar(),
      ops:     this.prodService.listar(),
    }).subscribe({
      next: ({ pedidos, lotes, ops }) => {
        const urgentOrders = pedidos.filter(
          (p) => p.prioridad === 'URGENTE' && !['ENTREGADO', 'CANCELADO', 'DEVUELTO'].includes(p.estado),
        ).length;

        const pendingOrders = pedidos.filter(
          (p) => p.estado === 'NUEVO' && p.estadoPago === 'PENDIENTE',
        ).length;

        const expiringLotes = lotes.filter((l) => {
          if (!l.fechaVencimiento || l.estado === 'VENCIDO' || l.estado === 'AGOTADO' || l.estado === 'AGOTADO_MERMA') return false;
          const dias = Math.round((new Date(l.fechaVencimiento).getTime() - hoy.getTime()) / 86400000);
          return dias >= 0 && dias <= 30;
        }).length;

        const activeOps = ops.filter((o) => o.estado === 'EN_PROCESO' || o.estado === 'PLANIFICADA').length;

        this.counts.set({ urgentOrders, pendingOrders, expiringLotes, activeOps });
      },
      error: () => {},
    });
  }
}
