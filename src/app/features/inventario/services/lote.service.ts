import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CreateLoteRequest, LoteResponse, UpdateLoteRequest } from '../models/lote.model';

@Injectable({ providedIn: 'root' })
export class LoteService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/lotes`;

  listar(): Observable<LoteResponse[]> {
    return this.http.get<LoteResponse[]>(this.API_URL);
  }

  listarPorAlmacen(almacenId: string): Observable<LoteResponse[]> {
    return this.http.get<LoteResponse[]>(`${this.API_URL}/por-almacen/${almacenId}`);
  }

  listarDisponibles(): Observable<LoteResponse[]> {
    return this.http.get<LoteResponse[]>(`${this.API_URL}/disponibles`);
  }

  crear(dto: CreateLoteRequest): Observable<LoteResponse> {
    return this.http.post<LoteResponse>(this.API_URL, dto);
  }

  actualizar(id: string, dto: UpdateLoteRequest): Observable<LoteResponse> {
    return this.http.put<LoteResponse>(`${this.API_URL}/${id}`, dto);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
