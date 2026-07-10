import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { BannerService } from '../../services/banner.service';
import { BannerResponse } from '../../models/banner.model';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';

@Component({
  selector: 'app-ecommerce-banners',
  standalone: true,
  imports: [MatIconModule, ReactiveFormsModule, RouterLink, BreadcrumbComponent],
  templateUrl: './ecommerce-banners.html',
})
export class EcommerceBanners implements OnInit {
  private readonly svc = inject(BannerService);
  private readonly fb  = inject(FormBuilder);

  readonly loading      = signal(true);
  readonly error        = signal<string | null>(null);
  readonly banners      = signal<BannerResponse[]>([]);
  readonly saving       = signal(false);
  readonly formError    = signal<string | null>(null);
  readonly deleteTarget = signal<BannerResponse | null>(null);
  readonly deleting     = signal(false);
  readonly deleteError  = signal<string | null>(null);
  readonly modalOpen    = signal(false);
  readonly editando     = signal<BannerResponse | null>(null);

  readonly form = this.fb.nonNullable.group({
    titulo:      ['', [Validators.required, Validators.maxLength(150)]],
    subtitulo:   [''],
    urlImagen:   ['', [Validators.required]],
    urlDestino:  [''],
    orden:       [0, [Validators.min(0)]],
  });

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
    this.formError.set(null);
    this.form.reset({ titulo: '', subtitulo: '', urlImagen: '', urlDestino: '', orden: this.banners().length });
    this.modalOpen.set(true);
  }

  abrirEditar(b: BannerResponse): void {
    this.editando.set(b);
    this.formError.set(null);
    this.form.reset({ titulo: b.titulo, subtitulo: b.subtitulo ?? '', urlImagen: b.urlImagen, urlDestino: b.urlDestino ?? '', orden: b.orden });
    this.modalOpen.set(true);
  }

  guardar(): void {
    this.formError.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.getRawValue();

    if (v.urlDestino?.trim()) {
      try { new URL(v.urlDestino); } catch {
        this.formError.set('La URL de destino no tiene un formato válido.');
        return;
      }
    }

    this.saving.set(true);
    const editObj = this.editando();
    const obs$ = editObj
      ? this.svc.actualizar(editObj.id, v)
      : this.svc.crear(v);

    obs$.subscribe({
      next: () => { this.saving.set(false); this.modalOpen.set(false); this.cargar(); },
      error: (err) => { this.saving.set(false); this.formError.set(err?.error?.message ?? 'Error al guardar el banner.'); },
    });
  }

  toggleActivo(b: BannerResponse): void {
    this.svc.actualizar(b.id, { activo: !b.activo }).subscribe({
      next: (actualizado) =>
        this.banners.update((lista) => lista.map((item) => (item.id === b.id ? actualizado : item))),
      error: (err) => { this.formError.set(err?.error?.message ?? 'Error al cambiar estado del banner.'); },
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
