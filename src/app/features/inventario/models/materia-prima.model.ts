export type EstadoMateriaPrima = 'ACTIVO' | 'INACTIVO';

export interface MateriaPrimaResponse {
  id: string;
  nombre: string;
  unidadMedida: string;
  stock: number;
  costoUnitario: number;
  estado: EstadoMateriaPrima | string;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateMateriaPrimaRequest {
  nombre: string;
  unidadMedida: string;
  stock: number;
  costoUnitario: number;
  estado: EstadoMateriaPrima;
}

export interface UpdateMateriaPrimaRequest {
  unidadMedida?: string;
  costoUnitario?: number;
  estado?: EstadoMateriaPrima;
}
