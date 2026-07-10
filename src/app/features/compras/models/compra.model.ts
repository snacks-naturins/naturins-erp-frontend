export type EstadoCompra = 'PENDIENTE' | 'RECIBIDA_PARCIAL' | 'COMPLETADA' | 'CANCELADA';

export interface CompraResponse {
  id: string;
  numeroOrden: string;
  proveedorId: string;
  nombreProveedor: string;
  usuarioId: string;
  nombreUsuario: string;
  fechaCompra: string;
  estado: EstadoCompra | string;
  subtotal: number;
  igv: number;
  total: number;
  observacion?: string | null;
  fechaEntregaEsperada?: string | null;
  nroFacturaProveedor?: string | null;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateCompraRequest {
  proveedorId: string;
  observacion?: string;
}

export interface UpdateCompraRequest {
  estado?: EstadoCompra;
  observacion?: string;
  fechaEntregaEsperada?: string | null;
  nroFacturaProveedor?: string | null;
}
