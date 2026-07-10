export interface LoteProximoVencer {
  loteId: string;
  codigoLote: string;
  presentacionProductoId: string;
  nombrePresentacion: string;
  almacenId: string;
  nombreAlmacen: string;
  fechaVencimiento: string;
  diasRestantes: number;
  stockLote: number;
  estado: string;
}

export interface LoteInventario {
  loteId: string;
  codigoLote: string;
  presentacionProductoId: string;
  nombrePresentacion: string;
  almacenId: string;
  nombreAlmacen: string;
  stockLote: number;
  costoUnitario: number;
  valorTotal: number;
  fechaVencimiento: string;
  estado: string;
}

export interface ProductoMasVendido {
  presentacionProductoId: string;
  nombrePresentacion: string;
  cantidadTotalVendida: number;
  montoTotalVendido: number;
}

export interface CuentaPorCobrar {
  pedidoId: string;
  numeroPedido: string;
  clienteId: string;
  nombreCliente: string;
  total: number;
  estado: string;
  fechaCreacion: string;
}

export interface ResumenVentas {
  desde: string;
  hasta: string;
  cantidadPedidos: number;
  montoTotal: number;
  pedidosPagados: number;
  pedidosPendientesPago: number;
  detalle: ItemVenta[];
}

export interface ItemVenta {
  pedidoId: string;
  numeroPedido: string;
  nombreCliente: string;
  total: number;
  estado: string;
  estadoPago: string;
  fechaCreacion: string;
}

export interface ResumenCompras {
  desde: string;
  hasta: string;
  cantidadCompras: number;
  montoTotal: number;
  comprasCompletadas: number;
  detalle: ItemCompra[];
}

export interface ItemCompra {
  compraId: string;
  numeroOrden: string;
  nombreProveedor: string;
  total: number;
  estado: string;
  fechaCompra: string;
}
