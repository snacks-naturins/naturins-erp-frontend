import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';

import { ProduccionService }        from '../../services/produccion.service';
import { DetalleProduccionService } from '../../services/detalle-produccion.service';
import { InsumoProduccionService }  from '../../services/insumo-produccion.service';
import { MermaService }             from '../../services/merma.service';

import { ProduccionResponse }         from '../../models/produccion.model';
import { DetalleProduccionResponse }  from '../../models/detalle-produccion.model';
import { InsumoProduccionResponse }   from '../../models/insumo-produccion.model';
import { MermaResponse, TipoMerma }   from '../../models/merma.model';

import { MateriaPrimaService }  from '../../../inventario/services/materia-prima.service';
import { PresentacionService }  from '../../../inventario/services/presentacion.service';
import { AlmacenService }       from '../../../inventario/services/almacen.service';
import { LoteService }          from '../../../inventario/services/lote.service';

import { MateriaPrimaResponse }  from '../../../inventario/models/materia-prima.model';
import { PresentacionResponse }  from '../../../inventario/models/presentacion.model';
import { AlmacenResponse }       from '../../../inventario/models/almacen.model';
import { LoteResponse }          from '../../../inventario/models/lote.model';
import { FechaPipe } from '../../../../shared/pipes/fecha.pipe';

interface LineaInsumo  { mp: MateriaPrimaResponse;      cantidad: string; costo: string; }
interface LineaSalida  { pres: PresentacionResponse;    cantidad: string; }

@Component({
  selector: 'app-produccion-detalle',
  standalone: true,
  imports: [RouterLink, MatIconModule, FechaPipe],
  templateUrl: './produccion-detalle.html',
})
export class ProduccionDetalle implements OnInit {
  private readonly route    = inject(ActivatedRoute);
  private readonly router   = inject(Router);
  private readonly svcOp    = inject(ProduccionService);
  private readonly svcDet   = inject(DetalleProduccionService);
  private readonly svcIns   = inject(InsumoProduccionService);
  private readonly svcMerma = inject(MermaService);
  private readonly svcMp    = inject(MateriaPrimaService);
  private readonly svcPres  = inject(PresentacionService);
  private readonly svcAlm   = inject(AlmacenService);
  private readonly svcLote  = inject(LoteService);

  // ── Estado principal ───────────────────────────────────────
  readonly loading  = signal(true);
  readonly error    = signal<string | null>(null);
  readonly op       = signal<ProduccionResponse | null>(null);
  readonly activeTab = signal<'insumos' | 'salidas' | 'mermas'>('insumos');

  // ── Computed permisos ──────────────────────────────────────
  readonly isPlanificada = computed(() => this.op()?.estado === 'PLANIFICADA');
  readonly canEdit       = computed(() => ['PLANIFICADA', 'EN_PROCESO'].includes(this.op()?.estado ?? ''));
  readonly canComplete   = computed(() => ['PLANIFICADA', 'EN_PROCESO'].includes(this.op()?.estado ?? ''));
  readonly canCancel     = computed(() => !['COMPLETADA', 'CANCELADA'].includes(this.op()?.estado ?? ''));
  readonly showMermas    = computed(() => this.op()?.estado === 'COMPLETADA');

  // ── Insumos tab ────────────────────────────────────────────
  readonly insumos        = signal<InsumoProduccionResponse[]>([]);
  readonly loadingInsumos = signal(false);
  readonly materiasPrimas = signal<MateriaPrimaResponse[]>([]);

  readonly modalInsumos    = signal(false);
  readonly savingInsumos   = signal(false);
  readonly errorInsumos    = signal<string | null>(null);
  readonly lineasInsumos   = signal<LineaInsumo[]>([]);
  readonly lineasInsumosValidas = computed(() =>
    this.lineasInsumos().filter((l) => parseFloat(l.cantidad) > 0 && parseFloat(l.costo) > 0));

  readonly modalEditInsumo  = signal(false);
  readonly editInsumoId     = signal<string | null>(null);
  readonly editInsumoNombre = signal('');
  readonly editInsumoCant   = signal('');
  readonly editInsumoCosto  = signal('');
  readonly savingEditInsumo = signal(false);
  readonly errorEditInsumo  = signal<string | null>(null);
  readonly insumoToDelete   = signal<InsumoProduccionResponse | null>(null);
  readonly deletingInsumo   = signal(false);
  readonly errorDeleteInsumo = signal<string | null>(null);

  // ── Salidas tab ────────────────────────────────────────────
  readonly salidas        = signal<DetalleProduccionResponse[]>([]);
  readonly loadingSalidas = signal(false);
  readonly presentaciones = signal<PresentacionResponse[]>([]);

  readonly modalSalidas         = signal(false);
  readonly savingSalidas        = signal(false);
  readonly errorSalidas         = signal<string | null>(null);
  readonly loadingPresentaciones = signal(false);
  readonly lineasSalidas        = signal<LineaSalida[]>([]);
  readonly lineasSalidasValidas = computed(() =>
    this.lineasSalidas().filter((l) => parseFloat(l.cantidad) > 0));

  readonly modalEditSalida  = signal(false);
  readonly editSalidaId     = signal<string | null>(null);
  readonly editSalidaNombre = signal('');
  readonly editSalidaCant   = signal('');
  readonly savingEditSalida = signal(false);
  readonly errorEditSalida  = signal<string | null>(null);
  readonly salidaToDelete   = signal<DetalleProduccionResponse | null>(null);
  readonly deletingSalida   = signal(false);
  readonly errorDeleteSalida = signal<string | null>(null);

  // ── Mermas tab ─────────────────────────────────────────────
  readonly mermas         = signal<MermaResponse[]>([]);
  readonly loadingMermas  = signal(false);
  readonly lotesOP        = signal<LoteResponse[]>([]);

  readonly modalMerma     = signal(false);
  readonly savingMerma    = signal(false);
  readonly errorMerma     = signal<string | null>(null);
  readonly mermaLoteId    = signal('');
  readonly mermaTipo      = signal<TipoMerma>('PROCESO');
  readonly mermaCantidad  = signal('');
  readonly mermaObs       = signal('');
  readonly mermaToDelete  = signal<MermaResponse | null>(null);
  readonly deletingMerma  = signal(false);

  readonly tiposMerma: { value: TipoMerma; label: string }[] = [
    { value: 'PROCESO',       label: 'Proceso productivo' },
    { value: 'VENCIMIENTO',   label: 'Vencimiento' },
    { value: 'DANO_FISICO',   label: 'Daño físico' },
    { value: 'CONTAMINACION', label: 'Contaminación' },
    { value: 'ERROR_CONTEO',  label: 'Error de conteo' },
    { value: 'DEVOLUCION',    label: 'Devolución' },
    { value: 'ROBO',          label: 'Robo' },
  ];

  // ── Completar modal ────────────────────────────────────────
  readonly modalCompletar     = signal(false);
  readonly almacenes          = signal<AlmacenResponse[]>([]);
  readonly completarAlmacenId = signal('');
  readonly completarFechaVen  = signal('');
  readonly savingCompletar    = signal(false);
  readonly errorCompletar     = signal<string | null>(null);

  // ── Cancelar / Iniciar confirmación ───────────────────────
  readonly confirmCancelar   = signal(false);
  readonly savingCancelar    = signal(false);
  readonly errorCancelar     = signal<string | null>(null);
  readonly confirmIniciar    = signal(false);
  readonly savingIniciar     = signal(false);
  readonly errorIniciar      = signal<string | null>(null);

  // ── Lifecycle ──────────────────────────────────────────────
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/produccion']); return; }
    this.cargarOP(id);
  }

  private cargarOP(id: string): void {
    this.loading.set(true);
    this.svcOp.buscarPorId(id).subscribe({
      next: (op) => { this.op.set(op); this.loading.set(false); this.cargarInsumos(id); this.cargarSalidas(id); },
      error: () => { this.error.set('No se pudo cargar la orden.'); this.loading.set(false); },
    });
  }

  private refrescarOP(): void {
    const id = this.op()?.id;
    if (!id) return;
    this.svcOp.buscarPorId(id).subscribe({ next: (op) => this.op.set(op) });
  }

  // ── Insumos ────────────────────────────────────────────────
  private cargarInsumos(id: string): void {
    this.loadingInsumos.set(true);
    this.svcIns.porProduccion(id).subscribe({
      next: (d) => { this.insumos.set(d); this.loadingInsumos.set(false); },
      error: () => this.loadingInsumos.set(false),
    });
  }

  setTab(tab: 'insumos' | 'salidas' | 'mermas'): void {
    this.activeTab.set(tab);
    if (tab === 'mermas' && this.showMermas() && this.mermas().length === 0 && !this.loadingMermas()) {
      this.cargarMermasTab();
    }
  }

  abrirModalInsumos(): void {
    this.errorInsumos.set(null);
    this.lineasInsumos.set([]);
    this.modalInsumos.set(true);
    if (this.materiasPrimas().length === 0) {
      this.svcMp.listarActivos().subscribe({ next: (d) => this.materiasPrimas.set(d) });
    }
  }

  cerrarModalInsumos(): void { this.modalInsumos.set(false); }

  isInsumoSelected(mpId: string): boolean { return this.lineasInsumos().some((l) => l.mp.id === mpId); }
  getLineaInsumo(mpId: string): LineaInsumo | undefined { return this.lineasInsumos().find((l) => l.mp.id === mpId); }

  toggleInsumo(mp: MateriaPrimaResponse): void {
    if (this.isInsumoSelected(mp.id)) {
      this.lineasInsumos.update((l) => l.filter((x) => x.mp.id !== mp.id));
    } else {
      this.lineasInsumos.update((l) => [...l, { mp, cantidad: '', costo: mp.costoUnitario?.toFixed(2) ?? '' }]);
    }
  }

  setInsumoQty(id: string, e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.lineasInsumos.update((l) => l.map((x) => x.mp.id === id ? { ...x, cantidad: v } : x));
  }

  setInsumoCosto(id: string, e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.lineasInsumos.update((l) => l.map((x) => x.mp.id === id ? { ...x, costo: v } : x));
  }

  guardarInsumos(): void {
    const validas = this.lineasInsumosValidas();
    if (!validas.length) { this.errorInsumos.set('Selecciona al menos un insumo con cantidad y costo.'); return; }
    const op = this.op();
    if (!op) return;
    this.savingInsumos.set(true);
    this.errorInsumos.set(null);
    forkJoin(validas.map((l) => this.svcIns.crear({
      produccionId: op.id,
      materiaPrimaId: l.mp.id,
      cantidadUsada: parseFloat(l.cantidad),
      costoUnitario: parseFloat(l.costo),
    }))).subscribe({
      next: () => { this.savingInsumos.set(false); this.modalInsumos.set(false); this.cargarInsumos(op.id); this.refrescarOP(); },
      error: (err) => { this.savingInsumos.set(false); this.errorInsumos.set(err?.error?.message ?? 'Error al agregar insumos.'); },
    });
  }

  abrirEditInsumo(ins: InsumoProduccionResponse): void {
    this.errorEditInsumo.set(null);
    this.editInsumoId.set(ins.id);
    this.editInsumoNombre.set(ins.nombreMateriaPrima);
    this.editInsumoCant.set(String(ins.cantidadUsada));
    this.editInsumoCosto.set(String(ins.costoUnitario));
    this.modalEditInsumo.set(true);
  }

  cerrarEditInsumo(): void { this.modalEditInsumo.set(false); }

  guardarEditInsumo(): void {
    const c = parseFloat(this.editInsumoCant()), p = parseFloat(this.editInsumoCosto());
    if (isNaN(c) || c <= 0 || isNaN(p) || p <= 0) { this.errorEditInsumo.set('Cantidad y costo deben ser > 0.'); return; }
    const id = this.editInsumoId();
    if (!id) return;
    this.savingEditInsumo.set(true);
    this.svcIns.actualizar(id, { cantidadUsada: c, costoUnitario: p }).subscribe({
      next: () => { this.savingEditInsumo.set(false); this.modalEditInsumo.set(false); this.cargarInsumos(this.op()!.id); this.refrescarOP(); },
      error: (err) => { this.savingEditInsumo.set(false); this.errorEditInsumo.set(err?.error?.message ?? 'Error al editar.'); },
    });
  }

  pedirEliminarInsumo(ins: InsumoProduccionResponse): void { this.errorDeleteInsumo.set(null); this.insumoToDelete.set(ins); }
  cancelarEliminarInsumo(): void { this.insumoToDelete.set(null); }

  confirmarEliminarInsumo(): void {
    const ins = this.insumoToDelete();
    if (!ins) return;
    this.deletingInsumo.set(true);
    this.svcIns.eliminar(ins.id).subscribe({
      next: () => { this.deletingInsumo.set(false); this.insumoToDelete.set(null); this.cargarInsumos(this.op()!.id); this.refrescarOP(); },
      error: (err) => { this.deletingInsumo.set(false); this.errorDeleteInsumo.set(err?.error?.message ?? 'Error al eliminar.'); },
    });
  }

  // ── Salidas ────────────────────────────────────────────────
  private cargarSalidas(id: string): void {
    this.loadingSalidas.set(true);
    this.svcDet.porProduccion(id).subscribe({
      next: (d) => { this.salidas.set(d); this.loadingSalidas.set(false); },
      error: () => this.loadingSalidas.set(false),
    });
  }

  abrirModalSalidas(): void {
    this.errorSalidas.set(null);
    this.lineasSalidas.set([]);
    this.modalSalidas.set(true);
    if (this.presentaciones().length === 0) {
      this.loadingPresentaciones.set(true);
      this.svcPres.listar().subscribe({
        next: (d) => {
          this.presentaciones.set(d.filter((p) => p.estado !== 'DESCONTINUADO'));
          this.loadingPresentaciones.set(false);
        },
        error: () => {
          this.loadingPresentaciones.set(false);
          this.errorSalidas.set('No se pudieron cargar las presentaciones.');
        },
      });
    }
  }

  cerrarModalSalidas(): void { this.modalSalidas.set(false); }

  isSalidaSelected(presId: string): boolean { return this.lineasSalidas().some((l) => l.pres.id === presId); }
  getLineaSalida(presId: string): LineaSalida | undefined { return this.lineasSalidas().find((l) => l.pres.id === presId); }

  toggleSalida(pres: PresentacionResponse): void {
    if (this.isSalidaSelected(pres.id)) {
      this.lineasSalidas.update((l) => l.filter((x) => x.pres.id !== pres.id));
    } else {
      this.lineasSalidas.update((l) => [...l, { pres, cantidad: '' }]);
    }
  }

  setSalidaQty(id: string, e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.lineasSalidas.update((l) => l.map((x) => x.pres.id === id ? { ...x, cantidad: v } : x));
  }

  guardarSalidas(): void {
    const validas = this.lineasSalidasValidas();
    if (!validas.length) { this.errorSalidas.set('Selecciona al menos un producto con cantidad.'); return; }
    const op = this.op();
    if (!op) return;
    this.savingSalidas.set(true);
    this.errorSalidas.set(null);
    forkJoin(validas.map((l) => this.svcDet.crear({
      produccionId: op.id,
      presentacionProductoId: l.pres.id,
      cantidadProducida: parseFloat(l.cantidad),
    }))).subscribe({
      next: () => { this.savingSalidas.set(false); this.modalSalidas.set(false); this.cargarSalidas(op.id); },
      error: (err) => { this.savingSalidas.set(false); this.errorSalidas.set(err?.error?.message ?? 'Error al agregar salidas.'); },
    });
  }

  abrirEditSalida(sal: DetalleProduccionResponse): void {
    this.errorEditSalida.set(null);
    this.editSalidaId.set(sal.id);
    this.editSalidaNombre.set(sal.nombrePresentacionProducto ?? '');
    this.editSalidaCant.set(String(sal.cantidadProducida));
    this.modalEditSalida.set(true);
  }

  cerrarEditSalida(): void { this.modalEditSalida.set(false); }

  guardarEditSalida(): void {
    const c = parseFloat(this.editSalidaCant());
    if (isNaN(c) || c <= 0) { this.errorEditSalida.set('Cantidad debe ser > 0.'); return; }
    const id = this.editSalidaId();
    if (!id) return;
    this.savingEditSalida.set(true);
    this.svcDet.actualizar(id, { cantidadProducida: c }).subscribe({
      next: () => { this.savingEditSalida.set(false); this.modalEditSalida.set(false); this.cargarSalidas(this.op()!.id); },
      error: (err) => { this.savingEditSalida.set(false); this.errorEditSalida.set(err?.error?.message ?? 'Error al editar.'); },
    });
  }

  pedirEliminarSalida(sal: DetalleProduccionResponse): void { this.errorDeleteSalida.set(null); this.salidaToDelete.set(sal); }
  cancelarEliminarSalida(): void { this.salidaToDelete.set(null); }

  confirmarEliminarSalida(): void {
    const sal = this.salidaToDelete();
    if (!sal) return;
    this.deletingSalida.set(true);
    this.svcDet.eliminar(sal.id).subscribe({
      next: () => { this.deletingSalida.set(false); this.salidaToDelete.set(null); this.cargarSalidas(this.op()!.id); },
      error: (err) => { this.deletingSalida.set(false); this.errorDeleteSalida.set(err?.error?.message ?? 'Error al eliminar.'); },
    });
  }

  // ── Mermas ─────────────────────────────────────────────────
  private cargarMermasTab(): void {
    this.loadingMermas.set(true);
    const presIds = new Set(this.salidas().map((s) => s.presentacionProductoId).filter(Boolean));
    forkJoin([this.svcLote.listar(), this.svcMerma.listar()]).subscribe({
      next: ([lotes, mermas]) => {
        const lotesFiltrados = lotes.filter((l) => presIds.has(l.presentacionProductoId));
        this.lotesOP.set(lotesFiltrados);
        const loteIds = new Set(lotesFiltrados.map((l) => l.id));
        this.mermas.set(mermas.filter((m) => loteIds.has(m.loteId)));
        this.loadingMermas.set(false);
      },
      error: () => this.loadingMermas.set(false),
    });
  }

  abrirModalMerma(): void {
    this.errorMerma.set(null);
    this.mermaLoteId.set('');
    this.mermaTipo.set('PROCESO');
    this.mermaCantidad.set('');
    this.mermaObs.set('');
    this.modalMerma.set(true);
  }

  cerrarModalMerma(): void { this.modalMerma.set(false); }

  onMermaLote(e: Event): void { this.mermaLoteId.set((e.target as HTMLSelectElement).value); }
  onMermaTipo(e: Event): void { this.mermaTipo.set((e.target as HTMLSelectElement).value as TipoMerma); }
  onMermaCantidad(e: Event): void { this.mermaCantidad.set((e.target as HTMLInputElement).value); }
  onMermaObs(e: Event): void { this.mermaObs.set((e.target as HTMLTextAreaElement).value); }

  guardarMerma(): void {
    const loteId = this.mermaLoteId(), cantidad = parseFloat(this.mermaCantidad());
    if (!loteId) { this.errorMerma.set('Selecciona un lote.'); return; }
    if (isNaN(cantidad) || cantidad <= 0) { this.errorMerma.set('Cantidad debe ser > 0.'); return; }
    this.savingMerma.set(true);
    this.errorMerma.set(null);
    this.svcMerma.crear({ loteId, tipo: this.mermaTipo(), cantidad, observacion: this.mermaObs() || undefined }).subscribe({
      next: () => { this.savingMerma.set(false); this.modalMerma.set(false); this.cargarMermasTab(); },
      error: (err) => { this.savingMerma.set(false); this.errorMerma.set(err?.error?.message ?? 'Error al registrar merma.'); },
    });
  }

  pedirEliminarMerma(m: MermaResponse): void { this.mermaToDelete.set(m); }
  cancelarEliminarMerma(): void { this.mermaToDelete.set(null); }

  confirmarEliminarMerma(): void {
    const m = this.mermaToDelete();
    if (!m) return;
    this.deletingMerma.set(true);
    this.svcMerma.eliminar(m.id).subscribe({
      next: () => { this.deletingMerma.set(false); this.mermaToDelete.set(null); this.cargarMermasTab(); },
      error: () => this.deletingMerma.set(false),
    });
  }

  // ── Completar ──────────────────────────────────────────────
  abrirCompletar(): void {
    this.errorCompletar.set(null);
    this.completarAlmacenId.set('');
    this.completarFechaVen.set('');
    this.modalCompletar.set(true);
    if (this.almacenes().length === 0) {
      this.svcAlm.listarPorEstado('ACTIVO').subscribe({ next: (d) => this.almacenes.set(d) });
    }
  }

  cerrarCompletar(): void { this.modalCompletar.set(false); }
  onAlmacen(e: Event): void { this.completarAlmacenId.set((e.target as HTMLSelectElement).value); }
  onFechaVen(e: Event): void { this.completarFechaVen.set((e.target as HTMLInputElement).value); }

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
      next: () => {
        this.savingCompletar.set(false);
        this.modalCompletar.set(false);
        this.cargarOP(op.id);
      },
      error: (err) => { this.savingCompletar.set(false); this.errorCompletar.set(err?.error?.message ?? 'No se pudo completar la producción.'); },
    });
  }

  // ── Iniciar proceso ────────────────────────────────────────
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
      next: () => { this.savingCancelar.set(false); this.confirmCancelar.set(false); this.svcOp.buscarPorId(op.id).subscribe({ next: (u) => this.op.set(u) }); },
      error: (err) => { this.savingCancelar.set(false); this.errorCancelar.set(err?.error?.message ?? 'No se pudo cancelar.'); },
    });
  }

  // ── Helpers ────────────────────────────────────────────────
  estadoBadge(estado: string): { label: string; classes: string } {
    const map: Record<string, { label: string; classes: string }> = {
      PLANIFICADA: { label: 'Planificada',  classes: 'bg-gray-100 text-gray-600' },
      EN_PROCESO:  { label: 'En proceso',   classes: 'bg-amber-100 text-amber-700' },
      COMPLETADA:  { label: 'Completada',   classes: 'bg-green-100 text-green-700' },
      CANCELADA:   { label: 'Cancelada',    classes: 'bg-red-100 text-red-500' },
    };
    return map[estado] ?? { label: estado, classes: 'bg-gray-100 text-gray-600' };
  }


  formatMonto(v: number): string { return `S/ ${(v ?? 0).toFixed(2)}`; }
  formatNum(v: number): string { return v?.toFixed(3).replace(/\.?0+$/, '') ?? '0'; }

  costoInsumoSubtotal(ins: InsumoProduccionResponse): string {
    return this.formatMonto((ins.cantidadUsada ?? 0) * (ins.costoUnitario ?? 0));
  }
}
