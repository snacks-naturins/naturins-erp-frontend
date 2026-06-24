import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { ProduccionService } from '../../services/produccion.service';
import { ProduccionResponse } from '../../models/produccion.model';

@Component({
  selector: 'app-produccion-lista',
  standalone: true,
  imports: [RouterLink, MatIconModule, NgTemplateOutlet],
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

  readonly planificadas = computed(() => this.ops().filter((o) => o.estado === 'PLANIFICADA'));
  readonly enProceso   = computed(() => this.ops().filter((o) => o.estado === 'EN_PROCESO'));
  readonly completadas = computed(() => this.ops().filter((o) => o.estado === 'COMPLETADA'));
  readonly canceladas  = computed(() => this.ops().filter((o) => o.estado === 'CANCELADA'));

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

  formatFecha(f: string): string {
    return new Date(f).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatMonto(v: number): string { return `S/ ${(v ?? 0).toFixed(2)}`; }

  readonly columnas = [
    { estado: 'PLANIFICADA', label: 'Planificada',  dotClass: 'bg-gray-400',  headerClass: 'border-gray-200', items: this.planificadas },
    { estado: 'EN_PROCESO',  label: 'En proceso',   dotClass: 'bg-amber-400', headerClass: 'border-amber-200', items: this.enProceso },
    { estado: 'COMPLETADA',  label: 'Completada',   dotClass: 'bg-green-400', headerClass: 'border-green-200', items: this.completadas },
    { estado: 'CANCELADA',   label: 'Cancelada',    dotClass: 'bg-red-300',   headerClass: 'border-red-200',  items: this.canceladas },
  ] as const;

  estadoBadge(estado: string): string {
    const map: Record<string, string> = {
      PLANIFICADA: 'bg-gray-100 text-gray-600',
      EN_PROCESO:  'bg-amber-100 text-amber-700',
      COMPLETADA:  'bg-green-100 text-green-700',
      CANCELADA:   'bg-red-100 text-red-500',
    };
    return map[estado] ?? 'bg-gray-100 text-gray-600';
  }
}
