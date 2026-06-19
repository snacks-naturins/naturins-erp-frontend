export type EstadoLote =
  | 'DISPONIBLE'
  | 'EN_CUARENTENA'
  | 'BLOQUEADO'
  | 'VENCIDO'
  | 'AGOTADO'
  | 'AGOTADO_MERMA';

export interface LoteResponse {
  id: string;
  presentacionProductoId: string;
  nombreProducto: string;
  almacenId: string;
  nombreAlmacen: string;
  codigoLote: string;
  numeroLoteProveedor?: string | null;
  fechaFabricacion?: string | null;
  fechaIngreso?: string | null;
  fechaVencimiento?: string | null;
  stockLote: number;
  costoUnitario: number;
  estado: EstadoLote | string;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateLoteRequest {
  presentacionProductoId: string;
  almacenId: string;
  codigoLote: string;
  numeroLoteProveedor?: string | null;
  fechaFabricacion?: string | null;
  fechaIngreso?: string | null;
  fechaVencimiento?: string | null;
  stockLote: number;
  costoUnitario: number;
}

export type UpdateLoteRequest = CreateLoteRequest;
