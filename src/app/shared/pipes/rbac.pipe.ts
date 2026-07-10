import { Pipe, PipeTransform, inject } from '@angular/core';
import { AccionRbac, RbacService } from '../../core/services/rbac.service';

@Pipe({ name: 'rbac', standalone: true, pure: false })
export class RbacPipe implements PipeTransform {
  private readonly rbac = inject(RbacService);

  transform(modulo: string, accion: AccionRbac = 'ver'): boolean {
    return this.rbac.hasPermission(modulo, accion);
  }
}
