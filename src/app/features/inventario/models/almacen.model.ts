export type EstadoAlmacen = 'ACTIVO' | 'INACTIVO';
export type TipoAlmacen = 'PRINCIPAL' | 'PRODUCCION' | 'DISTRIBUCION' | 'TIENDA';

export interface AlmacenResponse {
  id: string;
  codigo?: string | null;
  nombre: string;
  tipo?: TipoAlmacen | string | null;
  ubicacion: string;
  telefono?: string | null;
  capacidadKg?: number | null;
  responsableId?: string | null;
  estado: EstadoAlmacen | string;
  stockOcupadoKg?: number | null;
  porcentajeUso?: number | null;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateAlmacenRequest {
  codigo?: string;
  nombre: string;
  tipo: TipoAlmacen;
  ubicacion: string;
  telefono?: string;
  capacidadKg?: number | null;
  responsableId?: string;
  estado: EstadoAlmacen;
}

export type UpdateAlmacenRequest = Partial<CreateAlmacenRequest>;

export type ZonaEstado = 'libre' | 'ocupado' | 'lleno';
export interface Zona { id: string; estado: ZonaEstado; }
