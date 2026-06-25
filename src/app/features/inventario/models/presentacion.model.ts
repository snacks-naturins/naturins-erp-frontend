export type EstadoPresentacion = 'ACTIVO' | 'INACTIVO' | 'DESCONTINUADO' | 'PROXIMAMENTE';

export interface PresentacionResponse {
  id: string;
  productoId: string;
  nombreProducto: string;
  nombre: string;
  factorConversion: number;
  precioVenta: number;
  peso?: number | null;
  unidadMedida?: string | null;
  estado: EstadoPresentacion | string;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreatePresentacionRequest {
  productoId: string;
  nombre: string;
  factorConversion: number;
  precioVenta: number;
  peso?: number | null;
  unidadMedida?: string | null;
  estado: EstadoPresentacion;
}

// El update no incluye productoId (no se cambia el producto)
export interface UpdatePresentacionRequest {
  nombre: string;
  factorConversion: number;
  precioVenta: number;
  peso?: number | null;
  unidadMedida?: string | null;
  estado: EstadoPresentacion;
}
