export type EstadoMateriaPrima = 'ACTIVO' | 'INACTIVO' | 'AGOTADO';

export interface MateriaPrimaResponse {
  id: string;
  nombre: string;
  unidadMedida: string;
  stock: number;
  stockMinimo?: number | null;
  stockCritico?: number | null;
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
  stockMinimo?: number | null;
  stockCritico?: number | null;
}

export interface UpdateMateriaPrimaRequest {
  unidadMedida?: string;
  costoUnitario?: number;
  estado?: EstadoMateriaPrima;
  stockMinimo?: number | null;
  stockCritico?: number | null;
}
