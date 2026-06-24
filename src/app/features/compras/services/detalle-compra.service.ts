import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CreateDetalleCompraRequest,
  DetalleCompraResponse,
  UpdateDetalleCompraRequest,
} from '../models/detalle-compra.model';

@Injectable({ providedIn: 'root' })
export class DetalleCompraService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/detalle-compra`;

  porCompra(compraId: string): Observable<DetalleCompraResponse[]> {
    return this.http.get<DetalleCompraResponse[]>(`${this.API_URL}/por-compra/${compraId}`);
  }

  crear(dto: CreateDetalleCompraRequest): Observable<DetalleCompraResponse> {
    return this.http.post<DetalleCompraResponse>(this.API_URL, dto);
  }

  actualizar(id: string, dto: UpdateDetalleCompraRequest): Observable<DetalleCompraResponse> {
    return this.http.put<DetalleCompraResponse>(`${this.API_URL}/${id}`, dto);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
