export type EstadoReceta = 'ACTIVA' | 'INACTIVA' | 'ARCHIVADA';

export interface RecetaIngredienteResponse {
  id: string;
  materiaPrimaId: string;
  nombreMateriaPrima: string;
  unidadMedida: string;
  cantidadPorLote: number;
  stockActual: number;
}

export interface RecetaResponse {
  id: string;
  nombre: string;
  descripcion?: string | null;
  presentacionId: string;
  nombrePresentacion: string;
  nombreProducto: string;
  rendimientoPorLote: number;
  estado: EstadoReceta | string;
  ingredientes: RecetaIngredienteResponse[];
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateRecetaIngredienteRequest {
  materiaPrimaId: string;
  cantidadPorLote: number;
}

export interface CreateRecetaRequest {
  nombre: string;
  descripcion?: string;
  presentacionId: string;
  rendimientoPorLote: number;
  ingredientes: CreateRecetaIngredienteRequest[];
}

export interface UpdateRecetaRequest {
  nombre?: string;
  descripcion?: string;
  rendimientoPorLote?: number;
  estado?: EstadoReceta;
  ingredientes?: CreateRecetaIngredienteRequest[];
}

export interface CalcularRecetaRequest {
  lotesAProducir: number;
}

export interface InsumoCalculadoItem {
  materiaPrimaId: string;
  nombreMateriaPrima: string;
  unidadMedida: string;
  cantidadNecesaria: number;
  stockActual: number;
  suficiente: boolean;
}

export interface RecetaCalculoResponse {
  recetaId: string;
  nombreReceta: string;
  presentacionId: string;
  nombrePresentacion: string;
  lotesAProducir: number;
  unidadesEsperadas: number;
  insumos: InsumoCalculadoItem[];
  stockSuficiente: boolean;
}

export interface CrearProduccionDesdeRecetaRequest {
  lotesAProducir: number;
  observacion?: string;
}
