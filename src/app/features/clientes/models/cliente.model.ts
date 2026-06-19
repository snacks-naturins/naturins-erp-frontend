export type TipoCliente = 'PERSONA' | 'EMPRESA';
export type EstadoCliente = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'POTENCIAL';

export interface ClienteResponse {
  id: string;
  personaId: string;
  nombreCompleto: string;
  tipoCliente?: TipoCliente | string | null;
  razonSocial?: string | null;
  ruc?: string | null;
  aplicaIgv: boolean;
  limiteCredito?: number | null;
  descuentoPreferencial?: number | null;
  estado: EstadoCliente | string;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateClienteRequest {
  personaId: string;
  tipoCliente: TipoCliente;
  razonSocial?: string;
  ruc?: string;
  aplicaIgv: boolean;
  limiteCredito?: number | null;
  descuentoPreferencial?: number | null;
  estado: EstadoCliente;
}

// El update no incluye personaId (la persona no se cambia desde aquí)
export interface UpdateClienteRequest {
  tipoCliente: TipoCliente;
  razonSocial?: string;
  ruc?: string;
  aplicaIgv: boolean;
  limiteCredito?: number | null;
  descuentoPreferencial?: number | null;
  estado: EstadoCliente;
}
