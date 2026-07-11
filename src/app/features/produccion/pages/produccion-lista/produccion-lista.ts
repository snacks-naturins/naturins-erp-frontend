import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { ProduccionService } from '../../services/produccion.service';
import { ProduccionResponse } from '../../models/produccion.model';
import { FechaPipe } from '../../../../shared/pipes/fecha.pipe';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';

@Component({
  selector: 'app-produccion-lista',
  standalone: true,
  imports: [RouterLink, MatIconModule, FechaPipe, BreadcrumbComponent],
  templateUrl: './produccion-lista.html',
})
export class ProduccionLista implements OnInit {
  private readonly router = inject(Router);
  private readonly service = inject(ProduccionService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly ops = signal<ProduccionResponse[]>([]);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly modalOpen = signal(false);
  readonly observacion = signal('');
  readonly accionando = signal<string | null>(null);
  readonly mostrarCanceladas = signal(false);

  readonly planificadas = computed(() => this.ops().filter((o) => o.estado === 'PLANIFICADA'));
  readonly enProceso   = computed(() => this.ops().filter((o) => o.estado === 'EN_PROCESO'));
  readonly completadas = computed(() => this.ops().filter((o) => o.estado === 'COMPLETADA'));
  readonly canceladas  = computed(() => this.ops().filter((o) => o.estado === 'CANCELADA'));

  readonly opsPorEstado = computed(() => {
    const m = new Map<string, ProduccionResponse[]>();
    for (const op of this.ops()) {
      const list = m.get(op.estado) ?? [];
      list.push(op);
      m.set(op.estado, list);
    }
    return m;
  });

  readonly kpiTotal      = computed(() => this.ops().filter(o => o.estado !== 'CANCELADA').length);
  readonly kpiEnProceso  = computed(() => this.enProceso().length);
  readonly kpiCompletadas = computed(() => this.completadas().length);

  readonly columnas = [
    { estado: 'PLANIFICADA', label: 'Planificada', color: 'border-gray-300',  dot: 'bg-gray-400',  accionLabel: 'Iniciar',  accionIcon: 'play_arrow' },
    { estado: 'EN_PROCESO',  label: 'En proceso',  color: 'border-amber-400', dot: 'bg-amber-400', accionLabel: null as string | null, accionIcon: null as string | null },
    { estado: 'COMPLETADA',  label: 'Completada',  color: 'border-green-400', dot: 'bg-green-400', accionLabel: null as string | null, accionIcon: null as string | null },
  ];

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.listar().subscribe({
      next: (d) => {
        this.ops.set(d.sort((a, b) => b.fechaProduccion.localeCompare(a.fechaProduccion)));
        this.loading.set(false);
      },
      error: () => { this.error.set('No se pudieron cargar las órdenes.'); this.loading.set(false); },
    });
  }

  abrirNuevaOP(): void {
    this.observacion.set('');
    this.formError.set(null);
    this.modalOpen.set(true);
  }

  cerrarModal(): void { this.modalOpen.set(false); }

  onObservacion(e: Event): void {
    this.observacion.set((e.target as HTMLTextAreaElement).value);
  }

  crearOP(): void {
    this.formError.set(null);
    this.saving.set(true);
    this.service.crear({ observacion: this.observacion() || undefined }).subscribe({
      next: (op) => { this.saving.set(false); this.modalOpen.set(false); this.router.navigate(['/produccion', op.id]); },
      error: (err) => { this.saving.set(false); this.formError.set(err?.error?.message ?? 'No se pudo crear la orden.'); },
    });
  }

  irDetalle(id: string): void { this.router.navigate(['/produccion', id]); }

  iniciar(op: ProduccionResponse, event: Event): void {
    event.stopPropagation();
    this.accionando.set(op.id);
    this.service.actualizar(op.id, { estado: 'EN_PROCESO' }).subscribe({
      next: (updated) => {
        this.ops.update(list => list.map(o => o.id === updated.id ? updated : o));
        this.accionando.set(null);
      },
      error: () => this.accionando.set(null),
    });
  }

  formatMonto(v: number): string { return `S/ ${(v ?? 0).toFixed(2)}`; }
}
