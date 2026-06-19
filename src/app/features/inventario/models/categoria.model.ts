export type EstadoCategoria = 'ACTIVA' | 'INACTIVA';

// GET /api/categorias -> respuesta
export interface CategoriaResponse {
  id: string;
  nombre: string;
  colorInterfaz?: string;
  estado?: string;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

// POST /api/categorias -> request
export interface CreateCategoriaRequest {
  nombre: string;
  colorInterfaz: string;
  estado: EstadoCategoria;
}
