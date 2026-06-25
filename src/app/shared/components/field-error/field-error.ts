import { Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-field-error',
  standalone: true,
  template: `
    @if (control() && control()!.invalid && (control()!.dirty || control()!.touched)) {
      @if (control()!.errors?.['required']) {
        <p class="mt-1 text-xs text-red-500">Este campo es obligatorio.</p>
      }
      @if (control()!.errors?.['minlength']) {
        <p class="mt-1 text-xs text-red-500">
          Mínimo {{ control()!.errors?.['minlength']?.requiredLength }} caracteres.
        </p>
      }
      @if (control()!.errors?.['maxlength']) {
        <p class="mt-1 text-xs text-red-500">
          Máximo {{ control()!.errors?.['maxlength']?.requiredLength }} caracteres.
        </p>
      }
      @if (control()!.errors?.['email']) {
        <p class="mt-1 text-xs text-red-500">Ingresa un correo válido.</p>
      }
      @if (control()!.errors?.['min']) {
        <p class="mt-1 text-xs text-red-500">
          El valor mínimo es {{ control()!.errors?.['min']?.min }}.
        </p>
      }
      @if (control()!.errors?.['max']) {
        <p class="mt-1 text-xs text-red-500">
          El valor máximo es {{ control()!.errors?.['max']?.max }}.
        </p>
      }
      @if (control()!.errors?.['pattern']) {
        <p class="mt-1 text-xs text-red-500">El formato no es válido.</p>
      }
    }
  `,
})
export class FieldError {
  readonly control = input<AbstractControl | null>(null);
}
