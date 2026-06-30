import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { BannerService } from '../../services/banner.service';
import { BannerResponse, CreateBannerRequest } from '../../models/banner.model';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';

@Component({
  selector: 'app-ecommerce-banners',
  standalone: true,
  imports: [MatIconModule, FormsModule, RouterLink, BreadcrumbComponent],
  templateUrl: './ecommerce-banners.html',
})
export class EcommerceBanners implements OnInit {
  private readonly svc = inject(BannerService);

  readonly loading  = signal(true);
  readonly error    = signal<string | null>(null);
  readonly banners  = signal<BannerResponse[]>([]);
  readonly saving   = signal(false);
  readonly deleting = signal<string | null>(null);
  readonly modalOpen = signal(false);
  readonly editando = signal<BannerResponse | null>(null);

  form: CreateBannerRequest = { titulo: '', urlImagen: '', subtitulo: '', urlDestino: '', orden: 0 };

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    this.svc.listar().subscribe({
      next: (d) => { this.banners.set(d); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar los banners.'); this.loading.set(false); },
    });
  }

  abrirNuevo(): void {
    this.editando.set(null);
    this.form = { titulo: '', urlImagen: '', subtitulo: '', urlDestino: '', orden: this.banners().length };
    this.modalOpen.set(true);
  }

  abrirEditar(b: BannerResponse): void {
    this.editando.set(b);
    this.form = { titulo: b.titulo, urlImagen: b.urlImagen, subtitulo: b.subtitulo ?? '', urlDestino: b.urlDestino ?? '', orden: b.orden };
    this.modalOpen.set(true);
  }

  guardar(): void {
    if (!this.form.titulo || !this.form.urlImagen) return;
    this.saving.set(true);
    const editObj = this.editando();
    const obs$ = editObj
      ? this.svc.actualizar(editObj.id, this.form)
      : this.svc.crear(this.form);

    obs$.subscribe({
      next: () => { this.saving.set(false); this.modalOpen.set(false); this.cargar(); },
      error: () => this.saving.set(false),
    });
  }

  toggleActivo(b: BannerResponse): void {
    this.svc.actualizar(b.id, { activo: !b.activo }).subscribe({
      next: (actualizado) =>
        this.banners.update((lista) => lista.map((item) => (item.id === b.id ? actualizado : item))),
    });
  }

  eliminar(id: string): void {
    if (!confirm('¿Eliminar este banner?')) return;
    this.deleting.set(id);
    this.svc.eliminar(id).subscribe({
      next: () => { this.deleting.set(null); this.cargar(); },
      error: () => this.deleting.set(null),
    });
  }
}
