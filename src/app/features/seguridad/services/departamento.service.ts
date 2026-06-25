import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DepartamentoResponse, CreateDepartamentoRequest, UpdateDepartamentoRequest } from '../models/departamento.model';

@Injectable({ providedIn: 'root' })
export class DepartamentoService {
  private readonly http = inject(HttpClient);
  private readonly URL = `${environment.apiUrl}/departamentos`;

  listar(): Observable<DepartamentoResponse[]> { return this.http.get<DepartamentoResponse[]>(this.URL); }
  listarActivos(): Observable<DepartamentoResponse[]> { return this.http.get<DepartamentoResponse[]>(`${this.URL}/activos`); }
  buscarPorId(id: string): Observable<DepartamentoResponse> { return this.http.get<DepartamentoResponse>(`${this.URL}/${id}`); }
  crear(body: CreateDepartamentoRequest): Observable<DepartamentoResponse> { return this.http.post<DepartamentoResponse>(this.URL, body); }
  actualizar(id: string, body: UpdateDepartamentoRequest): Observable<DepartamentoResponse> { return this.http.put<DepartamentoResponse>(`${this.URL}/${id}`, body); }
  eliminar(id: string): Observable<void> { return this.http.delete<void>(`${this.URL}/${id}`); }
}
