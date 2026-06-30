export type TipoCupon = 'PORCENTAJE' | 'MONTO_FIJO' | 'ENVIO_GRATIS';
export type EstadoCupon = 'ACTIVO' | 'INACTIVO' | 'VENCIDO';

export interface CuponResponse {
  id: string;
  codigo: string;
  tipo: TipoCupon;
  valor: number;
  fechaInicio: string;
  fechaFin: string;
  usosMaximos?: number;
  usosActuales: number;
  montoMinimo?: number;
  estado: EstadoCupon;
}

export interface CreateCuponRequest {
  codigo: string;
  tipo: TipoCupon;
  valor: number;
  fechaInicio: string;
  fechaFin: string;
  usosMaximos?: number;
  montoMinimo?: number;
}

export interface UpdateCuponRequest {
  tipo?: TipoCupon;
  valor?: number;
  fechaInicio?: string;
  fechaFin?: string;
  usosMaximos?: number;
  montoMinimo?: number;
  estado?: EstadoCupon;
}
