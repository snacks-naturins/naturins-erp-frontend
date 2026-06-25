export interface DetallePedidoResponse {
  id: string;
  pedidoId: string;
  presentacionProductoId: string;
  nombreProducto: string;
  nombrePresentacion: string;
  loteId: string;
  codigoLote: string;
  precioUnitario: number;
  cantidad: number;
  descuento?: number;
  subtotal: number;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateDetallePedidoRequest {
  pedidoId: string;
  presentacionProductoId: string;
  loteId: string;
  precioUnitario: number;
  cantidad: number;
  descuento?: number;
}

export interface UpdateDetallePedidoRequest {
  precioUnitario?: number;
  cantidad?: number;
  descuento?: number;
}
