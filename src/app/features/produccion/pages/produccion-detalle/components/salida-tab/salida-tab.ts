import { Component, OnInit, Input, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';

import { DetalleProduccionService } from '../../../../services/detalle-produccion.service';
import { PresentacionService }       from '../../../../../inventario/services/presentacion.service';
import { DetalleProduccionResponse } from '../../../../models/detalle-produccion.model';
import { PresentacionResponse }      from '../../../../../inventario/models/presentacion.model';

interface LineaSalida { pres: PresentacionResponse; cantidad: string; }

@Component({
  selector: 'app-salida-tab',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './salida-tab.html',
})
export class SalidaTab implements OnInit {
  @Input({ required: true }) opId!: string;
  @Input() canEdit = false;

  private readonly svcDet  = inject(DetalleProduccionService);
  private readonly svcPres = inject(PresentacionService);

  readonly loading          = signal(false);
  readonly salidas          = signal<DetalleProduccionResponse[]>([]);
  readonly presentaciones   = signal<PresentacionResponse[]>([]);
  readonly loadingPres      = signal(false);

  readonly modalAgregar     = signal(false);
  readonly saving           = signal(false);
  readonly error            = signal<string | null>(null);
  readonly lineas           = signal<LineaSalida[]>([]);
  readonly lineasValidas    = computed(() => this.lineas().filter((l) => parseFloat(l.cantidad) > 0));

  readonly modalEdit    = signal(false);
  readonly editId       = signal<string | null>(null);
  readonly editNombre   = signal('');
  readonly editCant     = signal('');
  readonly savingEdit   = signal(false);
  readonly errorEdit    = signal<string | null>(null);
  readonly deleteTarget = signal<DetalleProduccionResponse | null>(null);
  readonly deleting     = signal(false);
  readonly errorDelete  = signal<string | null>(null);

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    this.svcDet.porProduccion(this.opId).subscribe({
      next: (d) => { this.salidas.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  abrirAgregar(): void {
    this.error.set(null);
    this.lineas.set([]);
    this.modalAgregar.set(true);
    if (this.presentaciones().length === 0) {
      this.loadingPres.set(true);
      this.svcPres.listar().subscribe({
        next: (d) => { this.presentaciones.set(d.filter((p) => p.estado !== 'DESCONTINUADO')); this.loadingPres.set(false); },
        error: () => { this.loadingPres.set(false); this.error.set('No se pudieron cargar las presentaciones.'); },
      });
    }
  }
  cerrarAgregar(): void { this.modalAgregar.set(false); }

  isSelected(presId: string): boolean { return this.lineas().some((l) => l.pres.id === presId); }
  getLinea(presId: string): LineaSalida | undefined { return this.lineas().find((l) => l.pres.id === presId); }

  toggle(pres: PresentacionResponse): void {
    if (this.isSelected(pres.id)) {
      this.lineas.update((l) => l.filter((x) => x.pres.id !== pres.id));
    } else {
      this.lineas.update((l) => [...l, { pres, cantidad: '' }]);
    }
  }

  setQty(id: string, e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.lineas.update((l) => l.map((x) => x.pres.id === id ? { ...x, cantidad: v } : x));
  }

  guardar(): void {
    const validas = this.lineasValidas();
    if (!validas.length) { this.error.set('Selecciona al menos un producto con cantidad.'); return; }
    this.saving.set(true);
    this.error.set(null);
    forkJoin(validas.map((l) => this.svcDet.crear({
      produccionId: this.opId,
      presentacionProductoId: l.pres.id,
      cantidadProducida: parseFloat(l.cantidad),
    }))).subscribe({
      next: () => { this.saving.set(false); this.modalAgregar.set(false); this.cargar(); },
      error: (err) => { this.saving.set(false); this.error.set(err?.error?.message ?? 'Error al agregar salidas.'); },
    });
  }

  abrirEdit(sal: DetalleProduccionResponse): void {
    this.errorEdit.set(null);
    this.editId.set(sal.id);
    this.editNombre.set(sal.nombrePresentacionProducto ?? '');
    this.editCant.set(String(sal.cantidadProducida));
    this.modalEdit.set(true);
  }
  cerrarEdit(): void { this.modalEdit.set(false); }

  guardarEdit(): void {
    const c = parseFloat(this.editCant());
    if (isNaN(c) || c <= 0) { this.errorEdit.set('Cantidad debe ser > 0.'); return; }
    const id = this.editId();
    if (!id) return;
    this.savingEdit.set(true);
    this.svcDet.actualizar(id, { cantidadProducida: c }).subscribe({
      next: () => { this.savingEdit.set(false); this.modalEdit.set(false); this.cargar(); },
      error: (err) => { this.savingEdit.set(false); this.errorEdit.set(err?.error?.message ?? 'Error al editar.'); },
    });
  }

  pedirEliminar(sal: DetalleProduccionResponse): void { this.errorDelete.set(null); this.deleteTarget.set(sal); }
  cancelarEliminar(): void { this.deleteTarget.set(null); }

  confirmarEliminar(): void {
    const sal = this.deleteTarget();
    if (!sal) return;
    this.deleting.set(true);
    this.svcDet.eliminar(sal.id).subscribe({
      next: () => { this.deleting.set(false); this.deleteTarget.set(null); this.cargar(); },
      error: (err) => { this.deleting.set(false); this.errorDelete.set(err?.error?.message ?? 'Error al eliminar.'); },
    });
  }

  fmt(v: number): string { return v?.toFixed(3).replace(/\.?0+$/, '') ?? '0'; }
  fmtMonto(v: number): string { return `S/ ${(v ?? 0).toFixed(2)}`; }
}
