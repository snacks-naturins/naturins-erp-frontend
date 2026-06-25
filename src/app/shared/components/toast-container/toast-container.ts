import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 w-[340px] max-w-[calc(100vw-2.5rem)]">
      @for (t of svc.toasts(); track t.id) {
        <div
          class="flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg text-sm font-medium transition-all"
          [class]="clases(t)">
          <mat-icon class="text-[18px]! h-5! w-5! shrink-0 mt-0.5">{{ icono(t) }}</mat-icon>
          <span class="flex-1 leading-snug">{{ t.mensaje }}</span>
          <button (click)="svc.dismiss(t.id)" class="shrink-0 opacity-60 hover:opacity-100 transition">
            <mat-icon class="text-[16px]! h-4! w-4!">close</mat-icon>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainer {
  readonly svc = inject(ToastService);

  clases(t: Toast): string {
    const map: Record<string, string> = {
      success: 'bg-green-600 text-white',
      error:   'bg-red-600   text-white',
      warning: 'bg-amber-500 text-white',
      info:    'bg-gray-800  text-white',
    };
    return map[t.tipo] ?? map['info'];
  }

  icono(t: Toast): string {
    const map: Record<string, string> = {
      success: 'check_circle',
      error:   'error',
      warning: 'warning_amber',
      info:    'info',
    };
    return map[t.tipo] ?? 'info';
  }
}
