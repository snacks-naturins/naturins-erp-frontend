import { Injectable, inject, signal } from '@angular/core';
import { PermisoService } from '../../features/seguridad/services/permiso.service';
import { RolModuloResponse } from '../../features/seguridad/models/modulo.model';

export type AccionRbac = 'ver' | 'crear' | 'editar' | 'eliminar';

const CACHE_KEY = 'naturins_permisos';

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

    const cached = this.cargarCache();
    if (cached) {
      this._permisos.set(cached);
      this._cargado.set(true);
      this._error.set(false);
    }

    this._error.set(false);
    this.svcPermiso.misPermisos().subscribe({
      next: (p) => {
        this._permisos.set(p);
        this._cargado.set(true);
        this._error.set(false);
        this.guardarCache(p);
      },
      error: () => {
        if (!cached) {
          this._cargado.set(true);
        }
        this._error.set(false);
        console.warn('RBAC: no se pudieron refrescar los permisos desde el servidor');
      },
    });
  }

  recargar(): void {
    this._cargado.set(false);
    this._permisos.set([]);
    this._error.set(false);
    localStorage.removeItem(CACHE_KEY);
    this.cargar();
  }

  limpiar(): void {
    this._permisos.set([]);
    this._cargado.set(false);
    this._error.set(false);
    localStorage.removeItem(CACHE_KEY);
  }

  hasPermission(modulo: string, accion: AccionRbac): boolean {
    if (!this._cargado()) return false;
    if (this._permisos().length === 0) return true;
    const m = modulo.toLowerCase().trim();
    const p = this._permisos().find(
      (x) => x.nombreModulo.toLowerCase().trim() === m
    );
    if (!p) return true;
    switch (accion) {
      case 'ver':      return p.puedeVer;
      case 'crear':    return p.puedeCrear;
      case 'editar':   return p.puedeEditar;
      case 'eliminar': return p.puedeEliminar;
    }
  }

  permisos(): RolModuloResponse[] {
    return this._permisos();
  }

  private guardarCache(permisos: RolModuloResponse[]): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(permisos));
    } catch {
    }
  }

  private cargarCache(): RolModuloResponse[] | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? (JSON.parse(raw) as RolModuloResponse[]) : null;
    } catch {
      return null;
    }
  }
}
