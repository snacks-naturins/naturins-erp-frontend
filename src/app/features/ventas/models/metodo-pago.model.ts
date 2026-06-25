export interface MetodoPagoResponse {
  id: string;
  nombre: string;
  estado: string;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateMetodoPagoRequest {
  nombre: string;
}

export interface UpdateMetodoPagoRequest {
  nombre?: string;
  estado?: string;
}
