import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { AlmacenService } from '../../services/almacen.service';
import { LoteService } from '../../services/lote.service';
import {
  AlmacenResponse,
  EstadoAlmacen,
  TipoAlmacen,
  Zona,
  ZonaEstado,
} from '../../models/almacen.model';
import { LoteResponse } from '../../models/lote.model';

@Component({
  selector: 'app-almacenes',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './almacenes.html',
})
export class Almacenes implements OnInit {
  private readonly fb      = inject(FormBuilder);
  private readonly service = inject(AlmacenService);
  private readonly svcLote = inject(LoteService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<AlmacenResponse[]>([]);
  readonly seleccionadoId = signal<string | null>(null);

  // ── Stats totales ──────────────────────────────────────────
  readonly totalStockKg = computed(() =>
    this.items().reduce((s, a) => s + (a.stockOcupadoKg ?? 0), 0),
  );

  readonly almacenSeleccionado = computed(
    () => this.items().find((a) => a.id === this.seleccionadoId()) ?? this.items()[0] ?? null,
  );

  readonly zonas = computed<Zona[]>(() => {
    const a = this.almacenSeleccionado();
    const pct = a?.porcentajeUso ?? 0;
    return this.generarZonas(pct);
  });

  // ── Lotes del almacén seleccionado ────────────────────────
  readonly lotesAlmacen  = signal<LoteResponse[]>([]);
  readonly loadingLotes  = signal(false);

  constructor() {
    effect(() => {
      const sel = this.almacenSeleccionado();
      if (!sel) { this.lotesAlmacen.set([]); return; }
      this.loadingLotes.set(true);
      this.svcLote.listarPorAlmacen(sel.id).subscribe({
        next:  (l) => { this.lotesAlmacen.set(l); this.loadingLotes.set(false); },
        error: ()  => { this.lotesAlmacen.set([]); this.loadingLotes.set(false); },
      });
    }, { allowSignalWrites: true });
  }

  // ── Modal crear/editar ─────────────────────────────────────
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
    capacidadKg: [null as number | null, [Validators.min(0.001)]],
    estado: ['ACTIVO' as EstadoAlmacen, [Validators.required]],
  });

  readonly tipos: { value: TipoAlmacen; label: string }[] = [
    { value: 'PRINCIPAL', label: 'Principal' },
    { value: 'PRODUCCION', label: 'Producción' },
    { value: 'DISTRIBUCION', label: 'Distribución' },
    { value: 'TIENDA', label: 'Tienda' },
  ];

  // ── Modal eliminar ─────────────────────────────────────────
  readonly deleteTarget = signal<AlmacenResponse | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  // ── Lifecycle ──────────────────────────────────────────────
  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.listar().subscribe({
      next: (d) => { this.items.set(d); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar los almacenes.'); this.loading.set(false); },
    });
  }

  seleccionar(a: AlmacenResponse): void {
    this.seleccionadoId.set(a.id);
  }

  // ── Helpers visuales ───────────────────────────────────────
  tipoConfig(tipo?: string | null): { icon: string; bg: string; color: string } {
    switch (tipo) {
      case 'PRODUCCION':   return { icon: 'precision_manufacturing', bg: 'bg-orange-100', color: 'text-orange-600' };
      case 'DISTRIBUCION': return { icon: 'local_shipping',          bg: 'bg-green-100',  color: 'text-green-600' };
      case 'TIENDA':       return { icon: 'store',                   bg: 'bg-blue-100',   color: 'text-blue-600' };
      default:             return { icon: 'warehouse',               bg: 'bg-amber-100',  color: 'text-amber-700' };
    }
  }

  barraColor(pct?: number | null): string {
    const p = pct ?? 0;
    if (p >= 86) return 'bg-red-500';
    if (p >= 70) return 'bg-amber-400';
    return 'bg-green-500';
  }

  pctLabel(pct?: number | null): string {
    if (pct == null) return 'Sin límite';
    return `${pct}%`;
  }

  pctTextColor(pct?: number | null): string {
    const p = pct ?? 0;
    if (p >= 86) return 'text-red-600 font-bold';
    if (p >= 70) return 'text-amber-600 font-semibold';
    return 'text-text-main';
  }

  stockKgLabel(kg?: number | null): string {
    if (kg == null) return '—';
    if (kg >= 1000) return `${(kg / 1000).toFixed(1)} Tn`;
    return `${kg.toFixed(1)} kg`;
  }

  totalStockLabel(): string {
    const t = this.totalStockKg();
    if (t >= 1000) return `${(t / 1000).toFixed(1)} Tn`;
    return `${t.toFixed(1)} kg`;
  }

  estaSeleccionado(a: AlmacenResponse): boolean {
    const sel = this.almacenSeleccionado();
    return sel?.id === a.id;
  }

  zonaClase(estado: ZonaEstado): string {
    switch (estado) {
      case 'libre':   return 'bg-green-100 border-green-200';
      case 'ocupado': return 'bg-rose-100  border-rose-200';
      case 'lleno':   return 'bg-amber-100 border-amber-200';
    }
  }

  // ── Generador de mapa visual (4 filas × 10 columnas) ──────
  private generarZonas(pct: number): Zona[] {
    const total = 40;
    const maxOcupables = total;
    // Clamp so overcapacity (pct > 100) never produces a negative libre count
    const ocupadosTotal = Math.min(Math.round((pct / 100) * maxOcupables), maxOcupables);
    const llenos = Math.floor(ocupadosTotal * 0.35);
    const ocupados = ocupadosTotal - llenos;

    const estados: ZonaEstado[] = [
      ...Array<ZonaEstado>(llenos).fill('lleno'),
      ...Array<ZonaEstado>(ocupados).fill('ocupado'),
      ...Array<ZonaEstado>(maxOcupables - ocupadosTotal).fill('libre'),
    ];
    // distribución pseudo-aleatoria determinista
    const shuffled = estados.map((e, i) => ({ e, sort: (i * 2654435761) % total }))
      .sort((a, b) => a.sort - b.sort)
      .map((x) => x.e);

    return Array.from({ length: total }, (_, i) => ({
      id: `${String.fromCharCode(65 + Math.floor(i / 10))}${(i % 10) + 1}`,
      estado: shuffled[i],
    }));
  }

  // ── CRUD ───────────────────────────────────────────────────
  abrirCrear(): void {
    this.editId.set(null);
    this.formError.set(null);
    this.form.reset({ codigo: '', nombre: '', tipo: 'PRINCIPAL', ubicacion: '', telefono: '', capacidadKg: null, estado: 'ACTIVO' });
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
      capacidadKg: a.capacidadKg ?? null,
      estado: (a.estado as EstadoAlmacen) ?? 'ACTIVO',
    });
    this.modalOpen.set(true);
  }

  cerrarModal(): void { this.modalOpen.set(false); }

  guardar(): void {
    this.formError.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const id = this.editId();
    const req$ = id ? this.service.actualizar(id, v) : this.service.crear(v);
    req$.subscribe({
      next: () => { this.saving.set(false); this.modalOpen.set(false); this.cargar(); },
      error: (err) => { this.saving.set(false); this.formError.set(err?.error?.message ?? 'No se pudo guardar el almacén.'); },
    });
  }

  pedirEliminar(a: AlmacenResponse): void { this.deleteError.set(null); this.deleteTarget.set(a); }
  cancelarEliminar(): void { this.deleteTarget.set(null); }

  confirmarEliminar(): void {
    const t = this.deleteTarget();
    if (!t) return;
    this.deleting.set(true);
    this.service.eliminar(t.id).subscribe({
      next: () => { this.deleting.set(false); this.deleteTarget.set(null); this.items.update((l) => l.filter((x) => x.id !== t.id)); },
      error: (err) => { this.deleting.set(false); this.deleteError.set(err?.error?.message ?? 'No se pudo eliminar el almacén.'); },
    });
  }

  // ── Helpers lotes ──────────────────────────────────────────
  loteEstadoConfig(estado: string): { label: string; css: string } {
    switch (estado) {
      case 'DISPONIBLE':    return { label: 'Disponible',    css: 'bg-green-50 text-green-700' };
      case 'EN_CUARENTENA': return { label: 'Cuarentena',    css: 'bg-amber-50 text-amber-700' };
      case 'BLOQUEADO':     return { label: 'Bloqueado',     css: 'bg-red-50 text-red-600' };
      case 'VENCIDO':       return { label: 'Vencido',       css: 'bg-gray-100 text-gray-500' };
      case 'AGOTADO':       return { label: 'Agotado',       css: 'bg-gray-100 text-gray-500' };
      case 'AGOTADO_MERMA': return { label: 'Agot. merma',  css: 'bg-gray-100 text-gray-500' };
      default:              return { label: estado,          css: 'bg-gray-100 text-gray-500' };
    }
  }

  formatFecha(fecha?: string | null): string {
    if (!fecha) return '—';
    const [y, m, d] = fecha.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }
}
