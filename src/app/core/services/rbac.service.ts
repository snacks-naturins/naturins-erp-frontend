import { Injectable, inject, signal } from '@angular/core';
import { PermisoService } from '../../features/seguridad/services/permiso.service';
import { RolModuloResponse } from '../../features/seguridad/models/modulo.model';

export type AccionRbac = 'ver' | 'crear' | 'editar' | 'eliminar';

@Injectable({ providedIn: 'root' })
export class RbacService {
  private readonly svcPermiso = inject(PermisoService);

  private readonly _permisos = signal<RolModuloResponse[]>([]);
  private readonly _cargado  = signal(false);
  readonly cargado = this._cargado.asReadonly();

  cargar(): void {
    if (this._cargado()) return;
    this.svcPermiso.misPermisos().subscribe({
      next: (p) => { this._permisos.set(p); this._cargado.set(true); },
      error: () => this._cargado.set(true),
    });
  }

  limpiar(): void {
    this._permisos.set([]);
    this._cargado.set(false);
  }

  hasPermission(modulo: string, accion: AccionRbac): boolean {
    if (!this._cargado()) return true;
    const permisos = this._permisos();
    if (permisos.length === 0) return true;
    const m = modulo.toLowerCase();
    const p = permisos.find((x) => x.nombreModulo.toLowerCase().includes(m) || m.includes(x.nombreModulo.toLowerCase()));
    if (!p) return true;
    switch (accion) {
      case 'ver':      return p.puedeVer;
      case 'crear':    return p.puedeCrear;
      case 'editar':   return p.puedeEditar;
      case 'eliminar': return p.puedeEliminar;
    }
  }
}
