import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { CuponService } from '../../services/cupon.service';
import { CuponResponse, CreateCuponRequest, TipoCupon, EstadoCupon } from '../../models/cupon.model';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';
import { FechaPipe } from '../../../../shared/pipes/fecha.pipe';

@Component({
  selector: 'app-ecommerce-cupones',
  standalone: true,
  imports: [MatIconModule, FormsModule, BreadcrumbComponent, FechaPipe],
  templateUrl: './ecommerce-cupones.html',
})
export class EcommerceCupones implements OnInit {
  private readonly svc = inject(CuponService);

  readonly loading  = signal(true);
  readonly error    = signal<string | null>(null);
  readonly cupones  = signal<CuponResponse[]>([]);
  readonly saving   = signal(false);
  readonly deleting = signal<string | null>(null);
  readonly modalOpen = signal(false);
  readonly editando  = signal<CuponResponse | null>(null);

  readonly activos   = computed(() => this.cupones().filter((c) => c.estado === 'ACTIVO').length);
  readonly vencidos  = computed(() => this.cupones().filter((c) => c.estado === 'VENCIDO').length);

  form: CreateCuponRequest & { estado?: EstadoCupon } = {
    codigo: '', tipo: 'PORCENTAJE', valor: 10, fechaInicio: '', fechaFin: '',
  };

  readonly tipos: { value: TipoCupon; label: string }[] = [
    { value: 'PORCENTAJE', label: 'Porcentaje (%)' },
    { value: 'MONTO_FIJO', label: 'Monto fijo (S/)' },
    { value: 'ENVIO_GRATIS', label: 'Envío gratis' },
  ];

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    this.svc.listar().subscribe({
      next: (d) => { this.cupones.set(d); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar los cupones.'); this.loading.set(false); },
    });
  }

  abrirNuevo(): void {
    this.editando.set(null);
    const hoy = new Date().toISOString().slice(0, 10);
    this.form = { codigo: '', tipo: 'PORCENTAJE', valor: 10, fechaInicio: hoy, fechaFin: '', montoMinimo: undefined, usosMaximos: undefined };
    this.modalOpen.set(true);
  }

  abrirEditar(c: CuponResponse): void {
    this.editando.set(c);
    this.form = {
      codigo: c.codigo, tipo: c.tipo, valor: c.valor,
      fechaInicio: c.fechaInicio, fechaFin: c.fechaFin,
      usosMaximos: c.usosMaximos, montoMinimo: c.montoMinimo,
      estado: c.estado,
    };
    this.modalOpen.set(true);
  }

  guardar(): void {
    if (!this.form.codigo || !this.form.fechaFin) return;
    this.saving.set(true);
    const editObj = this.editando();
    const obs$ = editObj
      ? this.svc.actualizar(editObj.id, this.form)
      : this.svc.crear(this.form);

    obs$.subscribe({
      next: () => { this.saving.set(false); this.modalOpen.set(false); this.cargar(); },
      error: () => this.saving.set(false),
    });
  }

  eliminar(id: string): void {
    if (!confirm('¿Eliminar este cupón?')) return;
    this.deleting.set(id);
    this.svc.eliminar(id).subscribe({
      next: () => { this.deleting.set(null); this.cargar(); },
      error: () => this.deleting.set(null),
    });
  }

  estadoColor(e: EstadoCupon): string {
    switch (e) {
      case 'ACTIVO':   return 'bg-green-100 text-green-700';
      case 'INACTIVO': return 'bg-gray-100 text-gray-500';
      case 'VENCIDO':  return 'bg-red-100 text-red-600';
    }
  }

  tipoLabel(t: TipoCupon): string {
    switch (t) {
      case 'PORCENTAJE':  return '%';
      case 'MONTO_FIJO':  return 'S/';
      case 'ENVIO_GRATIS': return 'Envío';
    }
  }

  valorDisplay(c: CuponResponse): string {
    switch (c.tipo) {
      case 'PORCENTAJE':   return `${c.valor}%`;
      case 'MONTO_FIJO':   return `S/ ${Number(c.valor).toFixed(2)}`;
      case 'ENVIO_GRATIS': return 'Gratis';
    }
  }
}
