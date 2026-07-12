import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { RolService } from '../../services/rol.service';
import { RolResponse } from '../../models/rol.model';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';
import { debouncedSignal } from '../../../../shared/utils/debounce';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, BreadcrumbComponent],
  templateUrl: './roles.html',
})
export class Roles implements OnInit {
  private readonly svc = inject(RolService);
  private readonly fb  = inject(FormBuilder);

  readonly loading  = signal(true);
  readonly saving   = signal(false);
  readonly error    = signal<string | null>(null);
  readonly items    = signal<RolResponse[]>([]);

  readonly search       = signal('');
  readonly searchD      = debouncedSignal(this.search);
  readonly filtroEstado = signal('');

  readonly kpiActivos   = computed(() => this.items().filter(r => r.estado === 'ACTIVO').length);
  readonly kpiInactivos = computed(() => this.items().filter(r => r.estado !== 'ACTIVO').length);

  readonly filtrados = computed(() => {
    const q = this.searchD().toLowerCase().trim();
    const e = this.filtroEstado();
    return this.items().filter(r => {
      const matchQ = !q || r.nombre.toLowerCase().includes(q) || (r.descripcion ?? '').toLowerCase().includes(q);
      const matchE = !e || r.estado === e;
      return matchQ && matchE;
    });
  });

  setFiltroEstado(v: string): void {
    this.filtroEstado.set(this.filtroEstado() === v ? '' : v);
  }

  readonly modalOpen     = signal(false);
  readonly editandoId    = signal<string | null>(null);
  readonly confirmDelete = signal<RolResponse | null>(null);

  readonly form = this.fb.group({
    nombre:      ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: ['', Validators.maxLength(255)],
    estado:      ['ACTIVO'],
  });

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    this.svc.listar().subscribe({
      next: (d) => { this.items.set(d); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar roles.'); this.loading.set(false); },
    });
  }

  abrirCrear(): void {
    this.editandoId.set(null);
    this.form.reset({ nombre: '', descripcion: '', estado: 'ACTIVO' });
    this.modalOpen.set(true);
  }

  abrirEditar(r: RolResponse): void {
    this.editandoId.set(r.id);
    this.form.reset({ nombre: r.nombre, descripcion: r.descripcion ?? '', estado: r.estado });
    this.modalOpen.set(true);
  }

  guardar(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const { nombre, descripcion, estado } = this.form.value;
    const id = this.editandoId();
    const obs$ = id
      ? this.svc.actualizar(id, { nombre: nombre!, descripcion: descripcion || undefined, estado: estado! })
      : this.svc.crear({ nombre: nombre!, descripcion: descripcion! });
    obs$.subscribe({
      next: () => { this.saving.set(false); this.modalOpen.set(false); this.cargar(); },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Error al guardar.'); },
    });
  }

  pedirEliminar(r: RolResponse): void { this.confirmDelete.set(r); }

  confirmarEliminar(): void {
    const r = this.confirmDelete();
    if (!r) return;
    this.confirmDelete.set(null);
    this.svc.eliminar(r.id).subscribe({
      next: () => this.cargar(),
      error: (e) => this.error.set(e?.error?.message ?? 'Error al eliminar.'),
    });
  }

  estadoClasses(estado: string): string {
    return estado === 'ACTIVO' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500';
  }
}
