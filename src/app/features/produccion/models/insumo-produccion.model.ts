export interface InsumoProduccionResponse {
  id: string;
  produccionId: string;
  materiaPrimaId: string;
  nombreMateriaPrima: string;
  cantidadUsada: number;
  costoUnitario: number;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateInsumoProduccionRequest {
  produccionId: string;
  materiaPrimaId: string;
  cantidadUsada: number;
  costoUnitario?: number;
}

export interface UpdateInsumoProduccionRequest {
  cantidadUsada?: number;
  costoUnitario?: number;
}
