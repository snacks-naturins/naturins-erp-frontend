import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { DescuentoService } from '../../services/descuento.service';
import { PresentacionService } from '../../../inventario/services/presentacion.service';
import { DescuentoResponse, CreateDescuentoRequest, TipoDescuento, EstadoDescuento } from '../../models/descuento.model';
import { PresentacionResponse } from '../../../inventario/models/presentacion.model';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';
import { FechaPipe } from '../../../../shared/pipes/fecha.pipe';

@Component({
  selector: 'app-ecommerce-descuentos',
  standalone: true,
  imports: [MatIconModule, FormsModule, DecimalPipe, BreadcrumbComponent, FechaPipe],
  templateUrl: './ecommerce-descuentos.html',
})
export class EcommerceDescuentos implements OnInit {
  private readonly svc         = inject(DescuentoService);
  private readonly presSvc     = inject(PresentacionService);

  readonly loading       = signal(true);
  readonly error         = signal<string | null>(null);
  readonly descuentos    = signal<DescuentoResponse[]>([]);
  readonly presentaciones = signal<PresentacionResponse[]>([]);
  readonly saving        = signal(false);
  readonly deleting      = signal<string | null>(null);
  readonly modalOpen     = signal(false);
  readonly formError     = signal<string | null>(null);

  readonly activos      = computed(() => this.descuentos().filter(d => d.estado === 'ACTIVO').length);
  readonly programados  = computed(() => this.descuentos().filter(d => d.estado === 'PROGRAMADO').length);

  form: CreateDescuentoRequest = {
    nombre: '', presentacionId: '', tipo: 'PORCENTAJE', valor: 10, fechaInicio: '', fechaFin: '',
  };

  readonly tipos: { value: TipoDescuento; label: string; hint: string }[] = [
    { value: 'PORCENTAJE', label: 'Porcentaje (%)',    hint: 'Ej: 20 → 20% de descuento' },
    { value: 'PRECIO_FIJO', label: 'Precio final (S/)', hint: 'Precio rebajado directo' },
  ];

  get precioPreview(): string {
    const pres = this.presentaciones().find(p => p.id === this.form.presentacionId);
    if (!pres || !this.form.valor) return '—';
    const original = Number(pres.precioVenta);
    let final: number;
    if (this.form.tipo === 'PORCENTAJE') {
      final = original * (1 - this.form.valor / 100);
    } else {
      final = this.form.valor;
    }
    return `S/ ${original.toFixed(2)} → S/ ${final.toFixed(2)}`;
  }

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    this.svc.listar().subscribe({
      next: (d) => { this.descuentos.set(d); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar los descuentos.'); this.loading.set(false); },
    });
    this.presSvc.listar().subscribe({
      next: (p) => this.presentaciones.set(p.filter(p => p.estado === 'ACTIVO')),
      error: () => {},
    });
  }

  abrirNuevo(): void {
    const hoy = new Date().toISOString().slice(0, 16);
    this.form = { nombre: '', presentacionId: '', tipo: 'PORCENTAJE', valor: 10, fechaInicio: hoy, fechaFin: '' };
    this.formError.set(null);
    this.modalOpen.set(true);
  }

  guardar(): void {
    this.formError.set(null);
    if (!this.form.nombre.trim()) { this.formError.set('El nombre es obligatorio.'); return; }
    if (!this.form.presentacionId) { this.formError.set('Selecciona una presentación.'); return; }
    if (!this.form.fechaFin) { this.formError.set('La fecha de fin es obligatoria.'); return; }
    if (this.form.valor <= 0) { this.formError.set('El valor debe ser mayor a 0.'); return; }

    this.saving.set(true);
    this.svc.crear(this.form).subscribe({
      next: () => { this.saving.set(false); this.modalOpen.set(false); this.cargar(); },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.error?.message ?? 'Error al guardar.');
      },
    });
  }

  eliminar(id: string): void {
    if (!confirm('¿Eliminar este descuento? Se dejará de aplicar en la tienda.')) return;
    this.deleting.set(id);
    this.svc.eliminar(id).subscribe({
      next: () => { this.deleting.set(null); this.cargar(); },
      error: () => this.deleting.set(null),
    });
  }

  estadoBadge(e: EstadoDescuento): string {
    switch (e) {
      case 'ACTIVO':     return 'bg-green-100 text-green-700';
      case 'PROGRAMADO': return 'bg-blue-100 text-blue-700';
      case 'VENCIDO':    return 'bg-gray-100 text-gray-500';
    }
  }

  tipoLabel(t: TipoDescuento): string {
    return t === 'PORCENTAJE' ? '%' : 'S/';
  }

  valorDisplay(d: DescuentoResponse): string {
    return d.tipo === 'PORCENTAJE'
      ? `-${d.valor}%`
      : `S/ ${Number(d.precioFinal).toFixed(2)}`;
  }
}
