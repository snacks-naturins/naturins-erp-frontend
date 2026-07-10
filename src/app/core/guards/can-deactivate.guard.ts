import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';

export interface CanComponentDeactivate {
  canDeactivate: () => boolean;
}

export const canDeactivateGuard: CanDeactivateFn<CanComponentDeactivate> = (
  component
) => {
  if (component.canDeactivate?.()) return true;
  return window.confirm(
    'Tienes cambios sin guardar. ¿Estás seguro de que deseas salir?'
  );
};
