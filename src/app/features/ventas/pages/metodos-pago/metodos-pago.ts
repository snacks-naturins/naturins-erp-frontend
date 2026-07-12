import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { MetodoPagoService } from '../../services/metodo-pago.service';
import { MetodoPagoResponse, TipoMetodoPago } from '../../models/metodo-pago.model';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-metodos-pago',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, BreadcrumbComponent, EmptyState],
  templateUrl: './metodos-pago.html',
})
export class MetodosPago implements OnInit {
  private readonly svc = inject(MetodoPagoService);
  private readonly fb  = inject(FormBuilder);

  readonly loading       = signal(true);
  readonly saving        = signal(false);
  readonly error         = signal<string | null>(null);
  readonly metodos       = signal<MetodoPagoResponse[]>([]);
  readonly modalOpen     = signal(false);
  readonly editandoId    = signal<string | null>(null);
  readonly confirmDelete = signal<MetodoPagoResponse | null>(null);

  readonly tipoSel = signal<string | null>(null);
  readonly formError = signal<string | null>(null);

  readonly muestraQr            = computed(() => this.tipoSel() === 'YAPE' || this.tipoSel() === 'PLIN');
  readonly muestraTransferencia = computed(() => this.tipoSel() === 'TRANSFERENCIA');
  readonly muestraDescripcion   = computed(() => ['EFECTIVO', 'OTRO', 'TARJETA'].includes(this.tipoSel() ?? ''));

  readonly totalActivos   = computed(() => this.metodos().filter(m => m.estado === 'ACTIVO').length);
  readonly totalInactivos = computed(() => this.metodos().filter(m => m.estado === 'INACTIVO').length);

  readonly form = this.fb.group({
    nombre:              ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    tipo:                [''],
    estado:              ['ACTIVO'],
    descripcion:         [''],
    urlQr:               [''],
    numeroCelular:       [''],
    bancoNombre:         [''],
    numeroCuenta:        [''],
    cuentaInterbancaria: [''],
  });

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    this.svc.listar().subscribe({
      next: (d) => { this.metodos.set(d); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar la lista.'); this.loading.set(false); },
    });
  }

  abrirCrear(): void {
    this.editandoId.set(null);
    this.tipoSel.set(null);
    this.formError.set(null);
    this.form.reset({ nombre: '', tipo: '', estado: 'ACTIVO', descripcion: '', urlQr: '', numeroCelular: '', bancoNombre: '', numeroCuenta: '', cuentaInterbancaria: '' });
    this.modalOpen.set(true);
  }

  abrirEditar(m: MetodoPagoResponse): void {
    this.editandoId.set(m.id);
    this.tipoSel.set(m.tipo);
    this.formError.set(null);
    this.form.reset({
      nombre:              m.nombre,
      tipo:                m.tipo ?? '',
      estado:              m.estado,
      descripcion:         m.descripcion ?? '',
      urlQr:               m.urlQr ?? '',
      numeroCelular:       m.numeroCelular ?? '',
      bancoNombre:         m.bancoNombre ?? '',
      numeroCuenta:        m.numeroCuenta ?? '',
      cuentaInterbancaria: m.cuentaInterbancaria ?? '',
    });
    this.modalOpen.set(true);
  }

  onTipoCambio(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.tipoSel.set(val || null);
    this.form.patchValue({ urlQr: '', numeroCelular: '', bancoNombre: '', numeroCuenta: '', cuentaInterbancaria: '', descripcion: '' });
  }

  cerrarModal(): void { this.modalOpen.set(false); }

  guardar(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const v = this.form.value;
    const id = this.editandoId();

    const body = {
      nombre:              v.nombre!,
      tipo:                (v.tipo || undefined) as TipoMetodoPago | undefined,
      estado:              (v.estado || undefined) as any,
      descripcion:         v.descripcion || undefined,
      urlQr:               v.urlQr || undefined,
      numeroCelular:       v.numeroCelular || undefined,
      bancoNombre:         v.bancoNombre || undefined,
      numeroCuenta:        v.numeroCuenta || undefined,
      cuentaInterbancaria: v.cuentaInterbancaria || undefined,
    };

    const obs$ = id
      ? this.svc.actualizar(id, body)
      : this.svc.crear(body);

    obs$.subscribe({
      next: () => { this.saving.set(false); this.modalOpen.set(false); this.cargar(); },
      error: (err) => { this.saving.set(false); this.formError.set(err?.error?.message ?? 'Error al guardar.'); },
    });
  }

  toggleEstado(m: MetodoPagoResponse): void {
    const nuevoEstado = m.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    this.svc.actualizar(m.id, { estado: nuevoEstado }).subscribe({
      next: () => this.cargar(),
      error: (err) => this.error.set(err?.error?.message ?? 'Error al cambiar estado.'),
    });
  }

  pedirEliminar(m: MetodoPagoResponse): void { this.confirmDelete.set(m); }

  confirmarEliminar(): void {
    const m = this.confirmDelete();
    if (!m) return;
    this.confirmDelete.set(null);
    this.svc.eliminar(m.id).subscribe({
      next: () => this.cargar(),
      error: (err) => this.error.set(err?.error?.message ?? 'Error al eliminar.'),
    });
  }

  tipoIcono(tipo: string | null | undefined): string {
    switch (tipo) {
      case 'YAPE':          return 'phone_android';
      case 'PLIN':          return 'phone_android';
      case 'TRANSFERENCIA': return 'account_balance';
      case 'TARJETA':       return 'credit_card';
      case 'EFECTIVO':      return 'payments';
      default:              return 'attach_money';
    }
  }

  tipoLabel(tipo: string | null | undefined): string {
    switch (tipo) {
      case 'YAPE':          return 'Yape';
      case 'PLIN':          return 'Plin';
      case 'TRANSFERENCIA': return 'Transferencia';
      case 'TARJETA':       return 'Tarjeta';
      case 'EFECTIVO':      return 'Efectivo';
      case 'OTRO':          return 'Otro';
      default:              return '';
    }
  }

  tipoColorClass(tipo: string | null | undefined): string {
    switch (tipo) {
      case 'YAPE':          return 'bg-purple-50 text-purple-700';
      case 'PLIN':          return 'bg-sky-50 text-sky-700';
      case 'TRANSFERENCIA': return 'bg-blue-50 text-blue-700';
      case 'TARJETA':       return 'bg-amber-50 text-amber-700';
      case 'EFECTIVO':      return 'bg-green-50 text-green-700';
      default:              return 'bg-gray-50 text-gray-500';
    }
  }

  subtituloCard(m: MetodoPagoResponse): string {
    if ((m.tipo === 'YAPE' || m.tipo === 'PLIN') && m.numeroCelular) return m.numeroCelular;
    if (m.tipo === 'TRANSFERENCIA' && m.bancoNombre) return m.bancoNombre;
    if (m.descripcion) return m.descripcion;
    return '';
  }
}
