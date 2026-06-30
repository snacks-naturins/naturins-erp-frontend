export type TipoDescuento = 'PORCENTAJE' | 'PRECIO_FIJO';
export type EstadoDescuento = 'PROGRAMADO' | 'ACTIVO' | 'VENCIDO';

export interface DescuentoResponse {
  id: string;
  nombre: string;
  presentacionId: string;
  presentacionNombre: string;
  productoId: string;
  productoNombre: string;
  tipo: TipoDescuento;
  valor: number;
  precioOriginal: number;
  precioFinal: number;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoDescuento;
}

export interface CreateDescuentoRequest {
  nombre: string;
  presentacionId: string;
  tipo: TipoDescuento;
  valor: number;
  fechaInicio: string;
  fechaFin: string;
}
