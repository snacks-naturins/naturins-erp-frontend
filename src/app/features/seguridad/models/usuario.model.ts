export type EstadoUsuario = 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';

export interface UsuarioResponse {
  id: string;
  personaId: string;
  nombreCompleto: string;
  numeroDocumento?: string;
  telefono?: string;
  correo?: string;
  username: string;
  rolId: string;
  nombreRol: string;
  departamentoId?: string;
  nombreDepartamento?: string;
  urlAvatar?: string;
  ultimoAcceso?: string;
  intentosFallidos?: number;
  estado: EstadoUsuario;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreatePersonaRequest {
  tipoDocumentoId: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  urlCv?: string;
}

export interface CreateUsuarioRequest {
  personaId: string;
  username: string;
  password: string;
  rolId: string;
  departamentoId?: string;
  urlAvatar?: string;
  estado: EstadoUsuario;
}

export interface UpdateUsuarioRequest {
  password: string;
  rolId: string;
  departamentoId?: string;
  urlAvatar?: string;
  estado: EstadoUsuario;
}
