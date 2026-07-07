import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CalcularRecetaRequest,
  CrearProduccionDesdeRecetaRequest,
  CreateRecetaRequest,
  RecetaCalculoResponse,
  RecetaResponse,
  UpdateRecetaRequest,
} from '../models/receta.model';
import { ProduccionResponse } from '../models/produccion.model';

@Injectable({ providedIn: 'root' })
export class RecetaService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/recetas`;

  listar(): Observable<RecetaResponse[]> {
    return this.http.get<RecetaResponse[]>(this.API_URL);
  }

  buscarPorId(id: string): Observable<RecetaResponse> {
    return this.http.get<RecetaResponse>(`${this.API_URL}/${id}`);
  }

  listarPorPresentacion(presentacionId: string): Observable<RecetaResponse[]> {
    return this.http.get<RecetaResponse[]>(`${this.API_URL}/por-presentacion/${presentacionId}`);
  }

  crear(dto: CreateRecetaRequest): Observable<RecetaResponse> {
    return this.http.post<RecetaResponse>(this.API_URL, dto);
  }

  actualizar(id: string, dto: UpdateRecetaRequest): Observable<RecetaResponse> {
    return this.http.put<RecetaResponse>(`${this.API_URL}/${id}`, dto);
  }

  activar(id: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/${id}/activar`, {});
  }

  archivar(id: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/${id}/archivar`, {});
  }

  calcular(id: string, dto: CalcularRecetaRequest): Observable<RecetaCalculoResponse> {
    return this.http.post<RecetaCalculoResponse>(`${this.API_URL}/${id}/calcular`, dto);
  }

  producir(id: string, dto: CrearProduccionDesdeRecetaRequest): Observable<ProduccionResponse> {
    return this.http.post<ProduccionResponse>(`${this.API_URL}/${id}/producir`, dto);
  }
}
