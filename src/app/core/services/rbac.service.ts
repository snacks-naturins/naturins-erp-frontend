import { Injectable, inject, signal } from '@angular/core';
import { PermisoService } from '../../features/seguridad/services/permiso.service';
import { RolModuloResponse } from '../../features/seguridad/models/modulo.model';

export type AccionRbac = 'ver' | 'crear' | 'editar' | 'eliminar';

@Injectable({ providedIn: 'root' })
export class RbacService {
  private readonly svcPermiso = inject(PermisoService);

  private readonly _permisos = signal<RolModuloResponse[]>([]);
  private readonly _cargado  = signal(false);
  private readonly _error    = signal(false);
  readonly cargado = this._cargado.asReadonly();
  readonly error   = this._error.asReadonly();

  cargar(): void {
    if (this._cargado()) return;
    this._error.set(false);
    this.svcPermiso.misPermisos().subscribe({
      next: (p) => {
        this._permisos.set(p);
        this._cargado.set(true);
        this._error.set(false);
      },
      error: () => {
        this._cargado.set(false);
        this._error.set(true);
      },
    });
  }

  recargar(): void {
    this._cargado.set(false);
    this._permisos.set([]);
    this._error.set(false);
    this.cargar();
  }

  limpiar(): void {
    this._permisos.set([]);
    this._cargado.set(false);
    this._error.set(false);
  }

  hasPermission(modulo: string, accion: AccionRbac): boolean {
    if (!this._cargado()) return true;
    if (this._permisos().length === 0 || this._error()) return false;
    const m = modulo.toLowerCase();
    const p = this._permisos().find(
      (x) => x.nombreModulo.toLowerCase().includes(m) || m.includes(x.nombreModulo.toLowerCase())
    );
    if (!p) return false;
    switch (accion) {
      case 'ver':      return p.puedeVer;
      case 'crear':    return p.puedeCrear;
      case 'editar':   return p.puedeEditar;
      case 'eliminar': return p.puedeEliminar;
    }
  }
}
