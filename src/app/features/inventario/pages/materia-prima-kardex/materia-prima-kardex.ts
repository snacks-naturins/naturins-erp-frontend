import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { MateriaPrimaService } from '../../services/materia-prima.service';
import { MovimientoMateriaService } from '../../services/movimiento-materia.service';
import { MateriaPrimaResponse } from '../../models/materia-prima.model';
import {
  MovimientoMateriaResponse,
  TipoMovimientoMateria,
} from '../../models/movimiento-materia.model';

@Component({
  selector: 'app-materia-prima-kardex',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './materia-prima-kardex.html',
})
export class MateriaPrimaKardex implements OnInit {
  private readonly route    = inject(ActivatedRoute);
  private readonly router   = inject(Router);
  private readonly mpSvc    = inject(MateriaPrimaService);
  private readonly movSvc   = inject(MovimientoMateriaService);

  readonly loadingMp  = signal(true);
  readonly loadingMov = signal(true);
  readonly mp         = signal<MateriaPrimaResponse | null>(null);
  readonly movimientos = signal<MovimientoMateriaResponse[]>([]);
  readonly errorMp    = signal<string | null>(null);
  readonly errorMov   = signal<string | null>(null);

  // Filtro por fecha
  readonly desde = signal('');
  readonly hasta = signal('');
  readonly filtrando = signal(false);

  readonly Math = Math;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.cargarMateria(id);
    this.cargarMovimientos(id);
  }

  cargarMateria(id: string): void {
    this.loadingMp.set(true);
    this.mpSvc.buscarPorId(id).subscribe({
      next:  (d) => { this.mp.set(d); this.loadingMp.set(false); },
      error: ()  => { this.errorMp.set('No se pudo cargar la materia prima.'); this.loadingMp.set(false); },
    });
  }

  cargarMovimientos(id: string): void {
    this.loadingMov.set(true);
    this.errorMov.set(null);
    this.movSvc.listarPorMateria(id).subscribe({
      next:  (d) => { this.movimientos.set(d); this.loadingMov.set(false); },
      error: ()  => { this.errorMov.set('No se pudieron cargar los movimientos.'); this.loadingMov.set(false); },
    });
  }

  filtrarPorFecha(): void {
    const id = this.mp()?.id;
    if (!id || !this.desde() || !this.hasta()) return;
    this.filtrando.set(true);
    this.errorMov.set(null);
    const desdeISO = this.desde() + 'T00:00:00';
    const hastaISO = this.hasta() + 'T23:59:59';
    this.movSvc.kardexPorFecha(id, desdeISO, hastaISO).subscribe({
      next:  (d) => { this.movimientos.set(d); this.filtrando.set(false); },
      error: ()  => { this.errorMov.set('Error al filtrar movimientos.'); this.filtrando.set(false); },
    });
  }

  limpiarFiltro(): void {
    this.desde.set('');
    this.hasta.set('');
    const id = this.mp()?.id;
    if (id) this.cargarMovimientos(id);
  }

  onDesde(e: Event): void { this.desde.set((e.target as HTMLInputElement).value); }
  onHasta(e: Event): void { this.hasta.set((e.target as HTMLInputElement).value); }

  volver(): void { this.router.navigate(['/materia-prima']); }

  // ── Helpers visuales ───────────────────────────────────────
  tipoBadge(tipo: TipoMovimientoMateria): { label: string; classes: string; icon: string } {
    switch (tipo) {
      case 'ENTRADA':
        return { label: 'Entrada',    classes: 'bg-green-100 text-green-700',  icon: 'add_circle' };
      case 'DEVOLUCION':
        return { label: 'Devolución', classes: 'bg-teal-100 text-teal-700',    icon: 'undo' };
      case 'AJUSTE_POSITIVO':
        return { label: 'Ajuste +',   classes: 'bg-blue-100 text-blue-700',    icon: 'trending_up' };
      case 'SALIDA_PRODUCCION':
        return { label: 'Producción', classes: 'bg-orange-100 text-orange-700', icon: 'precision_manufacturing' };
      case 'AJUSTE_NEGATIVO':
        return { label: 'Ajuste −',   classes: 'bg-red-100 text-red-700',      icon: 'trending_down' };
      default:
        return { label: tipo,         classes: 'bg-gray-100 text-gray-600',    icon: 'swap_horiz' };
    }
  }

  esEntrada(tipo: TipoMovimientoMateria): boolean {
    return tipo === 'ENTRADA' || tipo === 'DEVOLUCION' || tipo === 'AJUSTE_POSITIVO';
  }

  cantidadLabel(mov: MovimientoMateriaResponse): string {
    const signo = this.esEntrada(mov.tipo) ? '+' : '−';
    return `${signo}${mov.cantidad.toFixed(3).replace(/\.?0+$/, '')}`;
  }

  cantidadClass(mov: MovimientoMateriaResponse): string {
    return this.esEntrada(mov.tipo)
      ? 'text-green-600 font-semibold'
      : 'text-red-600 font-semibold';
  }

  origenLabel(mov: MovimientoMateriaResponse): string {
    if (!mov.tipoReferencia) return '—';
    const tipo = mov.tipoReferencia;
    if (tipo === 'COMPRA')    return `Compra`;
    if (tipo === 'PRODUCCION') return `Producción`;
    return tipo;
  }

  fechaLabel(iso: string): string {
    return new Date(iso).toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  nivelStock(mp: MateriaPrimaResponse): 'critico' | 'bajo' | 'normal' {
    if (mp.stock <= 0) return 'critico';
    if (mp.stockCritico != null && mp.stock <= mp.stockCritico) return 'critico';
    if (mp.stockMinimo  != null && mp.stock <= mp.stockMinimo)  return 'bajo';
    return 'normal';
  }
}
