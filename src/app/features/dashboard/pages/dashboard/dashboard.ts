import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Chart, registerables } from 'chart.js';

import { DashboardService } from '../../services/dashboard.service';
import { DashboardResumen } from '../../models/dashboard.model';
import { LoteService } from '../../../inventario/services/lote.service';
import { LoteResponse } from '../../../inventario/models/lote.model';

Chart.register(...registerables);

interface Kpi {
  icon: string;
  value: string;
  label: string;
  delta: string;
  deltaUp: boolean;
  tone: 'secondary' | 'accent' | 'info' | 'primary' | 'danger';
}

interface TopProduct {
  name: string;
  pct: number;
  color: string;
}

interface Activity {
  icon: string;
  text: string;
  time: string;
  tone: string;
}

const DEFAULT_KPIS: Kpi[] = [
  { icon: 'payments', value: 'S/ 12,480', label: 'Ventas del día', delta: '12%', deltaUp: true, tone: 'secondary' },
  { icon: 'trending_up', value: 'S/ 284,900', label: 'Ventas del mes', delta: '8%', deltaUp: true, tone: 'accent' },
  { icon: 'inventory_2', value: '3,240 u', label: 'Productos vendidos', delta: '5%', deltaUp: true, tone: 'info' },
  { icon: 'pending_actions', value: '18', label: 'Pedidos pendientes', delta: '4 hoy', deltaUp: true, tone: 'secondary' },
  { icon: 'precision_manufacturing', value: '6 OP', label: 'Producción activa', delta: 'En curso', deltaUp: true, tone: 'info' },
  { icon: 'warning_amber', value: '9 ítems', label: 'Stock crítico', delta: 'Atención', deltaUp: false, tone: 'danger' },
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatIconModule, DatePipe, RouterLink],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  private readonly service     = inject(DashboardService);
  private readonly loteService = inject(LoteService);
  private readonly salesRef  = viewChild<ElementRef<HTMLCanvasElement>>('salesChart');
  private readonly invRef   = viewChild<ElementRef<HTMLCanvasElement>>('invChart');
  private readonly canalRef = viewChild<ElementRef<HTMLCanvasElement>>('canalChart');

  private charts: Chart[] = [];

  readonly loading  = signal(false);
  readonly errorResumen = signal<string | null>(null);
  readonly kpis     = signal<Kpi[]>(DEFAULT_KPIS);
  readonly resumen  = signal<DashboardResumen | null>(null);
  readonly lotes    = signal<LoteResponse[]>([]);

  readonly lotesAlerta = computed(() => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return this.lotes()
      .filter((l) => {
        if (!l.fechaVencimiento || l.estado === 'VENCIDO' || l.estado === 'AGOTADO' || l.estado === 'AGOTADO_MERMA') return false;
        const dias = Math.round((new Date(l.fechaVencimiento).getTime() - hoy.getTime()) / 86400000);
        return dias >= 0 && dias <= 30;
      })
      .sort((a, b) => (a.fechaVencimiento ?? '').localeCompare(b.fechaVencimiento ?? ''))
      .slice(0, 10);
  });

  readonly hoy = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  readonly ventasPorCanal = [
    { label: 'POS', pct: 48, color: '#9B4D00' },
    { label: 'E-commerce', pct: 31, color: '#F59E0B' },
    { label: 'Pedidos', pct: 15, color: '#A3C614' },
    { label: 'Manual', pct: 6, color: '#3B82F6' },
  ];

  readonly topProducts: TopProduct[] = [
    { name: 'Mix Frutos Secos 200g', pct: 92, color: '#9B4D00' },
    { name: 'Chips de Plátano 150g', pct: 78, color: '#F59E0B' },
    { name: 'Granola Natural 500g',  pct: 65, color: '#A3C614' },
    { name: 'Maní Tostado 250g',     pct: 54, color: '#3B82F6' },
    { name: 'Barras de Quinua',      pct: 41, color: '#9CA3AF' },
  ];

  readonly activity: Activity[] = [
    { icon: 'inventory_2',           text: 'Recepción OC-0231 registrada · Lote L-2206 · 480 u',              time: 'Hace 8 min', tone: 'text-accent' },
    { icon: 'point_of_sale',         text: 'Nueva venta POS #4821 · Ticket S/ 245.00 · 8 productos',          time: 'Hace 22 min', tone: 'text-secondary' },
    { icon: 'precision_manufacturing', text: 'OP-0098 pasó a "En proceso" · Granola Natural 500g · 300 u',   time: 'Hace 1 h',   tone: 'text-[#3B82F6]' },
    { icon: 'warning_amber',         text: 'Stock crítico: Maní Tostado 250g · Quedan 12 u (mínimo 50)',      time: 'Hace 2 h',   tone: 'text-[#EF4444]' },
    { icon: 'groups',                text: 'Nuevo cliente registrado · Bodega Don Carlos · RUC 20512…',        time: 'Hace 3 h',   tone: 'text-primary' },
  ];

  toneBg(tone: Kpi['tone']): string {
    const map: Record<Kpi['tone'], string> = {
      secondary: 'bg-[#FEF3C7] text-[#B45309]',
      accent:    'bg-[#ECFCCB] text-[#4D7C0F]',
      info:      'bg-[#DBEAFE] text-[#1D4ED8]',
      primary:   'bg-[#FBEAD9] text-[#9B4D00]',
      danger:    'bg-[#FEE2E2] text-[#B91C1C]',
    };
    return map[tone];
  }

  ngOnInit(): void {
    this.cargar();
    this.loteService.listar().subscribe({ next: (d) => this.lotes.set(d), error: () => {} });
  }

  private cargar(): void {
    this.loading.set(true);
    this.service.getResumen().subscribe({
      next: (data) => {
        this.resumen.set(data);
        this.kpis.set(this.mapearKpis(data));
        this.errorResumen.set(null);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorResumen.set('No se pudo cargar el resumen del dashboard. Intente recargar la página.');
        this.loading.set(false);
        console.error('Dashboard resumen error:', err);
      },
    });
  }

  diasParaVencer(fecha: string): number {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return Math.round((new Date(fecha).getTime() - hoy.getTime()) / 86400000);
  }

  private fmt(v: number): string {
    if (v >= 1_000_000) return `S/ ${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1000)      return `S/ ${(v / 1000).toFixed(1)}K`;
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0 }).format(v);
  }

  private mapearKpis(d: DashboardResumen): Kpi[] {
    const pendientes = (d.pedidosPendientesProcesar ?? 0) + (d.pedidosPendientesPago ?? 0);
    return [
      {
        icon: 'payments', tone: 'secondary',
        value: this.fmt(d.ventasDelDia ?? 0),
        label: 'Ventas del día',
        delta: 'Hoy', deltaUp: true,
      },
      {
        icon: 'trending_up', tone: 'accent',
        value: this.fmt(d.ventasDelMes ?? 0),
        label: 'Ventas del mes',
        delta: 'Este mes', deltaUp: true,
      },
      {
        icon: 'local_mall', tone: 'info',
        value: this.fmt(d.comprasDelMes ?? 0),
        label: 'Compras del mes',
        delta: 'Este mes', deltaUp: false,
      },
      {
        icon: 'pending_actions', tone: 'secondary',
        value: `${pendientes}`,
        label: 'Pedidos pendientes',
        delta: `${d.pedidosPendientesProcesar ?? 0} por procesar`, deltaUp: pendientes === 0,
      },
      {
        icon: 'delete_sweep', tone: 'danger',
        value: this.fmt(d.mermasDelMes ?? 0),
        label: 'Mermas del mes',
        delta: 'Este mes', deltaUp: false,
      },
      {
        icon: 'warning_amber', tone: 'danger',
        value: `${d.lotesProximosAVencer ?? 0} lotes`,
        label: 'Próximos a vencer',
        delta: 'En 30 días', deltaUp: false,
      },
    ];
  }

  ngAfterViewInit(): void {
    const sales = this.salesRef()?.nativeElement;
    if (sales) {
      this.charts.push(
        new Chart(sales, {
          type: 'bar',
          data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            datasets: [
              {
                label: 'Ventas',
                data: [180, 210, 195, 240, 230, 280, 300, 320, 360, 390, 410, 470],
                backgroundColor: (ctx) => (ctx.dataIndex === 11 ? '#9B4D00' : '#F59E0B'),
                borderRadius: 6,
                maxBarThickness: 28,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { grid: { color: '#F1ECE2' }, ticks: { color: '#9CA3AF' } },
              x: { grid: { display: false }, ticks: { color: '#9CA3AF' } },
            },
          },
        }),
      );
    }

    const canal = this.canalRef()?.nativeElement;
    if (canal) {
      this.charts.push(
        new Chart(canal, {
          type: 'doughnut',
          data: {
            labels: this.ventasPorCanal.map((c) => c.label),
            datasets: [{ data: this.ventasPorCanal.map((c) => c.pct), backgroundColor: this.ventasPorCanal.map((c) => c.color), borderWidth: 0 }],
          },
          options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false } } },
        }),
      );
    }

    const inv = this.invRef()?.nativeElement;
    if (inv) {
      this.charts.push(
        new Chart(inv, {
          type: 'doughnut',
          data: {
            labels: ['Principal', 'Producción', 'Distribución', 'Tienda'],
            datasets: [
              {
                data: [40, 25, 20, 15],
                backgroundColor: ['#9B4D00', '#F59E0B', '#A3C614', '#3B82F6'],
                borderWidth: 0,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: { legend: { display: false } },
          },
        }),
      );
    }
  }

  ngOnDestroy(): void {
    this.charts.forEach((c) => c.destroy());
  }
}
