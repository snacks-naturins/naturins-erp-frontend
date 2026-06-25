import { Injectable, signal } from '@angular/core';

export type ToastTipo = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  mensaje: string;
  tipo: ToastTipo;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(mensaje: string, tipo: ToastTipo = 'info', duracion = 3500): void {
    const id = Date.now();
    this.toasts.update((t) => [...t, { id, mensaje, tipo }]);
    setTimeout(() => this.dismiss(id), duracion);
  }

  success(msg: string, duracion?: number): void { this.show(msg, 'success', duracion); }
  error(msg: string, duracion?: number): void   { this.show(msg, 'error',   duracion ?? 5000); }
  info(msg: string, duracion?: number): void    { this.show(msg, 'info',    duracion); }
  warning(msg: string, duracion?: number): void { this.show(msg, 'warning', duracion); }

  dismiss(id: number): void {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }
}
