export type EstadoAlmacen = 'ACTIVO' | 'INACTIVO';
export type TipoAlmacen = 'PRINCIPAL' | 'PRODUCCION' | 'DISTRIBUCION' | 'TIENDA';

export interface AlmacenResponse {
  id: string;
  codigo?: string | null;
  nombre: string;
  tipo?: TipoAlmacen | string | null;
  ubicacion: string;
  telefono?: string | null;
  capacidad?: number | null;
  estado: EstadoAlmacen | string;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateAlmacenRequest {
  codigo?: string;
  nombre: string;
  tipo: TipoAlmacen;
  ubicacion: string;
  telefono?: string;
  capacidad?: number | null;
  estado: EstadoAlmacen;
}

export type UpdateAlmacenRequest = CreateAlmacenRequest;
