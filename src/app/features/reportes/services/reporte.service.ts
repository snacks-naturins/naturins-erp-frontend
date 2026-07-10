import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CuentaPorCobrar,
  LoteInventario,
  LoteProximoVencer,
  ProductoMasVendido,
  ResumenCompras,
  ResumenVentas,
} from '../models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/reportes`;

  lotesProximosAVencer(dias = 30): Observable<LoteProximoVencer[]> {
    return this.http.get<LoteProximoVencer[]>(`${this.base}/proximos-vencer?dias=${dias}`);
  }

  inventarioActual(): Observable<LoteInventario[]> {
    return this.http.get<LoteInventario[]>(`${this.base}/inventario`);
  }

  productosMasVendidos(desde: string, hasta: string, limite = 10): Observable<ProductoMasVendido[]> {
    return this.http.get<ProductoMasVendido[]>(
      `${this.base}/productos-mas-vendidos?desde=${desde}&hasta=${hasta}&limite=${limite}`
    );
  }

  cuentasPorCobrar(): Observable<CuentaPorCobrar[]> {
    return this.http.get<CuentaPorCobrar[]>(`${this.base}/cuentas-por-cobrar`);
  }

  resumenVentas(desde: string, hasta: string): Observable<ResumenVentas> {
    return this.http.get<ResumenVentas>(`${this.base}/ventas?desde=${desde}&hasta=${hasta}`);
  }

  resumenCompras(desde: string, hasta: string): Observable<ResumenCompras> {
    return this.http.get<ResumenCompras>(`${this.base}/compras?desde=${desde}&hasta=${hasta}`);
  }
}
