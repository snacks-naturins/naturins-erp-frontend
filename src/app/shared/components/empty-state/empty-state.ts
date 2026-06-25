import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="flex flex-col items-center justify-center py-16 text-center">
      <div class="grid h-16 w-16 place-items-center rounded-2xl mb-4"
        style="background:color-mix(in srgb,var(--color-primary,#16a34a) 8%,white)">
        <mat-icon class="text-[2rem]! h-8! w-8!" style="color:var(--color-primary,#16a34a);opacity:.5">
          {{ icono() }}
        </mat-icon>
      </div>
      <p class="font-semibold text-text-main text-base">{{ titulo() }}</p>
      @if (descripcion()) {
        <p class="mt-1 text-sm text-text-muted max-w-xs">{{ descripcion() }}</p>
      }
      @if (labelCta()) {
        <button
          (click)="cta.emit()"
          class="mt-5 flex items-center gap-2 rounded-btn px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition"
          style="background:var(--color-primary,#16a34a)">
          <mat-icon class="text-[18px]!">add</mat-icon>
          {{ labelCta() }}
        </button>
      }
    </div>
  `,
})
export class EmptyState {
  readonly icono       = input('inbox');
  readonly titulo      = input('Sin resultados');
  readonly descripcion = input('');
  readonly labelCta    = input('');

  readonly cta = output<void>();
}
