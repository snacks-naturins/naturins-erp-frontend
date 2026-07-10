import { Component, OnInit, Input, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';

import { MermaService }             from '../../../../services/merma.service';
import { DetalleProduccionService } from '../../../../services/detalle-produccion.service';
import { LoteService }              from '../../../../../inventario/services/lote.service';
import { MermaResponse, TipoMerma } from '../../../../models/merma.model';
import { LoteResponse }             from '../../../../../inventario/models/lote.model';

@Component({
  selector: 'app-merma-tab',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './merma-tab.html',
})
export class MermaTab implements OnInit {
  @Input({ required: true }) opId!: string;

  private readonly svcMerma = inject(MermaService);
  private readonly svcDet   = inject(DetalleProduccionService);
  private readonly svcLote  = inject(LoteService);

  readonly loading     = signal(true);
  readonly mermas      = signal<MermaResponse[]>([]);
  readonly lotesOP     = signal<LoteResponse[]>([]);

  readonly modalOpen   = signal(false);
  readonly saving      = signal(false);
  readonly error       = signal<string | null>(null);
  readonly loteId      = signal('');
  readonly tipo        = signal<TipoMerma>('PROCESO');
  readonly cantidad    = signal('');
  readonly obs         = signal('');
  readonly deleteTarget = signal<MermaResponse | null>(null);
  readonly deleting    = signal(false);

  readonly tiposMerma: { value: TipoMerma; label: string }[] = [
    { value: 'PROCESO',       label: 'Proceso productivo' },
    { value: 'VENCIMIENTO',   label: 'Vencimiento' },
    { value: 'DANO_FISICO',   label: 'Daño físico' },
    { value: 'CONTAMINACION', label: 'Contaminación' },
    { value: 'ERROR_CONTEO',  label: 'Error de conteo' },
    { value: 'DEVOLUCION',    label: 'Devolución' },
    { value: 'ROBO',          label: 'Robo' },
  ];

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    forkJoin([
      this.svcDet.porProduccion(this.opId),
      this.svcLote.listar(),
      this.svcMerma.listar(),
    ]).subscribe({
      next: ([salidas, lotes, mermas]) => {
        const presIds = new Set(salidas.map((s) => s.presentacionProductoId).filter(Boolean));
        const lotesFiltrados = lotes.filter((l) => presIds.has(l.presentacionProductoId));
        this.lotesOP.set(lotesFiltrados);
        const loteIds = new Set(lotesFiltrados.map((l) => l.id));
        this.mermas.set(mermas.filter((m) => loteIds.has(m.loteId)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  abrirModal(): void {
    this.error.set(null);
    this.loteId.set('');
    this.tipo.set('PROCESO');
    this.cantidad.set('');
    this.obs.set('');
    this.modalOpen.set(true);
  }
  cerrarModal(): void { this.modalOpen.set(false); }

  guardar(): void {
    const lid = this.loteId(), cant = parseFloat(this.cantidad());
    if (!lid) { this.error.set('Selecciona un lote.'); return; }
    if (isNaN(cant) || cant <= 0) { this.error.set('Cantidad debe ser > 0.'); return; }
    this.saving.set(true);
    this.error.set(null);
    this.svcMerma.crear({ loteId: lid, tipo: this.tipo(), cantidad: cant, observacion: this.obs() || undefined }).subscribe({
      next: () => { this.saving.set(false); this.modalOpen.set(false); this.cargar(); },
      error: (err) => { this.saving.set(false); this.error.set(err?.error?.message ?? 'Error al registrar merma.'); },
    });
  }

  pedirEliminar(m: MermaResponse): void { this.deleteTarget.set(m); }
  cancelarEliminar(): void { this.deleteTarget.set(null); }

  confirmarEliminar(): void {
    const m = this.deleteTarget();
    if (!m) return;
    this.deleting.set(true);
    this.svcMerma.eliminar(m.id).subscribe({
      next: () => { this.deleting.set(false); this.deleteTarget.set(null); this.cargar(); },
      error: () => this.deleting.set(false),
    });
  }

  fmt(v: number): string { return v?.toFixed(3).replace(/\.?0+$/, '') ?? '0'; }
}
