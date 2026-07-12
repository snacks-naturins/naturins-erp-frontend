import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
  imports: [MatIconModule, FormsModule, BreadcrumbComponent, FechaPipe],
  templateUrl: './ecommerce-descuentos.html',
})
export class EcommerceDescuentos implements OnInit {
  private readonly svc     = inject(DescuentoService);
  private readonly presSvc = inject(PresentacionService);

  readonly loading        = signal(true);
  readonly error          = signal<string | null>(null);
  readonly descuentos     = signal<DescuentoResponse[]>([]);
  readonly presentaciones = signal<PresentacionResponse[]>([]);
  readonly saving         = signal(false);
  readonly deleteTarget   = signal<DescuentoResponse | null>(null);
  readonly deleting       = signal(false);
  readonly deleteError    = signal<string | null>(null);
  readonly modalOpen      = signal(false);
  readonly formError      = signal<string | null>(null);

  // Filtros tabla
  readonly estadoFiltro   = signal('');
  readonly totalActivos    = computed(() => this.descuentos().filter(d => d.estado === 'ACTIVO').length);
  readonly totalProgramados = computed(() => this.descuentos().filter(d => d.estado === 'PROGRAMADO').length);
  readonly totalVencidos   = computed(() => this.descuentos().filter(d => d.estado === 'VENCIDO').length);
  readonly filtrados       = computed(() => {
    const e = this.estadoFiltro();
    return this.descuentos().filter(d => !e || d.estado === e);
  });

  setEstadoFiltro(v: string): void {
    this.estadoFiltro.set(this.estadoFiltro() === v ? '' : v);
  }

  // Buscador de presentaciones (dropdown)
  readonly presSearch      = signal('');
  readonly presDropdownOpen = signal(false);

  readonly presFiltered = computed(() => {
    const q = this.presSearch().toLowerCase().trim();
    return this.presentaciones().filter(p =>
      !q ||
      p.nombreProducto.toLowerCase().includes(q) ||
      p.nombre.toLowerCase().includes(q)
    );
  });

  readonly presSeleccionada = computed(() =>
    this.presentaciones().find(p => p.id === this.form.presentacionId) ?? null
  );

  seleccionarPresentacion(p: PresentacionResponse): void {
    this.form.presentacionId = p.id;
    this.presSearch.set('');
    this.presDropdownOpen.set(false);
  }

  abrirDropdownPres(): void {
    this.presSearch.set('');
    this.presDropdownOpen.set(true);
  }

  cerrarDropdownPres(): void {
    setTimeout(() => this.presDropdownOpen.set(false), 160);
  }

  form: CreateDescuentoRequest = {
    nombre: '', presentacionId: '', tipo: 'PORCENTAJE', valor: 10, fechaInicio: '', fechaFin: '',
  };

  readonly tipos: { value: TipoDescuento; label: string }[] = [
    { value: 'PORCENTAJE',  label: 'Porcentaje (%)' },
    { value: 'PRECIO_FIJO', label: 'Precio final (S/)' },
  ];

  get precioPreview(): { original: string; final: string } | null {
    const pres = this.presSeleccionada();
    if (!pres || !this.form.valor) return null;
    const original = Number(pres.precioVenta);
    const final = this.form.tipo === 'PORCENTAJE'
      ? original * (1 - this.form.valor / 100)
      : this.form.valor;
    return { original: `S/ ${original.toFixed(2)}`, final: `S/ ${final.toFixed(2)}` };
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
    this.presSearch.set('');
    this.presDropdownOpen.set(false);
    this.modalOpen.set(true);
  }

  guardar(): void {
    this.formError.set(null);
    if (!this.form.nombre.trim())    { this.formError.set('El nombre es obligatorio.'); return; }
    if (!this.form.presentacionId)   { this.formError.set('Selecciona una presentación.'); return; }
    if (!this.form.fechaFin)         { this.formError.set('La fecha de fin es obligatoria.'); return; }
    if (this.form.valor <= 0)        { this.formError.set('El valor debe ser mayor a 0.'); return; }

    this.saving.set(true);
    this.svc.crear(this.form).subscribe({
      next: () => { this.saving.set(false); this.modalOpen.set(false); this.cargar(); },
      error: (err) => { this.saving.set(false); this.formError.set(err?.error?.message ?? 'Error al guardar.'); },
    });
  }

  pedirEliminar(d: DescuentoResponse): void { this.deleteError.set(null); this.deleteTarget.set(d); }
  cancelarEliminar(): void { this.deleteTarget.set(null); }

  confirmarEliminar(): void {
    const t = this.deleteTarget();
    if (!t) return;
    this.deleting.set(true);
    this.svc.eliminar(t.id).subscribe({
      next: () => { this.deleting.set(false); this.deleteTarget.set(null); this.cargar(); },
      error: (err) => { this.deleting.set(false); this.deleteError.set(err?.error?.message ?? 'No se pudo eliminar.'); },
    });
  }

  estadoLabel(e: EstadoDescuento): string {
    return { ACTIVO: 'Activo', PROGRAMADO: 'Programado', VENCIDO: 'Vencido' }[e] ?? e;
  }

  estadoBadge(e: EstadoDescuento): string {
    switch (e) {
      case 'ACTIVO':     return 'bg-green-100 text-green-700';
      case 'PROGRAMADO': return 'bg-blue-100 text-blue-700';
      case 'VENCIDO':    return 'bg-gray-100 text-gray-500';
    }
  }

  estadoDot(e: EstadoDescuento): string {
    return { ACTIVO: 'bg-green-500', PROGRAMADO: 'bg-blue-500', VENCIDO: 'bg-gray-400' }[e] ?? 'bg-gray-400';
  }

  valorDisplay(d: DescuentoResponse): string {
    return d.tipo === 'PORCENTAJE' ? `-${d.valor}%` : `S/ ${Number(d.precioFinal).toFixed(2)}`;
  }

  avatarColor(nombre: string): string {
    const colors = [
      'bg-primary/10 text-primary', 'bg-green-100 text-green-700',
      'bg-blue-100 text-blue-700',  'bg-orange-100 text-orange-700',
      'bg-purple-100 text-purple-700', 'bg-pink-100 text-pink-700',
    ];
    return colors[(nombre.charCodeAt(0) ?? 0) % colors.length];
  }

  presInfo(p: PresentacionResponse): string {
    const parts = [p.nombre];
    if (p.peso && p.unidadMedida) parts.push(`${p.peso}${p.unidadMedida}`);
    return parts.join(' · ');
  }
}
