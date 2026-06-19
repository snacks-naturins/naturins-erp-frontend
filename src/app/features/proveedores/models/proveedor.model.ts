export type EstadoProveedor = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'POTENCIAL';

export interface ProveedorResponse {
  id: string;
  personaId: string;
  nombreCompleto: string;
  ruc?: string | null;
  razonSocial?: string | null;
  contacto?: string | null;
  diasCredito?: number | null;
  rubro?: string | null;
  estado: EstadoProveedor | string;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateProveedorRequest {
  personaId: string;
  ruc?: string;
  razonSocial?: string;
  contacto?: string;
  diasCredito?: number | null;
  rubro?: string;
  estado: EstadoProveedor;
}

export interface UpdateProveedorRequest {
  ruc?: string;
  razonSocial?: string;
  contacto?: string;
  diasCredito?: number | null;
  rubro?: string;
  estado: EstadoProveedor;
}
