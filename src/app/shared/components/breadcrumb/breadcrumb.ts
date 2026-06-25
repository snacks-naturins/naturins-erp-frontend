import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

export interface BreadcrumbItem {
  label: string;
  ruta?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  template: `
    <nav class="flex items-center gap-1.5 text-xs text-text-muted">
      @for (item of items(); track item.label; let last = $last) {
        @if (!last) {
          @if (item.ruta) {
            <a [routerLink]="item.ruta" class="hover:text-text-main transition-colors">{{ item.label }}</a>
          } @else {
            <span>{{ item.label }}</span>
          }
          <mat-icon class="text-[14px]! h-3.5! w-3.5!">chevron_right</mat-icon>
        } @else {
          <span class="font-medium text-text-main">{{ item.label }}</span>
        }
      }
    </nav>
  `,
})
export class BreadcrumbComponent {
  readonly items = input.required<BreadcrumbItem[]>();
}
