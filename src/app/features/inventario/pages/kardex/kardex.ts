import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { MovimientoService } from '../../services/movimiento.service';
import { LoteService } from '../../services/lote.service';
import {
  MovimientoInventarioResponse,
  TipoMovimientoInventario,
} from '../../models/movimiento.model';
import { LoteResponse } from '../../models/lote.model';

@Component({
  selector: 'app-kardex',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, DatePipe],
  templateUrl: './kardex.html',
})
export class Kardex implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MovimientoService);
  private readonly loteService = inject(LoteService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<MovimientoInventarioResponse[]>([]);
  readonly lotes = signal<LoteResponse[]>([]);
  readonly search = signal('');

  readonly modalOpen = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    loteId: ['', [Validators.required]],
    tipoMovimiento: ['ENTRADA' as TipoMovimientoInventario, [Validators.required]],
    cantidad: [0, [Validators.required, Validators.min(0.001)]],
    costoUnitario: [null as number | null],
    tipoReferencia: [''],
    observacion: [''],
  });

  readonly tipos: { value: TipoMovimientoInventario; label: string }[] = [
    { value: 'ENTRADA', label: 'Entrada' },
    { value: 'SALIDA', label: 'Salida' },
    { value: 'AJUSTE_POSITIVO', label: 'Ajuste (+)' },
    { value: 'AJUSTE_NEGATIVO', label: 'Ajuste (−)' },
    { value: 'TRANSFERENCIA_ENTRADA', label: 'Transferencia entrada' },
    { value: 'TRANSFERENCIA_SALIDA', label: 'Transferencia salida' },
  ];

  private readonly loteMap = computed(() => {
    const m = new Map<string, LoteResponse>();
    for (const l of this.lotes()) m.set(l.id, l);
    return m;
  });

  readonly filtrados = computed(() => {
    const q = this.search().toLowerCase().trim();
    const list = this.items();
    if (!q) return list;
    return list.filter((mv) => {
      const l = this.loteMap().get(mv.loteId);
      return (
        (mv.codigoLote ?? '').toLowerCase().includes(q) ||
        (l?.nombreProducto ?? '').toLowerCase().includes(q)
      );
    });
  });

  ngOnInit(): void {
    this.cargar();
    this.loteService.listar().subscribe({
      next: (l) => this.lotes.set(l),
      error: () => this.lotes.set([]),
    });
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.listar().subscribe({
      next: (d) => {
        // más recientes primero
        this.items.set([...d].reverse());
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los movimientos.');
        this.loading.set(false);
      },
    });
  }

  onSearch(e: Event): void {
    this.search.set((e.target as HTMLInputElement).value);
  }

  abrirCrear(): void {
    this.formError.set(null);
    this.form.reset({
      loteId: '',
      tipoMovimiento: 'ENTRADA',
      cantidad: 0,
      costoUnitario: null,
      tipoReferencia: '',
      observacion: '',
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
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.service
      .crear({
        loteId: v.loteId,
        tipoMovimiento: v.tipoMovimiento,
        cantidad: v.cantidad,
        costoUnitario: v.costoUnitario,
        tipoReferencia: (v.tipoReferencia || null) as any,
        observacion: v.observacion || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.modalOpen.set(false);
          this.cargar();
          // refresca el stock de los lotes para el select
          this.loteService.listar().subscribe({ next: (l) => this.lotes.set(l) });
        },
        error: (err) => {
          this.saving.set(false);
          this.formError.set(err?.error?.message ?? 'No se pudo registrar el movimiento.');
        },
      });
  }

  productoDe(mv: MovimientoInventarioResponse): string {
    return this.loteMap().get(mv.loteId)?.nombreProducto ?? '—';
  }

  esEntrada(tipo: string): boolean {
    return tipo === 'ENTRADA' || tipo === 'AJUSTE_POSITIVO' || tipo === 'TRANSFERENCIA_ENTRADA';
  }

  tipoView(tipo: string): { label: string; icon: string; classes: string } {
    if (this.esEntrada(tipo)) {
      return {
        label: this.tipos.find((t) => t.value === tipo)?.label ?? tipo,
        icon: 'south_west',
        classes: 'bg-[#DCFCE7] text-[#15803D]',
      };
    }
    return {
      label: this.tipos.find((t) => t.value === tipo)?.label ?? tipo,
      icon: 'north_east',
      classes: 'bg-[#FEE2E2] text-[#B91C1C]',
    };
  }
}
