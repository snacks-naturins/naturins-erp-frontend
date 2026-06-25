import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CotizacionResponse, CreateCotizacionRequest, UpdateCotizacionRequest } from '../models/cotizacion.model';

@Injectable({ providedIn: 'root' })
export class CotizacionService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/cotizaciones`;

  listar(): Observable<CotizacionResponse[]> {
    return this.http.get<CotizacionResponse[]>(this.API_URL);
  }

  buscarPorId(id: string): Observable<CotizacionResponse> {
    return this.http.get<CotizacionResponse>(`${this.API_URL}/${id}`);
  }

  crear(dto: CreateCotizacionRequest): Observable<CotizacionResponse> {
    return this.http.post<CotizacionResponse>(this.API_URL, dto);
  }

  actualizar(id: string, dto: UpdateCotizacionRequest): Observable<CotizacionResponse> {
    return this.http.put<CotizacionResponse>(`${this.API_URL}/${id}`, dto);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  enviar(id: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/${id}/enviar`, {});
  }

  aceptar(id: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/${id}/aceptar`, {});
  }

  rechazar(id: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/${id}/rechazar`, {});
  }

  listarPorCliente(clienteId: string): Observable<CotizacionResponse[]> {
    return this.http.get<CotizacionResponse[]>(`${this.API_URL}/por-cliente/${clienteId}`);
  }

  listarPorEstado(estado: string): Observable<CotizacionResponse[]> {
    return this.http.get<CotizacionResponse[]>(`${this.API_URL}/por-estado/${estado}`);
  }
}
