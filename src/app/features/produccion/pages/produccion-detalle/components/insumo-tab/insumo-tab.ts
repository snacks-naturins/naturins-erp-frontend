import { Component, OnInit, Input, Output, EventEmitter, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';

import { InsumoProduccionService } from '../../../../services/insumo-produccion.service';
import { MateriaPrimaService }     from '../../../../../inventario/services/materia-prima.service';
import { InsumoProduccionResponse } from '../../../../models/insumo-produccion.model';
import { MateriaPrimaResponse }     from '../../../../../inventario/models/materia-prima.model';

interface LineaInsumo { mp: MateriaPrimaResponse; cantidad: string; costo: string; }

@Component({
  selector: 'app-insumo-tab',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './insumo-tab.html',
})
export class InsumoTab implements OnInit {
  @Input({ required: true }) opId!: string;
  @Input() canEdit = false;
  @Output() refresh = new EventEmitter<void>();

  private readonly svcIns = inject(InsumoProduccionService);
  private readonly svcMp  = inject(MateriaPrimaService);

  readonly loading       = signal(false);
  readonly insumos       = signal<InsumoProduccionResponse[]>([]);
  readonly materiasPrimas = signal<MateriaPrimaResponse[]>([]);

  readonly modalAgregar    = signal(false);
  readonly saving          = signal(false);
  readonly error           = signal<string | null>(null);
  readonly lineas          = signal<LineaInsumo[]>([]);
  readonly lineasValidas   = computed(() => this.lineas().filter((l) => parseFloat(l.cantidad) > 0 && parseFloat(l.costo) > 0));

  readonly modalEdit    = signal(false);
  readonly editId       = signal<string | null>(null);
  readonly editNombre   = signal('');
  readonly editCant     = signal('');
  readonly editCosto    = signal('');
  readonly savingEdit   = signal(false);
  readonly errorEdit    = signal<string | null>(null);
  readonly deleteTarget = signal<InsumoProduccionResponse | null>(null);
  readonly deleting     = signal(false);
  readonly errorDelete  = signal<string | null>(null);

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    this.svcIns.porProduccion(this.opId).subscribe({
      next: (d) => { this.insumos.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  abrirAgregar(): void {
    this.error.set(null);
    this.lineas.set([]);
    this.modalAgregar.set(true);
    if (this.materiasPrimas().length === 0) {
      this.svcMp.listarActivos().subscribe({ next: (d) => this.materiasPrimas.set(d), error: () => {} });
    }
  }
  cerrarAgregar(): void { this.modalAgregar.set(false); }

  isSelected(mpId: string): boolean { return this.lineas().some((l) => l.mp.id === mpId); }
  getLinea(mpId: string): LineaInsumo | undefined { return this.lineas().find((l) => l.mp.id === mpId); }

  toggle(mp: MateriaPrimaResponse): void {
    if (this.isSelected(mp.id)) {
      this.lineas.update((l) => l.filter((x) => x.mp.id !== mp.id));
    } else {
      this.lineas.update((l) => [...l, { mp, cantidad: '', costo: mp.costoUnitario?.toFixed(2) ?? '' }]);
    }
  }

  setQty(id: string, e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.lineas.update((l) => l.map((x) => x.mp.id === id ? { ...x, cantidad: v } : x));
  }

  setCosto(id: string, e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.lineas.update((l) => l.map((x) => x.mp.id === id ? { ...x, costo: v } : x));
  }

  guardar(): void {
    const validas = this.lineasValidas();
    if (!validas.length) { this.error.set('Selecciona al menos un insumo con cantidad y costo.'); return; }
    this.saving.set(true);
    this.error.set(null);
    forkJoin(validas.map((l) => this.svcIns.crear({
      produccionId: this.opId,
      materiaPrimaId: l.mp.id,
      cantidadUsada: parseFloat(l.cantidad),
      costoUnitario: parseFloat(l.costo),
    }))).subscribe({
      next: () => { this.saving.set(false); this.modalAgregar.set(false); this.cargar(); this.refresh.emit(); },
      error: (err) => { this.saving.set(false); this.error.set(err?.error?.message ?? 'Error al agregar insumos.'); },
    });
  }

  abrirEdit(ins: InsumoProduccionResponse): void {
    this.errorEdit.set(null);
    this.editId.set(ins.id);
    this.editNombre.set(ins.nombreMateriaPrima);
    this.editCant.set(String(ins.cantidadUsada));
    this.editCosto.set(String(ins.costoUnitario));
    this.modalEdit.set(true);
  }
  cerrarEdit(): void { this.modalEdit.set(false); }

  guardarEdit(): void {
    const c = parseFloat(this.editCant()), p = parseFloat(this.editCosto());
    if (isNaN(c) || c <= 0 || isNaN(p) || p <= 0) { this.errorEdit.set('Cantidad y costo deben ser > 0.'); return; }
    const id = this.editId();
    if (!id) return;
    this.savingEdit.set(true);
    this.svcIns.actualizar(id, { cantidadUsada: c, costoUnitario: p }).subscribe({
      next: () => { this.savingEdit.set(false); this.modalEdit.set(false); this.cargar(); this.refresh.emit(); },
      error: (err) => { this.savingEdit.set(false); this.errorEdit.set(err?.error?.message ?? 'Error al editar.'); },
    });
  }

  pedirEliminar(ins: InsumoProduccionResponse): void { this.errorDelete.set(null); this.deleteTarget.set(ins); }
  cancelarEliminar(): void { this.deleteTarget.set(null); }

  confirmarEliminar(): void {
    const ins = this.deleteTarget();
    if (!ins) return;
    this.deleting.set(true);
    this.svcIns.eliminar(ins.id).subscribe({
      next: () => { this.deleting.set(false); this.deleteTarget.set(null); this.cargar(); this.refresh.emit(); },
      error: (err) => { this.deleting.set(false); this.errorDelete.set(err?.error?.message ?? 'Error al eliminar.'); },
    });
  }

  fmt(v: number): string { return v?.toFixed(3).replace(/\.?0+$/, '') ?? '0'; }
  fmtMonto(v: number): string { return `S/ ${(v ?? 0).toFixed(2)}`; }
  subtotal(ins: InsumoProduccionResponse): string { return this.fmtMonto((ins.cantidadUsada ?? 0) * (ins.costoUnitario ?? 0)); }
}
