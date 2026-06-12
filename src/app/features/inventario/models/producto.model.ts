// Modelo de Producto (basado en la entidad Java del backend)
export interface Producto {
  id?: number;
  nombre: string;
  precio: number;
  descripcion: string;
  estado: boolean;
}
