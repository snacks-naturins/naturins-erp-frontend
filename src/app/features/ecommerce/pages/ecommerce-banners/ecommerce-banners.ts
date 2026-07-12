import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { BannerService } from '../../services/banner.service';
import { BannerResponse } from '../../models/banner.model';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';

@Component({
  selector: 'app-ecommerce-banners',
  standalone: true,
  imports: [MatIconModule, RouterLink, BreadcrumbComponent],
  templateUrl: './ecommerce-banners.html',
})
export class EcommerceBanners implements OnInit {
  private readonly svc = inject(BannerService);

  readonly loading      = signal(true);
  readonly error        = signal<string | null>(null);
  readonly banners      = signal<BannerResponse[]>([]);
  readonly deleteTarget = signal<BannerResponse | null>(null);
  readonly deleting     = signal(false);
  readonly deleteError  = signal<string | null>(null);

  readonly activoFiltro = signal('');

  readonly totalActivos = computed(() => this.banners().filter(b => b.activo).length);
  readonly totalOcultos = computed(() => this.banners().filter(b => !b.activo).length);

  readonly filtrados = computed(() => {
    const v = this.activoFiltro();
    return this.banners().filter(b =>
      v === 'activo' ? b.activo : v === 'oculto' ? !b.activo : true
    );
  });

  setActivoFiltro(v: string): void {
    this.activoFiltro.set(this.activoFiltro() === v ? '' : v);
  }

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    this.svc.listar().subscribe({
      next: (d) => { this.banners.set(d); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar los banners.'); this.loading.set(false); },
    });
  }

  toggleActivo(b: BannerResponse): void {
    this.svc.actualizar(b.id, { activo: !b.activo }).subscribe({
      next: (actualizado) =>
        this.banners.update((lista) => lista.map((item) => (item.id === b.id ? actualizado : item))),
      error: () => {},
    });
  }

  pedirEliminar(b: BannerResponse): void { this.deleteError.set(null); this.deleteTarget.set(b); }
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
}
