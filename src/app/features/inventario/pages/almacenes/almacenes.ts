import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { AlmacenService } from '../../services/almacen.service';
import { AlmacenResponse, EstadoAlmacen, TipoAlmacen } from '../../models/almacen.model';

@Component({
  selector: 'app-almacenes',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './almacenes.html',
})
export class Almacenes implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AlmacenService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<AlmacenResponse[]>([]);
  readonly search = signal('');

  // Modal crear/editar
  readonly modalOpen = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly editId = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.maxLength(20)]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    tipo: ['PRINCIPAL' as TipoAlmacen, [Validators.required]],
    ubicacion: ['', [Validators.required, Validators.maxLength(200)]],
    telefono: ['', [Validators.maxLength(15)]],
    capacidad: [null as number | null],
    estado: ['ACTIVO' as EstadoAlmacen, [Validators.required]],
  });

  readonly tipos: { value: TipoAlmacen; label: string }[] = [
    { value: 'PRINCIPAL', label: 'Principal' },
    { value: 'PRODUCCION', label: 'Producción' },
    { value: 'DISTRIBUCION', label: 'Distribución' },
    { value: 'TIENDA', label: 'Tienda' },
  ];

  tipoLabel(t?: string | null): string {
    return this.tipos.find((x) => x.value === t)?.label ?? '—';
  }

  // Eliminar
  readonly deleteTarget = signal<AlmacenResponse | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  readonly filtrados = computed(() => {
    const q = this.search().toLowerCase().trim();
    const list = this.items();
    if (!q) return list;
    return list.filter(
      (a) => a.nombre.toLowerCase().includes(q) || a.ubicacion.toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    this.cargar();
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
        this.error.set('No se pudieron cargar los almacenes.');
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
    this.form.reset({
      codigo: '',
      nombre: '',
      tipo: 'PRINCIPAL',
      ubicacion: '',
      telefono: '',
      capacidad: null,
      estado: 'ACTIVO',
    });
    this.modalOpen.set(true);
  }

  abrirEditar(a: AlmacenResponse): void {
    this.editId.set(a.id);
    this.formError.set(null);
    this.form.reset({
      codigo: a.codigo ?? '',
      nombre: a.nombre,
      tipo: (a.tipo as TipoAlmacen) ?? 'PRINCIPAL',
      ubicacion: a.ubicacion,
      telefono: a.telefono ?? '',
      capacidad: a.capacidad ?? null,
      estado: (a.estado as EstadoAlmacen) ?? 'ACTIVO',
    });
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
    const req$ = id ? this.service.actualizar(id, v) : this.service.crear(v);
    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.cargar();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.error?.message ?? 'No se pudo guardar el almacén.');
      },
    });
  }

  pedirEliminar(a: AlmacenResponse): void {
    this.deleteError.set(null);
    this.deleteTarget.set(a);
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
        this.deleteError.set(err?.error?.message ?? 'No se pudo eliminar el almacén.');
      },
    });
  }

  estado(e: string): { label: string; dot: string; classes: string } {
    return e === 'ACTIVO'
      ? { label: 'Activo', dot: 'bg-[#22C55E]', classes: 'bg-[#DCFCE7] text-[#15803D]' }
      : { label: 'Inactivo', dot: 'bg-[#9CA3AF]', classes: 'bg-[#F3F4F6] text-[#6B7280]' };
  }
}
