export type EstadoCotizacion =
  | 'BORRADOR' | 'ENVIADA' | 'ACEPTADA' | 'RECHAZADA' | 'VENCIDA' | 'CONVERTIDA';

export interface CotizacionResponse {
  id: string;
  numeroCotizacion: string;
  clienteId: string;
  nombreCliente: string;
  usuarioId?: string;
  nombreUsuario?: string;
  incluyeIgv: boolean;
  descuento?: number | null;
  subTotal: number;
  igv: number;
  total: number;
  estado: EstadoCotizacion | string;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateCotizacionRequest {
  clienteId: string;
  incluyeIgv: boolean;
  descuento?: number | null;
  fechaVencimiento?: string | null;
  observacion?: string | null;
}

export interface UpdateCotizacionRequest {
  incluyeIgv?: boolean;
  descuento?: number | null;
  fechaVencimiento?: string | null;
  observacion?: string | null;
}
