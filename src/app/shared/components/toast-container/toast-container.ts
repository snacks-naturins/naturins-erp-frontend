import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { ToastService, Toast, ToastTipo } from '../../../core/services/toast.service';

const CONFIG: Record<ToastTipo, { accent: string; iconBg: string; iconColor: string; label: string; icon: string }> = {
  success: {
    accent:    'bg-green-500',
    iconBg:    'bg-green-100',
    iconColor: 'text-green-600',
    label:     'Éxito',
    icon:      'check_circle',
  },
  error: {
    accent:    'bg-red-500',
    iconBg:    'bg-red-100',
    iconColor: 'text-red-600',
    label:     'Error',
    icon:      'error_outline',
  },
  warning: {
    accent:    'bg-amber-400',
    iconBg:    'bg-amber-100',
    iconColor: 'text-amber-600',
    label:     'Advertencia',
    icon:      'warning_amber',
  },
  info: {
    accent:    'bg-blue-500',
    iconBg:    'bg-blue-100',
    iconColor: 'text-blue-600',
    label:     'Información',
    icon:      'info',
  },
};

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div
      class="fixed z-[9999] flex flex-col items-center gap-2 pointer-events-none px-4"
      style="top: 84px; left: 50%; transform: translateX(-50%); width: min(440px, 100vw)">

      @for (t of svc.toasts(); track t.id) {
        @let cfg = config(t);
        <div
          class="pointer-events-auto w-full flex items-stretch rounded-2xl bg-bg-card border border-border-soft overflow-hidden"
          style="box-shadow: 0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)"
          [class]="t.exiting ? 'toast-exit' : 'toast-enter'">

          <!-- Accent bar izquierdo -->
          <div class="w-1 shrink-0" [class]="cfg.accent"></div>

          <!-- Contenido -->
          <div class="flex items-center gap-3 flex-1 px-3 py-3 min-w-0">

            <!-- Ícono en cuadrado redondeado -->
            <div class="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" [class]="cfg.iconBg">
              <mat-icon fontSet="material-icons-outlined" class="text-[20px]!" [class]="cfg.iconColor">
                {{ cfg.icon }}
              </mat-icon>
            </div>

            <!-- Texto -->
            <div class="flex-1 min-w-0">
              <p class="text-[10px] font-bold uppercase tracking-widest leading-none mb-0.5" [class]="cfg.iconColor">
                {{ cfg.label }}
              </p>
              <p class="text-sm font-medium text-text-main leading-snug">{{ t.mensaje }}</p>
            </div>

            <!-- Cerrar -->
            <button
              (click)="svc.dismiss(t.id)"
              class="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-text-muted hover:bg-bg-app transition">
              <mat-icon class="text-[16px]!">close</mat-icon>
            </button>

          </div>
        </div>

        <!-- Barra de progreso debajo del toast -->
        @if (!t.exiting) {
          <div class="w-full -mt-1.5 h-0.5 rounded-full overflow-hidden bg-border-soft opacity-60" style="max-width: min(440px, 100vw); padding: 0 4px">
            <div class="h-full rounded-full" [class]="cfg.accent"
              [style]="'animation: toast-progress ' + t.duracion + 'ms linear both'"></div>
          </div>
        }
      }
    </div>
  `,
})
export class ToastContainer {
  readonly svc = inject(ToastService);

  config(t: Toast) {
    return CONFIG[t.tipo];
  }
}
