import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { MetodoPagoService } from '../../services/metodo-pago.service';
import { MetodoPagoResponse } from '../../models/metodo-pago.model';
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

  readonly loading  = signal(true);
  readonly saving   = signal(false);
  readonly error    = signal<string | null>(null);
  readonly metodos  = signal<MetodoPagoResponse[]>([]);

  readonly modalOpen    = signal(false);
  readonly editandoId   = signal<string | null>(null);
  readonly confirmDelete = signal<MetodoPagoResponse | null>(null);

  readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    estado: ['ACTIVO'],
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
    this.form.reset({ nombre: '', estado: 'ACTIVO' });
    this.modalOpen.set(true);
  }

  abrirEditar(m: MetodoPagoResponse): void {
    this.editandoId.set(m.id);
    this.form.reset({ nombre: m.nombre, estado: m.estado });
    this.modalOpen.set(true);
  }

  cerrarModal(): void { this.modalOpen.set(false); }

  guardar(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const { nombre, estado } = this.form.value;
    const id = this.editandoId();
    const obs$ = id
      ? this.svc.actualizar(id, { nombre: nombre!, estado: estado! })
      : this.svc.crear({ nombre: nombre! });
    obs$.subscribe({
      next: () => { this.saving.set(false); this.modalOpen.set(false); this.cargar(); },
      error: (err) => { this.saving.set(false); this.error.set(err?.error?.message ?? 'Error al guardar.'); },
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

  metodoIcono(nombre: string): string {
    const n = nombre.toLowerCase();
    if (n.includes('efectiv')) return 'payments';
    if (n.includes('tarjet') || n.includes('card') || n.includes('visa') || n.includes('master')) return 'credit_card';
    if (n.includes('yape')) return 'phone_android';
    if (n.includes('plin')) return 'phone_android';
    if (n.includes('transf') || n.includes('deposit')) return 'account_balance';
    if (n.includes('cheque')) return 'receipt';
    return 'attach_money';
  }
}
