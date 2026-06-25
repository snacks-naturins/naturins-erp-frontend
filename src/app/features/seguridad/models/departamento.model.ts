export interface DepartamentoResponse {
  id: string;
  nombre: string;
  descripcion?: string;
  estado: string;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateDepartamentoRequest {
  nombre: string;
  descripcion?: string;
}

export interface UpdateDepartamentoRequest {
  nombre?: string;
  descripcion?: string;
  estado?: string;
}
