import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { DepartamentoService } from '../../services/departamento.service';
import { DepartamentoResponse } from '../../models/departamento.model';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';
import { debouncedSignal } from '../../../../shared/utils/debounce';

@Component({
  selector: 'app-departamentos',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, BreadcrumbComponent],
  templateUrl: './departamentos.html',
})
export class Departamentos implements OnInit {
  private readonly svc = inject(DepartamentoService);
  private readonly fb  = inject(FormBuilder);

  readonly loading  = signal(true);
  readonly saving   = signal(false);
  readonly error    = signal<string | null>(null);
  readonly items    = signal<DepartamentoResponse[]>([]);

  readonly search       = signal('');
  readonly searchD      = debouncedSignal(this.search);
  readonly filtroEstado = signal('');

  readonly kpiActivos   = computed(() => this.items().filter(d => d.estado === 'ACTIVO').length);
  readonly kpiInactivos = computed(() => this.items().filter(d => d.estado !== 'ACTIVO').length);

  readonly filtrados = computed(() => {
    const q = this.searchD().toLowerCase().trim();
    const e = this.filtroEstado();
    return this.items().filter(d => {
      const matchQ = !q || d.nombre.toLowerCase().includes(q) || (d.descripcion ?? '').toLowerCase().includes(q);
      const matchE = !e || d.estado === e;
      return matchQ && matchE;
    });
  });

  setFiltroEstado(v: string): void {
    this.filtroEstado.set(this.filtroEstado() === v ? '' : v);
  }

  readonly modalOpen     = signal(false);
  readonly editandoId    = signal<string | null>(null);
  readonly confirmDelete = signal<DepartamentoResponse | null>(null);

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
      error: () => { this.error.set('Error al cargar departamentos.'); this.loading.set(false); },
    });
  }

  abrirCrear(): void {
    this.editandoId.set(null);
    this.form.reset({ nombre: '', descripcion: '', estado: 'ACTIVO' });
    this.modalOpen.set(true);
  }

  abrirEditar(d: DepartamentoResponse): void {
    this.editandoId.set(d.id);
    this.form.reset({ nombre: d.nombre, descripcion: d.descripcion ?? '', estado: d.estado });
    this.modalOpen.set(true);
  }

  guardar(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const { nombre, descripcion, estado } = this.form.value;
    const id = this.editandoId();
    const obs$ = id
      ? this.svc.actualizar(id, { nombre: nombre!, descripcion: descripcion || undefined, estado: estado! })
      : this.svc.crear({ nombre: nombre!, descripcion: descripcion || undefined });
    obs$.subscribe({
      next: () => { this.saving.set(false); this.modalOpen.set(false); this.cargar(); },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Error al guardar.'); },
    });
  }

  pedirEliminar(d: DepartamentoResponse): void { this.confirmDelete.set(d); }

  confirmarEliminar(): void {
    const d = this.confirmDelete();
    if (!d) return;
    this.confirmDelete.set(null);
    this.svc.eliminar(d.id).subscribe({
      next: () => this.cargar(),
      error: (e) => this.error.set(e?.error?.message ?? 'Error al eliminar.'),
    });
  }

  estadoClasses(estado: string): string {
    return estado === 'ACTIVO' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500';
  }

  depColor(nombre: string): string {
    const palettes = [
      { bg: 'bg-blue-100',   text: 'text-blue-700',   hex: '#2563eb' },
      { bg: 'bg-purple-100', text: 'text-purple-700',  hex: '#7c3aed' },
      { bg: 'bg-orange-100', text: 'text-orange-700',  hex: '#d97706' },
      { bg: 'bg-teal-100',   text: 'text-teal-700',    hex: '#0f766e' },
      { bg: 'bg-pink-100',   text: 'text-pink-700',    hex: '#be185d' },
      { bg: 'bg-indigo-100', text: 'text-indigo-700',  hex: '#4338ca' },
    ];
    return palettes[nombre.charCodeAt(0) % palettes.length].bg + ' ' + palettes[nombre.charCodeAt(0) % palettes.length].text;
  }

  depAccentColor(nombre: string): string {
    const colors = ['#2563eb','#7c3aed','#d97706','#0f766e','#be185d','#4338ca'];
    return colors[nombre.charCodeAt(0) % colors.length];
  }
}
