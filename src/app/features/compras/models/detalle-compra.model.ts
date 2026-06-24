export interface DetalleCompraResponse {
  id: string;
  compraId: string;
  presentacionProductoId?: string | null;
  nombrePresentacionProducto?: string | null;
  loteId?: string | null;
  codigoLote?: string | null;
  materiaPrimaId?: string | null;
  nombreMateriaPrima?: string | null;
  cantidad: number;
  precioCompra: number;
  subTotal: number;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateDetalleCompraRequest {
  compraId: string;
  materiaPrimaId: string;
  cantidad: number;
  precioCompra: number;
}

export interface UpdateDetalleCompraRequest {
  cantidad?: number;
  precioCompra?: number;
}
