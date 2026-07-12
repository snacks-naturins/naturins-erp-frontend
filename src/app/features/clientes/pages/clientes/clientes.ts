import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { switchMap } from 'rxjs';

import { ClienteService } from '../../services/cliente.service';
import { ClienteResponse, EstadoCliente, TipoCliente } from '../../models/cliente.model';
import { PersonaService } from '../../../../core/services/persona.service';
import { TipoDocumentoService } from '../../../../core/services/tipo-documento.service';
import { TipoDocumentoResponse } from '../../../../core/models/tipo-documento.model';
import { PedidoService } from '../../../ventas/services/pedido.service';
import { PedidoResponse } from '../../../ventas/models/pedido.model';
import { FechaPipe } from '../../../../shared/pipes/fecha.pipe';
import { RbacPipe } from '../../../../shared/pipes/rbac.pipe';
import { debouncedSignal } from '../../../../shared/utils/debounce';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, DecimalPipe, FechaPipe, RbacPipe, BreadcrumbComponent, EmptyState],
  templateUrl: './clientes.html',
})
export class Clientes implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ClienteService);
  private readonly personaService = inject(PersonaService);
  private readonly tipoDocService = inject(TipoDocumentoService);
  private readonly pedidoService = inject(PedidoService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<ClienteResponse[]>([]);
  readonly tiposDoc = signal<TipoDocumentoResponse[]>([]);
  readonly search = signal('');
  readonly searchDebounced = debouncedSignal(this.search);

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
    correo: ['', [Validators.email]],
    direccion: [''],
    // Cliente
    tipoCliente: ['PERSONA' as TipoCliente, [Validators.required]],
    razonSocial: [''],
    ruc: [''],
    aplicaIgv: [false],
    limiteCredito: [null as number | null, [Validators.min(0)]],
    descuentoPreferencial: [null as number | null, [Validators.min(0), Validators.max(100)]],
    estado: ['ACTIVO' as EstadoCliente, [Validators.required]],
  });

  private readonly personaCtrls = [
    'tipoDocumentoId', 'numeroDocumento', 'nombres', 'apellidos', 'telefono', 'correo', 'direccion',
  ] as const;

  readonly estadoFiltro = signal('');

  readonly filtrados = computed(() => {
    const q = this.searchDebounced().toLowerCase().trim();
    const e = this.estadoFiltro();
    return this.items().filter((c) => {
      const matchE = !e || c.estado === e;
      const matchQ = !q || c.nombreCompleto.toLowerCase().includes(q) ||
        (c.razonSocial ?? '').toLowerCase().includes(q) ||
        (c.ruc ?? '').toLowerCase().includes(q);
      return matchE && matchQ;
    });
  });

  // KPIs
  readonly totalActivos    = computed(() => this.items().filter(c => c.estado === 'ACTIVO').length);
  readonly totalPotenciales= computed(() => this.items().filter(c => c.estado === 'POTENCIAL').length);
  readonly totalSuspendidos= computed(() => this.items().filter(c => c.estado === 'SUSPENDIDO').length);
  readonly totalEmpresas   = computed(() => this.items().filter(c => c.tipoCliente === 'EMPRESA').length);

  // Eliminar
  readonly deleteTarget = signal<ClienteResponse | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  // Historial de pedidos
  readonly fichaPedidos      = signal<ClienteResponse | null>(null);
  readonly pedidosCliente    = signal<PedidoResponse[]>([]);
  readonly loadingPedidos    = signal(false);
  readonly errorPedidos      = signal<string | null>(null);

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
        this.error.set('No se pudieron cargar los clientes.');
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
      tipoCliente: 'PERSONA',
      razonSocial: '',
      ruc: '',
      aplicaIgv: false,
      limiteCredito: null,
      descuentoPreferencial: null,
      estado: 'ACTIVO',
    });
    this.personaCtrls.forEach((c) => this.form.controls[c].enable());
    this.modalOpen.set(true);
  }

  abrirEditar(c: ClienteResponse): void {
    this.editId.set(c.id);
    this.editNombre.set(c.nombreCompleto);
    this.formError.set(null);
    this.form.reset({
      tipoDocumentoId: '',
      numeroDocumento: '',
      nombres: '',
      apellidos: '',
      telefono: '',
      correo: '',
      direccion: '',
      tipoCliente: (c.tipoCliente as TipoCliente) ?? 'PERSONA',
      razonSocial: c.razonSocial ?? '',
      ruc: c.ruc ?? '',
      aplicaIgv: c.aplicaIgv,
      limiteCredito: c.limiteCredito ?? null,
      descuentoPreferencial: c.descuentoPreferencial ?? null,
      estado: (c.estado as EstadoCliente) ?? 'ACTIVO',
    });
    // Al editar no se tocan los datos de la persona
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

    const datosCliente = {
      tipoCliente: v.tipoCliente,
      razonSocial: v.razonSocial || undefined,
      ruc: v.ruc || undefined,
      aplicaIgv: v.aplicaIgv,
      limiteCredito: v.limiteCredito,
      descuentoPreferencial: v.descuentoPreferencial,
      estado: v.estado,
    };

    const id = this.editId();
    if (id) {
      this.service.actualizar(id, datosCliente).subscribe({
        next: () => this.onSaved(),
        error: (err) => this.onError(err),
      });
      return;
    }

    // Alta: crear Persona y luego Cliente
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
      .pipe(switchMap((persona) => this.service.crear({ personaId: persona.id, ...datosCliente })))
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
    this.formError.set(err?.error?.message ?? 'No se pudo guardar el cliente.');
  }

  pedirEliminar(c: ClienteResponse): void {
    this.deleteError.set(null);
    this.deleteTarget.set(c);
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
        this.deleteError.set(err?.error?.message ?? 'No se pudo eliminar el cliente.');
      },
    });
  }

  abrirHistorial(c: ClienteResponse): void {
    this.fichaPedidos.set(c);
    this.pedidosCliente.set([]);
    this.errorPedidos.set(null);
    this.loadingPedidos.set(true);
    this.pedidoService.listarPorCliente(c.id).subscribe({
      next: (d) => {
        this.pedidosCliente.set(d.sort((a, b) => (b.fechaCreacion ?? '').localeCompare(a.fechaCreacion ?? '')));
        this.loadingPedidos.set(false);
      },
      error: () => {
        this.errorPedidos.set('No se pudieron cargar los pedidos.');
        this.loadingPedidos.set(false);
      },
    });
  }

  cerrarHistorial(): void {
    this.fichaPedidos.set(null);
  }

  setEstadoFiltro(v: string): void {
    this.estadoFiltro.set(this.estadoFiltro() === v ? '' : v);
  }

  limpiarFiltros(): void {
    this.estadoFiltro.set('');
    this.search.set('');
  }

  tipoLabel(t?: string | null): string {
    return t === 'EMPRESA' ? 'Empresa' : 'Persona';
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
