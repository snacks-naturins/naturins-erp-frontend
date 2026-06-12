import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Chart, registerables } from 'chart.js';

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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './dashboard.html',
})
export class Dashboard implements AfterViewInit, OnDestroy {
  private readonly salesRef =
    viewChild<ElementRef<HTMLCanvasElement>>('salesChart');
  private readonly invRef =
    viewChild<ElementRef<HTMLCanvasElement>>('invChart');

  private charts: Chart[] = [];

  readonly hoy = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  readonly kpis: Kpi[] = [
    { icon: 'payments', value: 'S/ 12,480', label: 'Ventas del día', delta: '12%', deltaUp: true, tone: 'secondary' },
    { icon: 'trending_up', value: 'S/ 284,900', label: 'Ventas del mes', delta: '8%', deltaUp: true, tone: 'accent' },
    { icon: 'inventory_2', value: '3,240 u', label: 'Productos vendidos', delta: '5%', deltaUp: true, tone: 'info' },
    { icon: 'pending_actions', value: '18', label: 'Pedidos pendientes', delta: '4 hoy', deltaUp: true, tone: 'secondary' },
    { icon: 'precision_manufacturing', value: '6 OP', label: 'Producción activa', delta: 'En curso', deltaUp: true, tone: 'info' },
    { icon: 'warning_amber', value: '9 ítems', label: 'Stock crítico', delta: 'Atención', deltaUp: false, tone: 'danger' },
  ];

  readonly topProducts: TopProduct[] = [
    { name: 'Mix Frutos Secos 200g', pct: 92, color: '#9B4D00' },
    { name: 'Chips de Plátano 150g', pct: 78, color: '#F59E0B' },
    { name: 'Granola Natural 500g', pct: 65, color: '#A3C614' },
    { name: 'Maní Tostado 250g', pct: 54, color: '#3B82F6' },
    { name: 'Barras de Quinua', pct: 41, color: '#9CA3AF' },
  ];

  readonly activity: Activity[] = [
    { icon: 'inventory_2', text: 'Recepción OC-0231 registrada · Lote L-2206 · 480 u', time: 'Hace 8 min', tone: 'text-accent' },
    { icon: 'point_of_sale', text: 'Nueva venta POS #4821 · Ticket S/ 245.00 · 8 productos', time: 'Hace 22 min', tone: 'text-secondary' },
    { icon: 'precision_manufacturing', text: 'OP-0098 pasó a "En proceso" · Granola Natural 500g · 300 u', time: 'Hace 1 h', tone: 'text-[#3B82F6]' },
    { icon: 'warning_amber', text: 'Stock crítico: Maní Tostado 250g · Quedan 12 u (mínimo 50)', time: 'Hace 2 h', tone: 'text-[#EF4444]' },
    { icon: 'groups', text: 'Nuevo cliente registrado · Bodega Don Carlos · RUC 20512…', time: 'Hace 3 h', tone: 'text-primary' },
  ];

  toneBg(tone: Kpi['tone']): string {
    const map: Record<Kpi['tone'], string> = {
      secondary: 'bg-[#FEF3C7] text-[#B45309]',
      accent: 'bg-[#ECFCCB] text-[#4D7C0F]',
      info: 'bg-[#DBEAFE] text-[#1D4ED8]',
      primary: 'bg-[#FBEAD9] text-[#9B4D00]',
      danger: 'bg-[#FEE2E2] text-[#B91C1C]',
    };
    return map[tone];
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
