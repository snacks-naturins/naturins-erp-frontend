export interface ModuloResponse {
  id: string;
  nombre: string;
  descripcion?: string;
  ruta?: string;
  icono?: string;
  orden?: number;
}

export interface RolModuloResponse {
  id: string;
  rolId: string;
  nombreRol: string;
  moduloId: string;
  nombreModulo: string;
  puedeVer: boolean;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
}

export interface BulkActualizarPermisosRequest {
  items: PermisoModuloItem[];
}

export interface PermisoModuloItem {
  moduloId: string;
  puedeVer: boolean;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
}

export interface MatrizRow extends PermisoModuloItem {
  nombre: string;
  icono: string;
}
