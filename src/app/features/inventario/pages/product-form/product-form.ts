import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';

import { ProductoService } from '../../services/producto.service';
import { CategoriaService } from '../../services/categoria.service';
import { CategoriaResponse } from '../../models/categoria.model';
import { UploadService } from '../../../../core/services/upload.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatIconModule],
  templateUrl: './product-form.html',
})
export class ProductForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly uploadService = inject(UploadService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Modo edición (si hay :id en la ruta)
  readonly editId = signal<string | null>(null);
  readonly loadingProducto = signal(false);

  // Imagen
  readonly uploading = signal(false);
  readonly uploadError = signal<string | null>(null);
  readonly dragging = signal(false);

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
    // Campos de UI (aún no modelados en el backend de Producto)
    unidad: ['UNIDAD'],
    stockMinimo: [50],
    stockCritico: [20],
    stockInicial: [0],
    precioCompra: [null as number | null],
    precioVenta: [null as number | null],
    visibleEcommerce: [true],
    controlLotes: [true],
    permitirDescuentos: [false],
  });

  private readonly value = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  readonly margen = computed(() => {
    const { precioCompra, precioVenta } = this.value();
    if (!precioCompra || !precioVenta || precioVenta <= 0) return null;
    return Math.round(((precioVenta - precioCompra) / precioVenta) * 100);
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
          nombre: p.nombre,
          descripcion: p.descripcion ?? '',
          categoriaId: p.categoriaId,
          urlImagen: p.urlImagen ?? '',
          activo: p.estado === 'ACTIVO',
        });
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
    const payload = {
      categoriaId: v.categoriaId,
      nombre: v.nombre,
      descripcion: v.descripcion || undefined,
      urlImagen: v.urlImagen || undefined,
      estado: (v.activo ? 'ACTIVO' : 'INACTIVO') as 'ACTIVO' | 'INACTIVO',
    };

    this.saving.set(true);
    const id = this.editId();
    const request$ = id
      ? this.productoService.actualizar(id, payload)
      : this.productoService.crear(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
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
}
