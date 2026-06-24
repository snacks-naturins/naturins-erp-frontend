export type TipoMerma =
  | 'VENCIMIENTO'
  | 'DANO_FISICO'
  | 'CONTAMINACION'
  | 'ROBO'
  | 'ERROR_CONTEO'
  | 'DEVOLUCION'
  | 'PROCESO';

export interface MermaResponse {
  id: string;
  loteId: string;
  codigoLote?: string | null;
  tipo: TipoMerma | string;
  cantidad: number;
  observacion?: string | null;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateMermaRequest {
  loteId: string;
  tipo: TipoMerma;
  cantidad: number;
  observacion?: string;
}
