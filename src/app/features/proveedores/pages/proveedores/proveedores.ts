import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { switchMap } from 'rxjs';

import { UploadService } from '../../../../core/services/upload.service';

import { ProveedorService } from '../../services/proveedor.service';
import {
  EstadoCatalogoProveedor,
  EstadoProveedor,
  ProveedorProductoResponse,
  ProveedorResponse,
} from '../../models/proveedor.model';
import { PersonaService } from '../../../../core/services/persona.service';
import { PersonaResponse } from '../../../../core/models/persona.model';
import { TipoDocumentoService } from '../../../../core/services/tipo-documento.service';
import { TipoDocumentoResponse } from '../../../../core/models/tipo-documento.model';
import { MateriaPrimaService } from '../../../inventario/services/materia-prima.service';
import { MateriaPrimaResponse } from '../../../inventario/models/materia-prima.model';
import { debouncedSignal } from '../../../../shared/utils/debounce';

type Tab = 'compras' | 'catalogo';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './proveedores.html',
})
export class Proveedores implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProveedorService);
  private readonly personaService = inject(PersonaService);
  private readonly tipoDocService = inject(TipoDocumentoService);
  private readonly materiaPrimaService = inject(MateriaPrimaService);
  private readonly uploadService = inject(UploadService);

  // ── Lista ──────────────────────────────────────────────────
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<ProveedorResponse[]>([]);
  readonly search = signal('');
  readonly searchDebounced = debouncedSignal(this.search);
  readonly tiposDoc = signal<TipoDocumentoResponse[]>([]);
  readonly materiasPrimas = signal<MateriaPrimaResponse[]>([]);

  readonly filtrados = computed(() => {
    const q = this.searchDebounced().toLowerCase().trim();
    if (!q) return this.items();
    return this.items().filter(
      (p) =>
        p.nombreCompleto.toLowerCase().includes(q) ||
        (p.razonSocial ?? '').toLowerCase().includes(q) ||
        (p.ruc ?? '').toLowerCase().includes(q) ||
        (p.rubro ?? '').toLowerCase().includes(q),
    );
  });

  // ── Selección / Ficha ──────────────────────────────────────
  readonly seleccionadoId = signal<string | null>(null);
  readonly proveedorSeleccionado = computed(
    () => this.items().find((p) => p.id === this.seleccionadoId()) ?? null,
  );
  readonly selectedPersona = signal<PersonaResponse | null>(null);
  readonly loadingFicha = signal(false);

  // ── Catálogo ───────────────────────────────────────────────
  readonly catalogo = signal<ProveedorProductoResponse[]>([]);
  readonly loadingCatalogo = signal(false);
  readonly tabActiva = signal<Tab>('compras');

  // ── Modal proveedor ────────────────────────────────────────
  readonly modalOpen = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly editId = signal<string | null>(null);
  readonly editNombre = signal('');

  readonly form = this.fb.nonNullable.group({
    tipoDocumentoId: ['', [Validators.required]],
    numeroDocumento: ['', [Validators.required, Validators.maxLength(20)]],
    nombres: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    telefono: [''],
    correo: [''],
    direccion: [''],
    ruc: [''],
    razonSocial: [''],
    contacto: [''],
    diasCredito: [null as number | null],
    rubro: [''],
    estado: ['ACTIVO' as EstadoProveedor, [Validators.required]],
  });

  private readonly personaCtrls = [
    'tipoDocumentoId', 'numeroDocumento', 'nombres', 'apellidos', 'telefono', 'correo', 'direccion',
  ] as const;

  // ── Modal catálogo ─────────────────────────────────────────
  readonly modalCatalogo = signal(false);
  readonly savingCatalogo = signal(false);
  readonly formCatalogoError = signal<string | null>(null);
  readonly editCatalogoId = signal<string | null>(null);
  readonly editMateriaPrimaNombre = signal('');
  readonly uploadingImagen = signal(false);
  readonly previewImagen = signal<string | null>(null);

  readonly formCatalogo = this.fb.nonNullable.group({
    materiaPrimaId: ['', [Validators.required]],
    precioCompra: [null as number | null, [Validators.min(0.01)]],
    tiempoEntregaDias: [null as number | null],
    cantidadMinimaCompra: [null as number | null],
    esPrincipal: [false],
    observacion: [''],
    imagenUrl: [null as string | null],
    estado: ['ACTIVO' as EstadoCatalogoProveedor, [Validators.required]],
    motivo: [''],
  });

  // ── Modal eliminar proveedor ───────────────────────────────
  readonly deleteTarget = signal<ProveedorResponse | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  // ── Lifecycle ──────────────────────────────────────────────
  ngOnInit(): void {
    this.cargar();
    this.tipoDocService.listar().subscribe({
      next: (t) => this.tiposDoc.set(t),
      error: () => this.tiposDoc.set([]),
    });
    this.materiaPrimaService.listarActivos().subscribe({
      next: (m) => this.materiasPrimas.set(m),
      error: () => this.materiasPrimas.set([]),
    });
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.listar().subscribe({
      next: (d) => {
        this.items.set(d);
        this.loading.set(false);
        if (d.length > 0 && !this.seleccionadoId()) {
          this.seleccionar(d[0]);
        }
      },
      error: () => {
        this.error.set('No se pudieron cargar los proveedores.');
        this.loading.set(false);
      },
    });
  }

  seleccionar(p: ProveedorResponse): void {
    if (this.seleccionadoId() === p.id) return;
    this.seleccionadoId.set(p.id);
    this.tabActiva.set('compras');
    this.selectedPersona.set(null);
    this.catalogo.set([]);
    this.loadingCatalogo.set(false);
    this.loadingFicha.set(true);
    this.personaService.obtenerPorId(p.personaId).subscribe({
      next: (persona) => { this.selectedPersona.set(persona); this.loadingFicha.set(false); },
      error: () => this.loadingFicha.set(false),
    });
  }

  cargarCatalogo(): void {
    const sel = this.proveedorSeleccionado();
    if (!sel) return;
    this.loadingCatalogo.set(true);
    this.service.listarCatalogo(sel.id).subscribe({
      next: (c) => { this.catalogo.set(c); this.loadingCatalogo.set(false); },
      error: () => this.loadingCatalogo.set(false),
    });
  }

  cambiarTab(tab: Tab): void {
    this.tabActiva.set(tab);
    if (tab === 'catalogo' && this.catalogo().length === 0 && !this.loadingCatalogo()) {
      this.cargarCatalogo();
    }
  }

  onSearch(e: Event): void {
    this.search.set((e.target as HTMLInputElement).value);
  }

  // ── Helpers visuales ───────────────────────────────────────
  nombreDisplay(p: ProveedorResponse): string {
    return p.razonSocial || p.nombreCompleto;
  }

  estadoBadge(e: string): { label: string; classes: string } {
    switch (e) {
      case 'ACTIVO':     return { label: 'Activo',     classes: 'bg-green-100 text-green-700' };
      case 'SUSPENDIDO': return { label: 'Suspendido', classes: 'bg-red-100 text-red-700' };
      case 'POTENCIAL':  return { label: 'Potencial',  classes: 'bg-blue-100 text-blue-700' };
      default:           return { label: 'Inactivo',   classes: 'bg-gray-100 text-gray-600' };
    }
  }

  desdeAnio(fecha?: string): string {
    if (!fecha) return '';
    return `Desde ${new Date(fecha).getFullYear()}`;
  }

  precioLabel(v?: number | null): string {
    if (v == null || v === 0) return '—';
    return `S/ ${v.toFixed(2)}`;
  }

  cantidadLabel(v?: number | null): string {
    if (v == null) return '—';
    return Number.isInteger(v) ? String(v) : v.toFixed(3);
  }

  nombreMateriaPrimaLabel(c: ProveedorProductoResponse): string {
    return `${c.nombreMateriaPrima} (${c.unidadMedida})`;
  }

  // ── Modal proveedor ────────────────────────────────────────
  abrirCrear(): void {
    this.editId.set(null);
    this.editNombre.set('');
    this.formError.set(null);
    this.form.reset({
      tipoDocumentoId: '', numeroDocumento: '', nombres: '', apellidos: '',
      telefono: '', correo: '', direccion: '',
      ruc: '', razonSocial: '', contacto: '', diasCredito: null, rubro: '', estado: 'ACTIVO',
    });
    this.personaCtrls.forEach((c) => this.form.controls[c].enable());
    this.modalOpen.set(true);
  }

  abrirEditar(p: ProveedorResponse): void {
    this.editId.set(p.id);
    this.editNombre.set(p.nombreCompleto);
    this.formError.set(null);
    this.form.reset({
      tipoDocumentoId: '', numeroDocumento: '', nombres: '', apellidos: '',
      telefono: '', correo: '', direccion: '',
      ruc: p.ruc ?? '', razonSocial: p.razonSocial ?? '',
      contacto: p.contacto ?? '', diasCredito: p.diasCredito ?? null,
      rubro: p.rubro ?? '', estado: (p.estado as EstadoProveedor) ?? 'ACTIVO',
    });
    this.personaCtrls.forEach((c) => this.form.controls[c].disable());
    this.modalOpen.set(true);
  }

  cerrarModal(): void { this.modalOpen.set(false); }

  guardar(): void {
    this.formError.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.saving.set(true);

    const datos = {
      ruc: v.ruc || undefined,
      razonSocial: v.razonSocial || undefined,
      contacto: v.contacto || undefined,
      diasCredito: v.diasCredito,
      rubro: v.rubro || undefined,
      estado: v.estado,
    };

    const id = this.editId();
    if (id) {
      this.service.actualizar(id, datos).subscribe({
        next: () => { this.saving.set(false); this.modalOpen.set(false); this.cargar(); },
        error: (err) => { this.saving.set(false); this.formError.set(err?.error?.message ?? 'No se pudo guardar.'); },
      });
      return;
    }

    this.personaService
      .crear({
        tipoDocumentoId: v.tipoDocumentoId,
        numeroDocumento: v.numeroDocumento,
        nombres: v.nombres,
        apellidos: v.apellidos,
        telefono: v.telefono || undefined,
        correo: v.correo || undefined,
        direccion: v.direccion || undefined,
        estado: 'ACTIVO',
      })
      .pipe(switchMap((persona) => this.service.crear({ personaId: persona.id, ...datos })))
      .subscribe({
        next: () => { this.saving.set(false); this.modalOpen.set(false); this.cargar(); },
        error: (err) => { this.saving.set(false); this.formError.set(err?.error?.message ?? 'No se pudo crear el proveedor.'); },
      });
  }

  // ── Modal catálogo ─────────────────────────────────────────
  abrirAgregarCatalogo(): void {
    this.editCatalogoId.set(null);
    this.editMateriaPrimaNombre.set('');
    this.formCatalogoError.set(null);
    this.previewImagen.set(null);
    this.formCatalogo.reset({
      materiaPrimaId: '', precioCompra: null, tiempoEntregaDias: null,
      cantidadMinimaCompra: null, esPrincipal: false, observacion: '', imagenUrl: null,
      estado: 'ACTIVO', motivo: '',
    });
    this.formCatalogo.controls.materiaPrimaId.enable();
    this.modalCatalogo.set(true);
  }

  abrirEditarCatalogo(c: ProveedorProductoResponse): void {
    this.editCatalogoId.set(c.id);
    this.editMateriaPrimaNombre.set(`${c.nombreMateriaPrima} (${c.unidadMedida})`);
    this.formCatalogoError.set(null);
    this.previewImagen.set(c.imagenUrl ?? null);
    this.formCatalogo.reset({
      materiaPrimaId: c.materiaPrimaId,
      precioCompra: c.precioCompra,
      tiempoEntregaDias: c.tiempoEntregaDias ?? null,
      cantidadMinimaCompra: c.cantidadMinimaCompra ?? null,
      esPrincipal: c.esPrincipal,
      observacion: c.observacion ?? '',
      imagenUrl: c.imagenUrl ?? null,
      estado: c.estado as EstadoCatalogoProveedor,
      motivo: '',
    });
    this.formCatalogo.controls.materiaPrimaId.disable();
    this.modalCatalogo.set(true);
  }

  cerrarModalCatalogo(): void { this.modalCatalogo.set(false); }

  onImagenSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadingImagen.set(true);
    this.uploadService.subirImagen(file).subscribe({
      next: (res) => {
        this.formCatalogo.controls.imagenUrl.setValue(res.url);
        this.previewImagen.set(res.url);
        this.uploadingImagen.set(false);
      },
      error: () => {
        this.formCatalogoError.set('No se pudo subir la imagen. Intenta de nuevo.');
        this.uploadingImagen.set(false);
      },
    });
    input.value = '';
  }

  quitarImagen(): void {
    this.formCatalogo.controls.imagenUrl.setValue(null);
    this.previewImagen.set(null);
  }

  guardarCatalogo(): void {
    this.formCatalogoError.set(null);
    if (this.formCatalogo.invalid) { this.formCatalogo.markAllAsTouched(); return; }
    const sel = this.proveedorSeleccionado();
    if (!sel) return;

    const v = this.formCatalogo.getRawValue();
    this.savingCatalogo.set(true);
    const catalogoId = this.editCatalogoId();

    const req$ = catalogoId
      ? this.service.actualizarCatalogo(sel.id, catalogoId, {
          precioCompra: v.precioCompra ?? undefined,
          tiempoEntregaDias: v.tiempoEntregaDias,
          cantidadMinimaCompra: v.cantidadMinimaCompra,
          esPrincipal: v.esPrincipal,
          observacion: v.observacion || undefined,
          imagenUrl: v.imagenUrl ?? undefined,
          estado: v.estado,
          motivoCambioPrecio: v.motivo || undefined,
        })
      : this.service.agregarCatalogo(sel.id, {
          materiaPrimaId: v.materiaPrimaId,
          precioCompra: v.precioCompra ?? null,
          tiempoEntregaDias: v.tiempoEntregaDias,
          cantidadMinimaCompra: v.cantidadMinimaCompra,
          esPrincipal: v.esPrincipal,
          observacion: v.observacion || undefined,
          imagenUrl: v.imagenUrl ?? undefined,
          estado: v.estado,
          motivoPrecio: v.motivo || undefined,
        });

    req$.subscribe({
      next: () => {
        this.savingCatalogo.set(false);
        this.modalCatalogo.set(false);
        this.cargarCatalogo();
      },
      error: (err) => {
        this.savingCatalogo.set(false);
        this.formCatalogoError.set(err?.error?.message ?? 'No se pudo guardar.');
      },
    });
  }

  eliminarItemCatalogo(c: ProveedorProductoResponse): void {
    const sel = this.proveedorSeleccionado();
    if (!sel) return;
    this.service.eliminarCatalogo(sel.id, c.id).subscribe({
      next: () => this.catalogo.update((l) => l.filter((x) => x.id !== c.id)),
      error: () => {},
    });
  }

  // ── Modal eliminar proveedor ───────────────────────────────
  pedirEliminar(p: ProveedorResponse): void {
    this.deleteError.set(null);
    this.deleteTarget.set(p);
  }
  cancelarEliminar(): void { this.deleteTarget.set(null); }

  confirmarEliminar(): void {
    const t = this.deleteTarget();
    if (!t) return;
    this.deleting.set(true);
    this.service.eliminar(t.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        const wasSelected = this.seleccionadoId() === t.id;
        this.items.update((l) => l.filter((x) => x.id !== t.id));
        if (wasSelected) {
          this.seleccionadoId.set(null);
          this.selectedPersona.set(null);
          this.catalogo.set([]);
          const remaining = this.items();
          if (remaining.length > 0) this.seleccionar(remaining[0]);
        }
      },
      error: (err) => {
        this.deleting.set(false);
        this.deleteError.set(err?.error?.message ?? 'No se pudo eliminar el proveedor.');
      },
    });
  }
}
