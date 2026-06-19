import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { switchMap } from 'rxjs';

import { ProveedorService } from '../../services/proveedor.service';
import { EstadoProveedor, ProveedorResponse } from '../../models/proveedor.model';
import { PersonaService } from '../../../../core/services/persona.service';
import { TipoDocumentoService } from '../../../../core/services/tipo-documento.service';
import { TipoDocumentoResponse } from '../../../../core/models/tipo-documento.model';

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

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<ProveedorResponse[]>([]);
  readonly tiposDoc = signal<TipoDocumentoResponse[]>([]);
  readonly search = signal('');

  readonly modalOpen = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly editId = signal<string | null>(null);
  readonly editNombre = signal('');

  readonly form = this.fb.nonNullable.group({
    // Persona (solo al crear)
    tipoDocumentoId: ['', [Validators.required]],
    numeroDocumento: ['', [Validators.required, Validators.maxLength(20)]],
    nombres: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    telefono: [''],
    correo: [''],
    direccion: [''],
    // Proveedor
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

  readonly filtrados = computed(() => {
    const q = this.search().toLowerCase().trim();
    const list = this.items();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.nombreCompleto.toLowerCase().includes(q) ||
        (p.razonSocial ?? '').toLowerCase().includes(q) ||
        (p.ruc ?? '').toLowerCase().includes(q) ||
        (p.rubro ?? '').toLowerCase().includes(q),
    );
  });

  readonly deleteTarget = signal<ProveedorResponse | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
    this.tipoDocService.listar().subscribe({
      next: (t) => this.tiposDoc.set(t),
      error: () => this.tiposDoc.set([]),
    });
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.listar().subscribe({
      next: (d) => {
        this.items.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los proveedores.');
        this.loading.set(false);
      },
    });
  }

  onSearch(e: Event): void {
    this.search.set((e.target as HTMLInputElement).value);
  }

  abrirCrear(): void {
    this.editId.set(null);
    this.editNombre.set('');
    this.formError.set(null);
    this.form.reset({
      tipoDocumentoId: '',
      numeroDocumento: '',
      nombres: '',
      apellidos: '',
      telefono: '',
      correo: '',
      direccion: '',
      ruc: '',
      razonSocial: '',
      contacto: '',
      diasCredito: null,
      rubro: '',
      estado: 'ACTIVO',
    });
    this.personaCtrls.forEach((c) => this.form.controls[c].enable());
    this.modalOpen.set(true);
  }

  abrirEditar(p: ProveedorResponse): void {
    this.editId.set(p.id);
    this.editNombre.set(p.nombreCompleto);
    this.formError.set(null);
    this.form.reset({
      tipoDocumentoId: '',
      numeroDocumento: '',
      nombres: '',
      apellidos: '',
      telefono: '',
      correo: '',
      direccion: '',
      ruc: p.ruc ?? '',
      razonSocial: p.razonSocial ?? '',
      contacto: p.contacto ?? '',
      diasCredito: p.diasCredito ?? null,
      rubro: p.rubro ?? '',
      estado: (p.estado as EstadoProveedor) ?? 'ACTIVO',
    });
    this.personaCtrls.forEach((ctrl) => this.form.controls[ctrl].disable());
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
        next: () => this.onSaved(),
        error: (err) => this.onError(err),
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
        next: () => this.onSaved(),
        error: (err) => this.onError(err),
      });
  }

  private onSaved(): void {
    this.saving.set(false);
    this.modalOpen.set(false);
    this.cargar();
  }
  private onError(err: any): void {
    this.saving.set(false);
    this.formError.set(err?.error?.message ?? 'No se pudo guardar el proveedor.');
  }

  pedirEliminar(p: ProveedorResponse): void {
    this.deleteError.set(null);
    this.deleteTarget.set(p);
  }
  cancelarEliminar(): void {
    this.deleteTarget.set(null);
  }
  confirmarEliminar(): void {
    const t = this.deleteTarget();
    if (!t) return;
    this.deleting.set(true);
    this.service.eliminar(t.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.items.update((l) => l.filter((x) => x.id !== t.id));
      },
      error: (err) => {
        this.deleting.set(false);
        this.deleteError.set(err?.error?.message ?? 'No se pudo eliminar el proveedor.');
      },
    });
  }

  estado(e: string): { label: string; classes: string } {
    switch (e) {
      case 'ACTIVO':
        return { label: 'Activo', classes: 'bg-[#DCFCE7] text-[#15803D]' };
      case 'SUSPENDIDO':
        return { label: 'Suspendido', classes: 'bg-[#FEE2E2] text-[#B91C1C]' };
      case 'POTENCIAL':
        return { label: 'Potencial', classes: 'bg-[#DBEAFE] text-[#1D4ED8]' };
      default:
        return { label: 'Inactivo', classes: 'bg-[#F3F4F6] text-[#6B7280]' };
    }
  }
}
