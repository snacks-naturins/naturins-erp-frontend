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
  fechaCreacion?: string;
  fechaModificacion?: string;
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
}
