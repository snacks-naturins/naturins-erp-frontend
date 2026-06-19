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
  fechaCreacion?: string;
  fechaModificacion?: string;
}

// POST /api/productos -> request
export interface CreateProductoRequest {
  categoriaId: string;
  nombre: string;
  descripcion?: string;
  urlImagen?: string;
  estado: EstadoProducto;
}

// PUT /api/productos/{id} -> request (mismos campos que crear)
export type UpdateProductoRequest = CreateProductoRequest;
