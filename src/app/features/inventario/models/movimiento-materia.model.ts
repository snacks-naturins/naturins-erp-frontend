export type TipoMovimientoMateria =
  | 'ENTRADA'
  | 'SALIDA_PRODUCCION'
  | 'AJUSTE_POSITIVO'
  | 'AJUSTE_NEGATIVO'
  | 'DEVOLUCION';

export interface MovimientoMateriaResponse {
  id: string;
  materiaPrimaId: string;
  nombreMateriaPrima: string;
  usuarioId: string;
  nombreUsuario: string;
  tipo: TipoMovimientoMateria;
  cantidad: number;
  stockResultante?: number | null;
  referenciaId?: string | null;
  tipoReferencia?: string | null;
  observacion?: string | null;
  fechaCreacion: string;
  fechaModificacion?: string;
}

export interface CreateMovimientoMateriaRequest {
  materiaPrimaId: string;
  tipo: TipoMovimientoMateria;
  cantidad: number;
  observacion?: string;
}
