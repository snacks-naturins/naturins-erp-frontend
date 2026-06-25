export type CanalPedido = 'PRESENCIAL' | 'TELEFONO' | 'WHATSAPP' | 'ECOMMERCE' | 'EMAIL' | 'MARKETPLACE';
export type PrioridadPedido = 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE';
export type TipoEntregaPedido = 'DELIVERY' | 'RECOJO_TIENDA' | 'AGENCIA';
export type EstadoPedido = 'NUEVO' | 'CONFIRMADO' | 'EN_PREPARACION' | 'LISTO_DESPACHO' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO' | 'DEVUELTO';
export type EstadoPagoPedido = 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | 'REEMBOLSADO' | 'VENCIDO';

export interface PedidoResponse {
  id: string;
  numeroPedido: string;
  clienteId: string;
  nombreCliente: string;
  usuarioVendedorId?: string;
  nombreUsuarioVendedor?: string;
  metodoPagoId: string;
  metodoPagoNombre: string;
  canal: string;
  prioridad: string;
  tipoEntrega: string;
  costoEnvio: number;
  direccionEntrega?: string;
  descuento?: number;
  subTotal: number;
  igv: number;
  total: number;
  estado: string;
  estadoPago: string;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreatePedidoRequest {
  clienteId: string;
  metodoPagoId: string;
  canal: CanalPedido;
  prioridad: PrioridadPedido;
  tipoEntrega: TipoEntregaPedido;
  costoEnvio: number;
  descuento?: number;
  direccionEntrega?: string;
  cotizacionId?: string;
}

export interface UpdatePedidoRequest {
  metodoPagoId?: string;
  canal?: CanalPedido;
  prioridad?: PrioridadPedido;
  tipoEntrega?: TipoEntregaPedido;
  costoEnvio?: number;
  descuento?: number;
  direccionEntrega?: string;
}
