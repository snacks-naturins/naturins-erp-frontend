import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

import { PresentacionService } from '../../services/presentacion.service';
import { ProductoService } from '../../services/producto.service';
import { PresentacionResponse, EstadoPresentacion } from '../../models/presentacion.model';
import { ProductoResponse } from '../../models/producto.model';
import { debouncedSignal } from '../../../../shared/utils/debounce';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-presentaciones',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, NgClass, BreadcrumbComponent, EmptyState],
  templateUrl: './presentaciones.html',
})
export class Presentaciones implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PresentacionService);
  private readonly productoService = inject(ProductoService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<PresentacionResponse[]>([]);
  readonly productos = signal<ProductoResponse[]>([]);
  readonly search = signal('');
  readonly searchDebounced = debouncedSignal(this.search);

  readonly modalOpen = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly editId = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    productoId: ['', [Validators.required]],
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    peso: [null as number | null],
    unidadMedida: ['g'],
    factorConversion: [1, [Validators.required, Validators.min(0.001)]],
    precioVenta: [null as number | null, [Validators.required, Validators.min(0.01)]],
    estado: ['ACTIVO' as EstadoPresentacion, [Validators.required]],
  });

  // ── Producto search dropdown ──────────────────────────────
  readonly productoSearch       = signal('');
  readonly productoDropdown     = signal(false);
  readonly productoIdSignal     = signal('');   // espejo del form control como Signal
  readonly productoSeleccionado = computed(() =>
    this.productos().find((p) => p.id === this.productoIdSignal()) ?? null,
  );
  readonly productosFiltrados = computed(() => {
    const q = this.productoSearch().toLowerCase().trim();
    return q
      ? this.productos().filter((p) => p.nombre.toLowerCase().includes(q) || (p.nombreCategoria ?? '').toLowerCase().includes(q))
      : this.productos();
  });

  seleccionarProducto(p: ProductoResponse): void {
    this.form.controls.productoId.setValue(p.id);
    this.productoIdSignal.set(p.id);
    this.productoSearch.set('');
    this.productoDropdown.set(false);
  }

  limpiarProducto(): void {
    this.form.controls.productoId.setValue('');
    this.productoIdSignal.set('');
  }

  /** Calcula factorConversion en kg a partir de peso + unidadMedida y actualiza el control. */
  recalcularFactor(): void {
    const peso = this.form.controls.peso.value;
    const unidad = this.form.controls.unidadMedida.value;
    if (peso === null || peso <= 0) return;
    let fc = 1;
    switch (unidad) {
      case 'g':  fc = +(peso / 1000).toFixed(5); break;
      case 'kg': fc = +peso.toFixed(5); break;
      case 'mL': fc = +(peso / 1000).toFixed(5); break;
      case 'L':  fc = +peso.toFixed(5); break;
      case 'unidad': fc = 1; break;
      default: fc = +peso.toFixed(5);
    }
    this.form.controls.factorConversion.setValue(fc);
  }

  /** Etiqueta legible de la unidad base que usa factorConversion (siempre kg o L). */
  unidadBase(): string {
    const u = this.form.controls.unidadMedida.value;
    return (u === 'L' || u === 'mL') ? 'L' : 'kg';
  }

  readonly deleteTarget = signal<PresentacionResponse | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  readonly filtrados = computed(() => {
    const q = this.searchDebounced().toLowerCase().trim();
    const list = this.items();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.nombreProducto ?? '').toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    this.cargar();
    this.productoService.listar().subscribe({
      next: (p) => this.productos.set(p),
      error: () => this.productos.set([]),
    });
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.listar().subscribe({
      next: (d) => {
        this.items.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las presentaciones.');
        this.loading.set(false);
      },
    });
  }

  onSearch(e: Event): void {
    this.search.set((e.target as HTMLInputElement).value);
  }

  abrirCrear(): void {
    this.editId.set(null);
    this.formError.set(null);
    this.productoSearch.set('');
    this.productoDropdown.set(false);
    this.productoIdSignal.set('');
    this.form.reset({ productoId: '', nombre: '', peso: null, unidadMedida: 'g', factorConversion: 1, precioVenta: null, estado: 'ACTIVO' });
    this.form.controls.productoId.enable();
    this.modalOpen.set(true);
  }

  abrirEditar(p: PresentacionResponse): void {
    this.editId.set(p.id);
    this.formError.set(null);
    this.productoSearch.set('');
    this.productoDropdown.set(false);
    this.productoIdSignal.set(p.productoId);
    this.form.reset({
      productoId: p.productoId,
      nombre: p.nombre,
      peso: p.peso ?? null,
      unidadMedida: p.unidadMedida ?? 'g',
      factorConversion: p.factorConversion,
      precioVenta: p.precioVenta,
      estado: (p.estado as EstadoPresentacion) ?? 'ACTIVO',
    });
    this.form.controls.productoId.disable();
    this.modalOpen.set(true);
  }

  cerrarModal(): void {
    this.modalOpen.set(false);
  }

  guardar(): void {
    this.formError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const id = this.editId();
    const req$ = id
      ? this.service.actualizar(id, {
          nombre: v.nombre,
          factorConversion: v.factorConversion,
          precioVenta: v.precioVenta!,
          peso: v.peso ?? null,
          unidadMedida: v.unidadMedida || null,
          estado: v.estado,
        })
      : this.service.crear({
          productoId: v.productoId,
          nombre: v.nombre,
          factorConversion: v.factorConversion,
          precioVenta: v.precioVenta!,
          peso: v.peso ?? null,
          unidadMedida: v.unidadMedida || null,
          estado: v.estado,
        });
    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.cargar();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.error?.message ?? 'No se pudo guardar la presentación.');
      },
    });
  }

  pedirEliminar(p: PresentacionResponse): void {
    this.deleteError.set(null);
    this.deleteTarget.set(p);
  }
  cancelarEliminar(): void {
    this.deleteTarget.set(null);
  }
  confirmarEliminar(): void {
    const t = this.deleteTarget();
    if (!t) return;
    this.deleting.set(true);
    this.service.eliminar(t.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.items.update((l) => l.filter((x) => x.id !== t.id));
      },
      error: (err) => {
        this.deleting.set(false);
        this.deleteError.set(err?.error?.message ?? 'No se pudo eliminar la presentación.');
      },
    });
  }

  estado(e: string): { label: string; classes: string } {
    switch (e) {
      case 'ACTIVO':
        return { label: 'Activo', classes: 'bg-[#DCFCE7] text-[#15803D]' };
      case 'DESCONTINUADO':
        return { label: 'Descontinuado', classes: 'bg-[#FEE2E2] text-[#B91C1C]' };
      case 'PROXIMAMENTE':
        return { label: 'Próximamente', classes: 'bg-[#DBEAFE] text-[#1D4ED8]' };
      default:
        return { label: 'Inactivo', classes: 'bg-[#F3F4F6] text-[#6B7280]' };
    }
  }
}
