import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CreateMateriaPrimaRequest,
  MateriaPrimaResponse,
  UpdateMateriaPrimaRequest,
} from '../models/materia-prima.model';

@Injectable({ providedIn: 'root' })
export class MateriaPrimaService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/materia-prima`;

  listar(): Observable<MateriaPrimaResponse[]> {
    return this.http.get<MateriaPrimaResponse[]>(this.API_URL);
  }

  listarActivos(): Observable<MateriaPrimaResponse[]> {
    return this.http.get<MateriaPrimaResponse[]>(`${this.API_URL}/por-estado/ACTIVO`);
  }

  buscarPorId(id: string): Observable<MateriaPrimaResponse> {
    return this.http.get<MateriaPrimaResponse>(`${this.API_URL}/${id}`);
  }

  crear(dto: CreateMateriaPrimaRequest): Observable<MateriaPrimaResponse> {
    return this.http.post<MateriaPrimaResponse>(this.API_URL, dto);
  }

  actualizar(id: string, dto: UpdateMateriaPrimaRequest): Observable<MateriaPrimaResponse> {
    return this.http.put<MateriaPrimaResponse>(`${this.API_URL}/${id}`, dto);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
