import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CompletarProduccionRequest,
  CreateProduccionRequest,
  EstadoProduccion,
  ProduccionResponse,
  UpdateProduccionRequest,
} from '../models/produccion.model';

@Injectable({ providedIn: 'root' })
export class ProduccionService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/produccion`;

  listar(): Observable<ProduccionResponse[]> {
    return this.http.get<ProduccionResponse[]>(this.API_URL);
  }

  buscarPorId(id: string): Observable<ProduccionResponse> {
    return this.http.get<ProduccionResponse>(`${this.API_URL}/${id}`);
  }

  listarPorEstado(estado: EstadoProduccion): Observable<ProduccionResponse[]> {
    return this.http.get<ProduccionResponse[]>(`${this.API_URL}/por-estado/${estado}`);
  }

  crear(dto: CreateProduccionRequest): Observable<ProduccionResponse> {
    return this.http.post<ProduccionResponse>(this.API_URL, dto);
  }

  actualizar(id: string, dto: UpdateProduccionRequest): Observable<ProduccionResponse> {
    return this.http.put<ProduccionResponse>(`${this.API_URL}/${id}`, dto);
  }

  completar(id: string, dto: CompletarProduccionRequest): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/${id}/completar`, dto);
  }

  cancelar(id: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/${id}/cancelar`, {});
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
