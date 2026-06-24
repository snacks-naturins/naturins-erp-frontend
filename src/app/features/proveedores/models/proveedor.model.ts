export type EstadoProveedor = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'POTENCIAL';
export type EstadoCatalogoProveedor = 'ACTIVO' | 'INACTIVO';

export interface ProveedorResponse {
  id: string;
  personaId: string;
  nombreCompleto: string;
  ruc?: string | null;
  razonSocial?: string | null;
  contacto?: string | null;
  diasCredito?: number | null;
  rubro?: string | null;
  estado: EstadoProveedor | string;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateProveedorRequest {
  personaId: string;
  ruc?: string;
  razonSocial?: string;
  contacto?: string;
  diasCredito?: number | null;
  rubro?: string;
  estado: EstadoProveedor;
}

export interface UpdateProveedorRequest {
  ruc?: string;
  razonSocial?: string;
  contacto?: string;
  diasCredito?: number | null;
  rubro?: string;
  estado: EstadoProveedor;
}

// ── Catálogo del proveedor (ProveedorProducto) ─────────────────────────────

export interface ProveedorProductoResponse {
  id: string;
  proveedorId: string;
  materiaPrimaId: string;
  nombreMateriaPrima: string;
  unidadMedida: string;
  precioCompra?: number | null;
  tiempoEntregaDias?: number | null;
  cantidadMinimaCompra?: number | null;
  esPrincipal: boolean;
  observacion?: string | null;
  imagenUrl?: string | null;
  estado: EstadoCatalogoProveedor | string;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateProveedorProductoRequest {
  materiaPrimaId: string;
  precioCompra?: number | null;
  tiempoEntregaDias?: number | null;
  cantidadMinimaCompra?: number | null;
  esPrincipal: boolean;
  observacion?: string;
  imagenUrl?: string;
  estado: EstadoCatalogoProveedor;
  motivoPrecio?: string;
}

export interface UpdateProveedorProductoRequest {
  precioCompra?: number | null;
  tiempoEntregaDias?: number | null;
  cantidadMinimaCompra?: number | null;
  esPrincipal?: boolean;
  observacion?: string;
  imagenUrl?: string | null;
  estado?: EstadoCatalogoProveedor;
  motivoCambioPrecio?: string;
}
