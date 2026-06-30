// Estado del producto (enum EstadoProducto del backend)
export type EstadoProducto = 'ACTIVO' | 'INACTIVO' | 'DESCONTINUADO';

// GET /api/productos -> respuesta
export interface ProductoResponse {
  id: string;
  categoriaId: string;
  nombreCategoria: string;
  nombre: string;
  descripcion?: string | null;
  urlImagen?: string | null;
  estado: EstadoProducto | string;
  precioCompra?: number | null;
  stockMinimo?: number | null;
  stockCritico?: number | null;
  visibleEcommerce?: boolean | null;
  fechaCreacion?: string;
  fechaModificacion?: string;
  // Info nutricional
  ingredientes?: string | null;
  pesoNeto?: string | null;
  porcionRecomendada?: string | null;
  caloriasXPorcion?: number | null;
  proteinasXPorcion?: number | null;
  carbohidratosXPorcion?: number | null;
  grasasXPorcion?: number | null;
  fibrasXPorcion?: number | null;
  alergenos?: string | null;
  certificaciones?: string | null;
  imagenesAdicionales?: string[];
}

// POST /api/productos -> request
export interface CreateProductoRequest {
  categoriaId: string;
  nombre: string;
  descripcion?: string;
  urlImagen?: string;
  precioCompra?: number | null;
  stockMinimo?: number | null;
  stockCritico?: number | null;
  estado: EstadoProducto;
  visibleEcommerce?: boolean;
}

// PUT /api/productos/{id} -> request
export interface UpdateProductoRequest {
  categoriaId?: string;
  nombre?: string;
  descripcion?: string;
  urlImagen?: string;
  precioCompra?: number | null;
  stockMinimo?: number | null;
  stockCritico?: number | null;
  estado?: EstadoProducto;
  visibleEcommerce?: boolean;
  // Info nutricional
  ingredientes?: string | null;
  pesoNeto?: string | null;
  porcionRecomendada?: string | null;
  caloriasXPorcion?: number | null;
  proteinasXPorcion?: number | null;
  carbohidratosXPorcion?: number | null;
  grasasXPorcion?: number | null;
  fibrasXPorcion?: number | null;
  alergenos?: string | null;
  certificaciones?: string | null;
  imagenesAdicionales?: string[];
}
