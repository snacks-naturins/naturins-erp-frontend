export type EstadoMetodoPago = 'ACTIVO' | 'INACTIVO';
export type TipoMetodoPago  = 'YAPE' | 'PLIN' | 'TRANSFERENCIA' | 'TARJETA' | 'EFECTIVO' | 'OTRO';

export interface MetodoPagoResponse {
  id: string;
  nombre: string;
  tipo: TipoMetodoPago | null;
  estado: EstadoMetodoPago | string;
  descripcion?: string | null;
  urlQr?: string | null;
  numeroCelular?: string | null;
  bancoNombre?: string | null;
  numeroCuenta?: string | null;
  cuentaInterbancaria?: string | null;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateMetodoPagoRequest {
  nombre: string;
  tipo?: TipoMetodoPago;
  estado?: EstadoMetodoPago;
  descripcion?: string;
  urlQr?: string;
  numeroCelular?: string;
  bancoNombre?: string;
  numeroCuenta?: string;
  cuentaInterbancaria?: string;
}

export interface UpdateMetodoPagoRequest {
  nombre?: string;
  tipo?: TipoMetodoPago;
  estado?: EstadoMetodoPago;
  descripcion?: string;
  urlQr?: string;
  numeroCelular?: string;
  bancoNombre?: string;
  numeroCuenta?: string;
  cuentaInterbancaria?: string;
}
