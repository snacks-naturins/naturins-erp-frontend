export type EstadoPersona = 'ACTIVO' | 'INACTIVO';

export interface PersonaResponse {
  id: string;
  tipoDocumentoId: string;
  tipoDocumentoNombre: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  direccion?: string | null;
  telefono?: string | null;
  correo?: string | null;
  estado: EstadoPersona | string;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreatePersonaRequest {
  tipoDocumentoId: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  estado: EstadoPersona;
}

export interface UpdatePersonaRequest {
  nombres: string;
  apellidos: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
}
