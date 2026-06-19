export type TipoMovimientoInventario =
  | 'ENTRADA'
  | 'SALIDA'
  | 'AJUSTE_POSITIVO'
  | 'AJUSTE_NEGATIVO'
  | 'TRANSFERENCIA_ENTRADA'
  | 'TRANSFERENCIA_SALIDA';

export type TipoReferencia =
  | 'PEDIDO'
  | 'COMPRA'
  | 'PRODUCCION'
  | 'MERMA'
  | 'TRANSFERENCIA'
  | 'AJUSTE_MANUAL'
  | 'DEVOLUCION';

export interface MovimientoInventarioResponse {
  id: string;
  loteId: string;
  codigoLote: string;
  tipoMovimiento: TipoMovimientoInventario | string;
  cantidad: number;
  stockResultante?: number | null;
  costoUnitario?: number | null;
  tipoReferencia?: TipoReferencia | string | null;
  referenciaId?: string | null;
  observacion?: string | null;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateMovimientoInventarioRequest {
  loteId: string;
  tipoMovimiento: TipoMovimientoInventario;
  cantidad: number;
  costoUnitario?: number | null;
  tipoReferencia?: TipoReferencia | null;
  referenciaId?: string | null;
  observacion?: string | null;
}
