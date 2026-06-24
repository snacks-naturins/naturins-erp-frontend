export interface DetalleProduccionResponse {
  id: string;
  produccionId: string;
  presentacionProductoId?: string | null;
  nombrePresentacionProducto?: string | null;
  materiaPrimaId?: string | null;
  nombreMateriaPrima?: string | null;
  cantidadProducida: number;
  costoUnitario?: number | null;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateDetalleProduccionRequest {
  produccionId: string;
  presentacionProductoId: string;
  cantidadProducida: number;
}

export interface UpdateDetalleProduccionRequest {
  presentacionProductoId?: string;
  cantidadProducida?: number;
}
