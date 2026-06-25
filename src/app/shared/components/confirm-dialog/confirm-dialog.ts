import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatIconModule],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-150">
        <div class="w-full max-w-sm rounded-modal bg-white p-6 shadow-2xl">
          <div class="flex items-start gap-3 mb-4">
            <div class="grid h-10 w-10 shrink-0 place-items-center rounded-full"
              [class]="danger() ? 'bg-red-100' : 'bg-amber-100'">
              <mat-icon [class]="danger() ? 'text-red-600' : 'text-amber-600'">{{ icono() }}</mat-icon>
            </div>
            <div>
              <p class="font-semibold text-text-main leading-tight">{{ titulo() }}</p>
              @if (subtitulo()) {
                <p class="text-sm text-text-muted mt-0.5">{{ subtitulo() }}</p>
              }
            </div>
          </div>
          @if (mensaje()) {
            <p class="text-sm text-text-muted mb-5">{{ mensaje() }}</p>
          }
          <div class="flex gap-3">
            <button
              (click)="cancelar.emit()"
              class="flex-1 rounded-btn border border-border-soft bg-white px-4 py-2 text-sm font-medium text-text-muted transition hover:bg-bg-app">
              Cancelar
            </button>
            <button
              (click)="confirmar.emit()"
              class="flex-1 rounded-btn px-4 py-2 text-sm font-semibold text-white transition"
              [class]="danger()
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-primary hover:bg-primary-hover'">
              {{ labelConfirmar() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialog {
  readonly open           = input(false);
  readonly titulo         = input('¿Confirmar acción?');
  readonly subtitulo      = input('');
  readonly mensaje        = input('Esta acción no se puede deshacer.');
  readonly icono          = input('warning');
  readonly labelConfirmar = input('Confirmar');
  readonly danger         = input(true);

  readonly confirmar = output<void>();
  readonly cancelar  = output<void>();
}
