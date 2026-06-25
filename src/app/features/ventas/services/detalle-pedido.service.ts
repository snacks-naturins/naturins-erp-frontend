import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CreateDetallePedidoRequest, DetallePedidoResponse, UpdateDetallePedidoRequest } from '../models/detalle-pedido.model';

@Injectable({ providedIn: 'root' })
export class DetallePedidoService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/detalle-pedido`;

  crear(dto: CreateDetallePedidoRequest): Observable<DetallePedidoResponse> {
    return this.http.post<DetallePedidoResponse>(this.API_URL, dto);
  }

  porPedido(pedidoId: string): Observable<DetallePedidoResponse[]> {
    return this.http.get<DetallePedidoResponse[]>(`${this.API_URL}/por-pedido/${pedidoId}`);
  }

  actualizar(id: string, dto: UpdateDetallePedidoRequest): Observable<DetallePedidoResponse> {
    return this.http.put<DetallePedidoResponse>(`${this.API_URL}/${id}`, dto);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
