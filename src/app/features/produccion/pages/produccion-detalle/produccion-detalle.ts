import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { ProduccionService } from '../../services/produccion.service';
import { AlmacenService }   from '../../../inventario/services/almacen.service';

import { ProduccionResponse } from '../../models/produccion.model';
import { AlmacenResponse }    from '../../../inventario/models/almacen.model';
import { FechaPipe }          from '../../../../shared/pipes/fecha.pipe';

import { InsumoTab } from './components/insumo-tab/insumo-tab';
import { SalidaTab } from './components/salida-tab/salida-tab';
import { MermaTab }  from './components/merma-tab/merma-tab';

@Component({
  selector: 'app-produccion-detalle',
  standalone: true,
  imports: [RouterLink, MatIconModule, FechaPipe, InsumoTab, SalidaTab, MermaTab],
  templateUrl: './produccion-detalle.html',
})
export class ProduccionDetalle implements OnInit {
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svcOp  = inject(ProduccionService);
  private readonly svcAlm = inject(AlmacenService);

  // ── Estado principal ───────────────────────────────────────
  readonly loading   = signal(true);
  readonly error     = signal<string | null>(null);
  readonly op        = signal<ProduccionResponse | null>(null);
  readonly activeTab = signal<'insumos' | 'salidas' | 'mermas'>('insumos');

  // ── Computed permisos ──────────────────────────────────────
  readonly isPlanificada = computed(() => this.op()?.estado === 'PLANIFICADA');
  readonly canEdit       = computed(() => ['PLANIFICADA', 'EN_PROCESO'].includes(this.op()?.estado ?? ''));
  readonly canComplete   = computed(() => ['PLANIFICADA', 'EN_PROCESO'].includes(this.op()?.estado ?? ''));
  readonly canCancel     = computed(() => !['COMPLETADA', 'CANCELADA'].includes(this.op()?.estado ?? ''));
  readonly showMermas    = computed(() => this.op()?.estado === 'COMPLETADA');

  // ── Tab counts (from child components — keep totals via signals) ──
  readonly insumoCount = signal(0);
  readonly salidaCount = signal(0);
  readonly mermaCount  = signal(0);

  // ── Completar modal ────────────────────────────────────────
  readonly modalCompletar     = signal(false);
  readonly almacenes           = signal<AlmacenResponse[]>([]);
  readonly completarAlmacenId  = signal('');
  readonly completarFechaVen   = signal('');
  readonly savingCompletar     = signal(false);
  readonly errorCompletar      = signal<string | null>(null);

  // ── Cancelar / Iniciar confirmación ───────────────────────
  readonly confirmCancelar = signal(false);
  readonly savingCancelar  = signal(false);
  readonly errorCancelar   = signal<string | null>(null);
  readonly confirmIniciar  = signal(false);
  readonly savingIniciar   = signal(false);
  readonly errorIniciar    = signal<string | null>(null);

  // ── Lifecycle ──────────────────────────────────────────────
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/produccion']); return; }
    this.cargarOP(id);
  }

  private cargarOP(id: string): void {
    this.loading.set(true);
    this.svcOp.buscarPorId(id).subscribe({
      next: (op) => { this.op.set(op); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar la orden.'); this.loading.set(false); },
    });
  }

  refrescarOP(): void {
    const id = this.op()?.id;
    if (!id) return;
    this.svcOp.buscarPorId(id).subscribe({
      next: (op) => this.op.set(op),
      error: () => { this.error.set('Error al refrescar la orden.'); },
    });
  }

  setTab(tab: 'insumos' | 'salidas' | 'mermas'): void {
    this.activeTab.set(tab);
  }

  // ── Completar ──────────────────────────────────────────────
  abrirCompletar(): void {
    this.errorCompletar.set(null);
    this.completarAlmacenId.set('');
    this.completarFechaVen.set('');
    this.modalCompletar.set(true);
    if (this.almacenes().length === 0) {
      this.svcAlm.listarPorEstado('ACTIVO').subscribe({
        next: (d) => this.almacenes.set(d),
        error: () => { this.almacenes.set([]); },
      });
    }
  }

  cerrarCompletar(): void { this.modalCompletar.set(false); }

  ejecutarCompletar(): void {
    if (!this.completarAlmacenId()) { this.errorCompletar.set('Selecciona un almacén destino.'); return; }
    const op = this.op();
    if (!op) return;
    this.savingCompletar.set(true);
    this.errorCompletar.set(null);
    this.svcOp.completar(op.id, {
      almacenId: this.completarAlmacenId(),
      fechaVencimiento: this.completarFechaVen() || null,
    }).subscribe({
      next: () => { this.savingCompletar.set(false); this.modalCompletar.set(false); this.cargarOP(op.id); },
      error: (err) => { this.savingCompletar.set(false); this.errorCompletar.set(err?.error?.message ?? 'No se pudo completar la producción.'); },
    });
  }

  // ── Iniciar ────────────────────────────────────────────────
  abrirIniciar(): void { this.errorIniciar.set(null); this.confirmIniciar.set(true); }
  cerrarIniciar(): void { this.confirmIniciar.set(false); }

  ejecutarIniciar(): void {
    const op = this.op();
    if (!op) return;
    this.savingIniciar.set(true);
    this.svcOp.actualizar(op.id, { estado: 'EN_PROCESO' }).subscribe({
      next: (u) => { this.op.set(u); this.savingIniciar.set(false); this.confirmIniciar.set(false); },
      error: (err) => { this.savingIniciar.set(false); this.errorIniciar.set(err?.error?.message ?? 'Error al actualizar.'); },
    });
  }

  // ── Cancelar ───────────────────────────────────────────────
  abrirCancelar(): void { this.errorCancelar.set(null); this.confirmCancelar.set(true); }
  cerrarCancelar(): void { this.confirmCancelar.set(false); }

  ejecutarCancelar(): void {
    const op = this.op();
    if (!op) return;
    this.savingCancelar.set(true);
      this.svcOp.cancelar(op.id).subscribe({
        next: () => {
          this.savingCancelar.set(false);
          this.confirmCancelar.set(false);
          this.svcOp.buscarPorId(op.id).subscribe({
            next: (u) => this.op.set(u),
            error: () => { this.error.set('Error al recargar la orden tras cancelar.'); },
          });
        },
        error: (err) => { this.savingCancelar.set(false); this.errorCancelar.set(err?.error?.message ?? 'No se pudo cancelar.'); },
      });
  }

  // ── Helpers ────────────────────────────────────────────────
  estadoBadge(estado: string): { label: string; classes: string } {
    const map: Record<string, { label: string; classes: string }> = {
      PLANIFICADA: { label: 'Planificada', classes: 'bg-gray-100 text-gray-600' },
      EN_PROCESO:  { label: 'En proceso',  classes: 'bg-amber-100 text-amber-700' },
      COMPLETADA:  { label: 'Completada',  classes: 'bg-green-100 text-green-700' },
      CANCELADA:   { label: 'Cancelada',   classes: 'bg-red-100 text-red-500' },
    };
    return map[estado] ?? { label: estado, classes: 'bg-gray-100 text-gray-600' };
  }

  formatMonto(v: number): string { return `S/ ${(v ?? 0).toFixed(2)}`; }
}
