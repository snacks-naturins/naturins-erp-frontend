import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { RecetaService } from '../../services/receta.service';
import { PresentacionService } from '../../../inventario/services/presentacion.service';
import { MateriaPrimaService } from '../../../inventario/services/materia-prima.service';

import {
  CreateRecetaIngredienteRequest,
  RecetaResponse,
  RecetaCalculoResponse,
  CrearProduccionDesdeRecetaRequest,
} from '../../models/receta.model';
import { PresentacionResponse } from '../../../inventario/models/presentacion.model';
import { MateriaPrimaResponse } from '../../../inventario/models/materia-prima.model';

interface IngredienteForm {
  materiaPrimaId: string;
  cantidadPorLote: number | null;
}

@Component({
  selector: 'app-recetas',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './recetas.html',
})
export class Recetas implements OnInit {
  private readonly router = inject(Router);
  private readonly recetaService = inject(RecetaService);
  private readonly presentacionService = inject(PresentacionService);
  private readonly mpService = inject(MateriaPrimaService);

  // ── estado general ──────────────────────────────────────────────
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly recetas = signal<RecetaResponse[]>([]);
  readonly filtroEstado = signal<string>('TODAS');

  // ── listas para selects ─────────────────────────────────────────
  readonly presentaciones = signal<PresentacionResponse[]>([]);
  readonly materiasPrimas = signal<MateriaPrimaResponse[]>([]);

  // ── modal crear ─────────────────────────────────────────────────
  readonly modalCrear = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  readonly formNombre = signal('');
  readonly formDescripcion = signal('');
  readonly formPresentacionId = signal('');
  readonly formRendimiento = signal<number | null>(null);
  readonly formIngredientes = signal<IngredienteForm[]>([{ materiaPrimaId: '', cantidadPorLote: null }]);

  // ── modal calcular/producir ──────────────────────────────────────
  readonly modalCalculo = signal(false);
  readonly recetaSeleccionada = signal<RecetaResponse | null>(null);
  readonly formLotes = signal<number | null>(null);
  readonly calculo = signal<RecetaCalculoResponse | null>(null);
  readonly calculando = signal(false);
  readonly produciendo = signal(false);
  readonly formObservacion = signal('');
  readonly calcError = signal<string | null>(null);

  // ── computed ─────────────────────────────────────────────────────
  readonly recetasFiltradas = computed(() => {
    const f = this.filtroEstado();
    return f === 'TODAS' ? this.recetas() : this.recetas().filter((r) => r.estado === f);
  });
  readonly totalActivas   = computed(() => this.recetas().filter((r) => r.estado === 'ACTIVA').length);
  readonly totalArchivadas = computed(() => this.recetas().filter((r) => r.estado === 'ARCHIVADA').length);

  ngOnInit(): void {
    this.cargar();
    this.presentacionService.listar().subscribe({ next: (d) => this.presentaciones.set(d) });
    this.mpService.listar().subscribe({ next: (d) => this.materiasPrimas.set(d) });
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.recetaService.listar().subscribe({
      next: (d) => { this.recetas.set(d); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar las recetas.'); this.loading.set(false); },
    });
  }

  // ── modal crear ──────────────────────────────────────────────────
  abrirCrear(): void {
    this.formNombre.set('');
    this.formDescripcion.set('');
    this.formPresentacionId.set('');
    this.formRendimiento.set(null);
    this.formIngredientes.set([{ materiaPrimaId: '', cantidadPorLote: null }]);
    this.formError.set(null);
    this.modalCrear.set(true);
  }

  cerrarCrear(): void { this.modalCrear.set(false); }

  agregarIngrediente(): void {
    this.formIngredientes.update((list) => [...list, { materiaPrimaId: '', cantidadPorLote: null }]);
  }

  quitarIngrediente(i: number): void {
    this.formIngredientes.update((list) => list.filter((_, idx) => idx !== i));
  }

  onIngredienteMp(i: number, e: Event): void {
    const val = (e.target as HTMLSelectElement).value;
    this.formIngredientes.update((list) => list.map((ing, idx) => idx === i ? { ...ing, materiaPrimaId: val } : ing));
  }

  onIngredienteCantidad(i: number, e: Event): void {
    const val = parseFloat((e.target as HTMLInputElement).value);
    this.formIngredientes.update((list) => list.map((ing, idx) => idx === i ? { ...ing, cantidadPorLote: isNaN(val) ? null : val } : ing));
  }

  guardarReceta(): void {
    const nombre = this.formNombre().trim();
    const presentacionId = this.formPresentacionId();
    const rendimiento = this.formRendimiento();
    const ings = this.formIngredientes();

    if (!nombre) { this.formError.set('El nombre es obligatorio.'); return; }
    if (!presentacionId) { this.formError.set('Seleccione una presentación.'); return; }
    if (!rendimiento || rendimiento <= 0) { this.formError.set('El rendimiento debe ser mayor a cero.'); return; }
    if (ings.some((i) => !i.materiaPrimaId || !i.cantidadPorLote)) {
      this.formError.set('Complete todos los ingredientes.'); return;
    }

    const ingredientes: CreateRecetaIngredienteRequest[] = ings.map((i) => ({
      materiaPrimaId: i.materiaPrimaId,
      cantidadPorLote: i.cantidadPorLote!,
    }));

    this.saving.set(true);
    this.formError.set(null);
    this.recetaService.crear({ nombre, descripcion: this.formDescripcion() || undefined, presentacionId, rendimientoPorLote: rendimiento, ingredientes }).subscribe({
      next: (r) => { this.saving.set(false); this.modalCrear.set(false); this.recetas.update((list) => [r, ...list]); },
      error: (err) => { this.saving.set(false); this.formError.set(err?.error?.message ?? 'No se pudo crear la receta.'); },
    });
  }

  // ── acciones de lista ────────────────────────────────────────────
  activar(r: RecetaResponse): void {
    this.recetaService.activar(r.id).subscribe({
      next: () => this.cargar(),
      error: (err) => alert(err?.error?.message ?? 'No se pudo activar.'),
    });
  }

  archivar(r: RecetaResponse): void {
    if (!confirm(`¿Archivar la receta "${r.nombre}"?`)) return;
    this.recetaService.archivar(r.id).subscribe({
      next: () => this.cargar(),
      error: (err) => alert(err?.error?.message ?? 'No se pudo archivar.'),
    });
  }

  // ── modal calcular/producir ──────────────────────────────────────
  abrirCalculo(r: RecetaResponse): void {
    this.recetaSeleccionada.set(r);
    this.formLotes.set(null);
    this.formObservacion.set('');
    this.calculo.set(null);
    this.calcError.set(null);
    this.modalCalculo.set(true);
  }

  cerrarCalculo(): void { this.modalCalculo.set(false); }

  calcular(): void {
    const lotes = this.formLotes();
    const receta = this.recetaSeleccionada();
    if (!lotes || lotes <= 0 || !receta) { this.calcError.set('Ingrese una cantidad de lotes válida.'); return; }
    this.calculando.set(true);
    this.calcError.set(null);
    this.recetaService.calcular(receta.id, { lotesAProducir: lotes }).subscribe({
      next: (c) => { this.calculo.set(c); this.calculando.set(false); },
      error: () => { this.calcError.set('Error al calcular.'); this.calculando.set(false); },
    });
  }

  producir(): void {
    const receta = this.recetaSeleccionada();
    const lotes = this.formLotes();
    if (!receta || !lotes) return;

    const dto: CrearProduccionDesdeRecetaRequest = {
      lotesAProducir: lotes,
      observacion: this.formObservacion() || undefined,
    };
    this.produciendo.set(true);
    this.recetaService.producir(receta.id, dto).subscribe({
      next: (op) => {
        this.produciendo.set(false);
        this.modalCalculo.set(false);
        this.router.navigate(['/produccion', op.id]);
      },
      error: (err) => {
        this.produciendo.set(false);
        this.calcError.set(err?.error?.message ?? 'No se pudo crear la orden.');
      },
    });
  }

  // ── helpers ──────────────────────────────────────────────────────
  estadoBadge(estado: string): string {
    const m: Record<string, string> = {
      ACTIVA:    'bg-green-100 text-green-700',
      INACTIVA:  'bg-gray-100 text-gray-600',
      ARCHIVADA: 'bg-amber-100 text-amber-700',
    };
    return m[estado] ?? 'bg-gray-100 text-gray-600';
  }

  nombreMp(id: string): string {
    return this.materiasPrimas().find((m) => m.id === id)?.nombre ?? id;
  }

  onNombre(e: Event): void { this.formNombre.set((e.target as HTMLInputElement).value); }
  onDescripcion(e: Event): void { this.formDescripcion.set((e.target as HTMLTextAreaElement).value); }
  onPresentacion(e: Event): void { this.formPresentacionId.set((e.target as HTMLSelectElement).value); }
  onRendimiento(e: Event): void {
    const v = parseFloat((e.target as HTMLInputElement).value);
    this.formRendimiento.set(isNaN(v) ? null : v);
  }
  onLotes(e: Event): void {
    const v = parseFloat((e.target as HTMLInputElement).value);
    this.formLotes.set(isNaN(v) ? null : v);
    this.calculo.set(null);
  }
  onObservacion(e: Event): void { this.formObservacion.set((e.target as HTMLInputElement).value); }
  setFiltro(f: string): void { this.filtroEstado.set(f); }
}
