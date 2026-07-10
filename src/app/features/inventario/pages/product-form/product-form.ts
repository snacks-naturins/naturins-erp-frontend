import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';

import { ProductoService } from '../../services/producto.service';
import { CategoriaService } from '../../services/categoria.service';
import { CategoriaResponse } from '../../models/categoria.model';
import { UploadService } from '../../../../core/services/upload.service';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';
import { CanComponentDeactivate } from '../../../../core/guards/can-deactivate.guard';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatIconModule, BreadcrumbComponent],
  templateUrl: './product-form.html',
})
export class ProductForm implements OnInit, CanComponentDeactivate {
  private readonly fb = inject(FormBuilder);
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly uploadService = inject(UploadService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Modo edición (si hay :id en la ruta)
  readonly editId = signal<string | null>(null);
  readonly loadingProducto = signal(false);

  readonly breadcrumb = computed(() => [
    {label: 'Inicio', ruta: '/dashboard'},
    {label: 'Inventario'},
    {label: 'Productos', ruta: '/productos'},
    {label: this.editId() ? 'Editar producto' : 'Nuevo producto'},
  ]);

  // Imagen principal
  readonly uploading = signal(false);
  readonly uploadError = signal<string | null>(null);
  readonly dragging = signal(false);

  // Galería de imágenes adicionales
  readonly imagenesAdicionales = signal<string[]>([]);
  readonly nuevaImagenUrl = signal('');
  readonly uploadingAdicional = signal(false);
  readonly uploadErrorAdicional = signal<string | null>(null);

  readonly categorias = signal<CategoriaResponse[]>([]);
  readonly saving = signal(false);
  readonly errorMsg = signal<string | null>(null);

  // Modal de creación rápida de categoría
  readonly catModalOpen = signal(false);
  readonly catSaving = signal(false);
  readonly catError = signal<string | null>(null);
  readonly catForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    colorInterfaz: ['#9B4D00'],
  });

  readonly form = this.fb.nonNullable.group({
    // Campos persistidos en el backend
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    descripcion: ['', [Validators.maxLength(500)]],
    categoriaId: ['', [Validators.required]],
    urlImagen: [''],
    activo: [true],
    stockMinimo: [50 as number | null, [Validators.min(0)]],
    stockCritico: [20 as number | null, [Validators.min(0)]],
    precioCompra: [null as number | null, [Validators.min(0)]],
    precioVentaRef: [null as number | null],
    visibleEcommerce: [true],
    // Información nutricional
    ingredientes: [''],
    pesoNeto: [''],
    porcionRecomendada: [''],
    caloriasXPorcion: [null as number | null, [Validators.min(0)]],
    proteinasXPorcion: [null as number | null, [Validators.min(0)]],
    carbohidratosXPorcion: [null as number | null, [Validators.min(0)]],
    grasasXPorcion: [null as number | null, [Validators.min(0)]],
    fibrasXPorcion: [null as number | null, [Validators.min(0)]],
    alergenos: [''],
    certificaciones: [''],
  });

  private readonly value = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  readonly margen = computed(() => {
    const { precioCompra, precioVentaRef } = this.value();
    if (!precioCompra || !precioVentaRef || precioVentaRef <= 0) return null;
    return Math.round(((precioVentaRef - precioCompra) / precioVentaRef) * 100);
  });

  readonly imagenUrl = computed(() => this.value().urlImagen?.trim() || '');

  // --- Imagen del producto ---

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.subirImagen(file);
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.subirImagen(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
  }

  quitarImagen(): void {
    this.form.controls.urlImagen.setValue('');
    this.uploadError.set(null);
  }

  agregarImagenAdicional(): void {
    const url = this.nuevaImagenUrl().trim();
    if (!url) return;
    this.imagenesAdicionales.update(list => [...list, url]);
    this.nuevaImagenUrl.set('');
  }

  quitarImagenAdicional(idx: number): void {
    this.imagenesAdicionales.update(list => list.filter((_, i) => i !== idx));
  }

  onFileSelectedAdicional(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.subirImagenAdicional(file);
    input.value = '';
  }

  private subirImagenAdicional(file: File): void {
    this.uploadErrorAdicional.set(null);
    if (!file.type.startsWith('image/')) {
      this.uploadErrorAdicional.set('El archivo debe ser una imagen.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.uploadErrorAdicional.set('La imagen no puede superar 5MB.');
      return;
    }
    this.uploadingAdicional.set(true);
    this.uploadService.subirImagen(file).subscribe({
      next: (res) => {
        this.uploadingAdicional.set(false);
        this.imagenesAdicionales.update(list => [...list, res.url]);
      },
      error: (err) => {
        this.uploadingAdicional.set(false);
        this.uploadErrorAdicional.set(err?.error?.message ?? 'No se pudo subir la imagen.');
      },
    });
  }

  private subirImagen(file: File): void {
    this.uploadError.set(null);

    if (!file.type.startsWith('image/')) {
      this.uploadError.set('El archivo debe ser una imagen.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.uploadError.set('La imagen no puede superar 5MB.');
      return;
    }

    this.uploading.set(true);
    this.uploadService.subirImagen(file).subscribe({
      next: (res) => {
        this.uploading.set(false);
        this.form.controls.urlImagen.setValue(res.url);
      },
      error: (err) => {
        this.uploading.set(false);
        this.uploadError.set(err?.error?.message ?? 'No se pudo subir la imagen.');
      },
    });
  }

  ngOnInit(): void {
    this.cargarCategorias();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId.set(id);
      this.cargarProducto(id);
    }
  }

  private cargarCategorias(): void {
    this.categoriaService.listar().subscribe({
      next: (c) => this.categorias.set(c),
      error: () => this.categorias.set([]),
    });
  }

  private cargarProducto(id: string): void {
    this.loadingProducto.set(true);
    this.productoService.obtenerPorId(id).subscribe({
      next: (p) => {
        this.loadingProducto.set(false);
        this.form.patchValue({
          nombre:                p.nombre,
          descripcion:           p.descripcion           ?? '',
          categoriaId:           p.categoriaId,
          urlImagen:             p.urlImagen             ?? '',
          precioCompra:          p.precioCompra          ?? null,
          stockMinimo:           p.stockMinimo           ?? null,
          stockCritico:          p.stockCritico          ?? null,
          activo:                p.estado === 'ACTIVO',
          visibleEcommerce:      p.visibleEcommerce      ?? false,
          ingredientes:          p.ingredientes          ?? '',
          pesoNeto:              p.pesoNeto              ?? '',
          porcionRecomendada:    p.porcionRecomendada    ?? '',
          caloriasXPorcion:      p.caloriasXPorcion      ?? null,
          proteinasXPorcion:     p.proteinasXPorcion     ?? null,
          carbohidratosXPorcion: p.carbohidratosXPorcion ?? null,
          grasasXPorcion:        p.grasasXPorcion        ?? null,
          fibrasXPorcion:        p.fibrasXPorcion        ?? null,
          alergenos:             p.alergenos             ?? '',
          certificaciones:       p.certificaciones       ?? '',
        });
        this.imagenesAdicionales.set(p.imagenesAdicionales ?? []);
      },
      error: () => {
        this.loadingProducto.set(false);
        this.errorMsg.set('No se pudo cargar el producto a editar.');
      },
    });
  }

  abrirCatModal(): void {
    this.catError.set(null);
    this.catForm.reset({ nombre: '', colorInterfaz: '#9B4D00' });
    this.catModalOpen.set(true);
  }

  cerrarCatModal(): void {
    this.catModalOpen.set(false);
  }

  guardarCategoria(): void {
    this.catError.set(null);

    if (this.catForm.invalid) {
      this.catForm.markAllAsTouched();
      return;
    }

    const v = this.catForm.getRawValue();
    this.catSaving.set(true);

    this.categoriaService
      .crear({ nombre: v.nombre, colorInterfaz: v.colorInterfaz, estado: 'ACTIVA' })
      .subscribe({
        next: (cat) => {
          this.catSaving.set(false);
          this.catModalOpen.set(false);
          this.categorias.update((list) => [...list, cat]);
          this.form.controls.categoriaId.setValue(cat.id);
        },
        error: (err) => {
          this.catSaving.set(false);
          this.catError.set(
            err?.error?.message ?? 'No se pudo crear la categoría.',
          );
        },
      });
  }

  guardar(): void {
    this.errorMsg.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    const stockMin  = v.stockMinimo  ?? 0;
    const stockCrit = v.stockCritico ?? 0;
    if (stockMin > 0 && stockCrit > 0 && stockCrit > stockMin) {
      this.errorMsg.set('El stock crítico no puede ser mayor al stock mínimo.');
      return;
    }
    const payload = {
      categoriaId:           v.categoriaId,
      nombre:                v.nombre,
      descripcion:           v.descripcion || undefined,
      urlImagen:             v.urlImagen || undefined,
      precioCompra:          v.precioCompra          ?? null,
      stockMinimo:           v.stockMinimo           ?? null,
      stockCritico:          v.stockCritico          ?? null,
      estado:                (v.activo ? 'ACTIVO' : 'INACTIVO') as 'ACTIVO' | 'INACTIVO',
      visibleEcommerce:      v.visibleEcommerce,
      ingredientes:          v.ingredientes          || null,
      pesoNeto:              v.pesoNeto              || null,
      porcionRecomendada:    v.porcionRecomendada    || null,
      caloriasXPorcion:      v.caloriasXPorcion      ?? null,
      proteinasXPorcion:     v.proteinasXPorcion     ?? null,
      carbohidratosXPorcion: v.carbohidratosXPorcion ?? null,
      grasasXPorcion:        v.grasasXPorcion        ?? null,
      fibrasXPorcion:        v.fibrasXPorcion        ?? null,
      alergenos:             v.alergenos             || null,
      certificaciones:       v.certificaciones       || null,
      imagenesAdicionales:   this.imagenesAdicionales(),
    };

    this.saving.set(true);
    const id = this.editId();
    const request$ = id
      ? this.productoService.actualizar(id, payload)
      : this.productoService.crear(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.form.markAsPristine();
        this.router.navigate(['/productos']);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMsg.set(
          err?.error?.message ?? 'No se pudo guardar el producto. Revisa los datos.',
        );
      },
    });
  }

  canDeactivate(): boolean {
    return !this.form.dirty;
  }
}
