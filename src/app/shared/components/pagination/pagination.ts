import { Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [MatIconModule],
  template: `
    @if (totalPaginas() > 1) {
      <div class="flex items-center justify-between gap-4 px-1 py-2">
        <span class="text-xs text-text-muted">
          Página <strong>{{ pagina() }}</strong> de <strong>{{ totalPaginas() }}</strong>
          &nbsp;·&nbsp; {{ total() }} registros
        </span>
        <div class="flex items-center gap-1">
          <!-- Anterior -->
          <button
            (click)="cambio.emit(pagina() - 1)"
            [disabled]="pagina() <= 1"
            class="grid h-8 w-8 place-items-center rounded-md border border-border-soft text-text-muted transition hover:bg-bg-app disabled:opacity-40 disabled:cursor-not-allowed">
            <mat-icon class="text-[16px]!">chevron_left</mat-icon>
          </button>

          <!-- Páginas -->
          @for (p of paginas(); track p) {
            <button
              (click)="cambio.emit(p)"
              class="grid h-8 min-w-8 place-items-center rounded-md border text-xs font-medium transition"
              [class]="p === pagina()
                ? 'border-primary bg-primary text-white'
                : 'border-border-soft bg-white text-text-muted hover:bg-bg-app'">
              {{ p }}
            </button>
          }

          <!-- Siguiente -->
          <button
            (click)="cambio.emit(pagina() + 1)"
            [disabled]="pagina() >= totalPaginas()"
            class="grid h-8 w-8 place-items-center rounded-md border border-border-soft text-text-muted transition hover:bg-bg-app disabled:opacity-40 disabled:cursor-not-allowed">
            <mat-icon class="text-[16px]!">chevron_right</mat-icon>
          </button>
        </div>
      </div>
    }
  `,
})
export class PaginationComponent {
  readonly total     = input(0);
  readonly pagina    = input(1);
  readonly porPagina = input(20);
  readonly cambio    = output<number>();

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.porPagina())),
  );

  readonly paginas = computed(() => {
    const rango  = 2;
    const inicio = Math.max(1, this.pagina() - rango);
    const fin    = Math.min(this.totalPaginas(), this.pagina() + rango);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  });
}
