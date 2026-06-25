export interface DetalleCotizacionResponse {
  id: string;
  cotizacionId: string;
  presentacionProductoId: string;
  nombrePresentacionProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateDetalleCotizacionRequest {
  cotizacionId: string;
  presentacionProductoId: string;
  cantidad: number;
  precioUnitario: number;
}

export interface UpdateDetalleCotizacionRequest {
  cantidad: number;
  precioUnitario: number;
}
