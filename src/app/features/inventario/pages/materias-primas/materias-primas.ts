import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { MateriaPrimaService } from '../../services/materia-prima.service';
import {
  EstadoMateriaPrima,
  MateriaPrimaResponse,
} from '../../models/materia-prima.model';

@Component({
  selector: 'app-materias-primas',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './materias-primas.html',
})
export class MateriasPrimas implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MateriaPrimaService);

  // ── Lista ──────────────────────────────────────────────────
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<MateriaPrimaResponse[]>([]);
  readonly search = signal('');
  readonly filtroEstado = signal<string>('TODOS');

  readonly filtrados = computed(() => {
    const q = this.search().toLowerCase().trim();
    const estado = this.filtroEstado();
    return this.items().filter((m) => {
      const matchQ = !q || m.nombre.toLowerCase().includes(q) || m.unidadMedida.toLowerCase().includes(q);
      const matchE = estado === 'TODOS' || m.estado === estado;
      return matchQ && matchE;
    });
  });

  // ── Stats ──────────────────────────────────────────────────
  readonly totalActivas = computed(() => this.items().filter((m) => m.estado === 'ACTIVO').length);
  readonly totalInactivas = computed(() => this.items().filter((m) => m.estado === 'INACTIVO').length);
  readonly stockTotalLabel = computed(() => {
    const total = this.items().reduce((s, m) => s + (m.stock ?? 0), 0);
    return total.toFixed(2);
  });

  // ── Modal crear/editar ─────────────────────────────────────
  readonly modalOpen = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly editId = signal<string | null>(null);
  readonly editNombre = signal('');

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    unidadMedida: ['', [Validators.required, Validators.maxLength(20)]],
    stock: [0 as number, [Validators.required, Validators.min(0)]],
    costoUnitario: [0 as number, [Validators.required, Validators.min(0)]],
    estado: ['ACTIVO' as EstadoMateriaPrima, [Validators.required]],
  });

  // ── Modal eliminar ─────────────────────────────────────────
  readonly deleteTarget = signal<MateriaPrimaResponse | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  // ── Lifecycle ──────────────────────────────────────────────
  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.listar().subscribe({
      next: (d) => { this.items.set(d); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar las materias primas.'); this.loading.set(false); },
    });
  }

  onSearch(e: Event): void {
    this.search.set((e.target as HTMLInputElement).value);
  }

  setFiltroEstado(e: string): void { this.filtroEstado.set(e); }

  // ── Helpers visuales ───────────────────────────────────────
  estadoBadge(e: string): { label: string; classes: string } {
    return e === 'ACTIVO'
      ? { label: 'Activo',   classes: 'bg-green-100 text-green-700' }
      : { label: 'Inactivo', classes: 'bg-gray-100 text-gray-500' };
  }

  stockLabel(v: number): string {
    return v.toFixed(3).replace(/\.?0+$/, '');
  }

  costoLabel(v: number): string {
    return `S/ ${v.toFixed(2)}`;
  }

  stockClass(v: number): string {
    if (v === 0) return 'text-red-600 font-semibold';
    if (v < 10)  return 'text-amber-600 font-semibold';
    return 'text-text-main';
  }

  // ── CRUD ───────────────────────────────────────────────────
  abrirCrear(): void {
    this.editId.set(null);
    this.editNombre.set('');
    this.formError.set(null);
    this.form.reset({ nombre: '', unidadMedida: '', stock: 0, costoUnitario: 0, estado: 'ACTIVO' });
    this.form.controls.nombre.enable();
    this.form.controls.stock.enable();
    this.modalOpen.set(true);
  }

  abrirEditar(m: MateriaPrimaResponse): void {
    this.editId.set(m.id);
    this.editNombre.set(m.nombre);
    this.formError.set(null);
    this.form.reset({
      nombre: m.nombre,
      unidadMedida: m.unidadMedida,
      stock: m.stock,
      costoUnitario: m.costoUnitario,
      estado: (m.estado as EstadoMateriaPrima) ?? 'ACTIVO',
    });
    this.form.controls.nombre.disable();
    this.form.controls.stock.disable();
    this.modalOpen.set(true);
  }

  cerrarModal(): void { this.modalOpen.set(false); }

  guardar(): void {
    this.formError.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const id = this.editId();

    const req$ = id
      ? this.service.actualizar(id, {
          unidadMedida: v.unidadMedida,
          costoUnitario: v.costoUnitario,
          estado: v.estado,
        })
      : this.service.crear({
          nombre: v.nombre,
          unidadMedida: v.unidadMedida,
          stock: v.stock,
          costoUnitario: v.costoUnitario,
          estado: v.estado,
        });

    req$.subscribe({
      next: () => { this.saving.set(false); this.modalOpen.set(false); this.cargar(); },
      error: (err) => { this.saving.set(false); this.formError.set(err?.error?.message ?? 'No se pudo guardar.'); },
    });
  }

  pedirEliminar(m: MateriaPrimaResponse): void { this.deleteError.set(null); this.deleteTarget.set(m); }
  cancelarEliminar(): void { this.deleteTarget.set(null); }

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
        this.deleteError.set(err?.error?.message ?? 'No se pudo eliminar la materia prima.');
      },
    });
  }
}
