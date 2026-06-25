import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CreatePedidoRequest, PedidoResponse, UpdatePedidoRequest } from '../models/pedido.model';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/pedidos`;

  listar(): Observable<PedidoResponse[]> {
    return this.http.get<PedidoResponse[]>(this.API_URL);
  }

  buscarPorId(id: string): Observable<PedidoResponse> {
    return this.http.get<PedidoResponse>(`${this.API_URL}/${id}`);
  }

  crear(dto: CreatePedidoRequest): Observable<PedidoResponse> {
    return this.http.post<PedidoResponse>(this.API_URL, dto);
  }

  actualizar(id: string, dto: UpdatePedidoRequest): Observable<PedidoResponse> {
    return this.http.put<PedidoResponse>(`${this.API_URL}/${id}`, dto);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  confirmar(id: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/${id}/confirmar`, {});
  }

  preparar(id: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/${id}/preparar`, {});
  }

  despachar(id: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/${id}/despachar`, {});
  }

  entregar(id: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/${id}/entregar`, {});
  }

  cancelar(id: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/${id}/cancelar`, {});
  }

  listarPorCliente(clienteId: string): Observable<PedidoResponse[]> {
    return this.http.get<PedidoResponse[]>(`${this.API_URL}/por-cliente/${clienteId}`);
  }

  listarPorEstado(estado: string): Observable<PedidoResponse[]> {
    return this.http.get<PedidoResponse[]>(`${this.API_URL}/por-estado/${estado}`);
  }
}
