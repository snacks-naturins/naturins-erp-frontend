export interface RolResponse {
  id: string;
  nombre: string;
  descripcion: string;
  estado: string;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateRolRequest {
  nombre: string;
  descripcion: string;
}

export interface UpdateRolRequest {
  nombre?: string;
  descripcion?: string;
  estado?: string;
}
