export type EstadoProduccion = 'PLANIFICADA' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA';

export interface ProduccionResponse {
  id: string;
  numeroOrden: string;
  usuarioId?: string;
  nombreUsuario?: string;
  nombreCompleto?: string;
  fechaProduccion: string;
  costoTotal: number;
  observacion?: string | null;
  estado: EstadoProduccion | string;
  recetaId?: string | null;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateProduccionRequest {
  observacion?: string;
}

export interface UpdateProduccionRequest {
  estado?: EstadoProduccion;
  observacion?: string;
}

export interface CompletarProduccionRequest {
  almacenId: string;
  fechaVencimiento?: string | null;
}
