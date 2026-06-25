import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RolResponse, CreateRolRequest, UpdateRolRequest } from '../models/rol.model';

@Injectable({ providedIn: 'root' })
export class RolService {
  private readonly http = inject(HttpClient);
  private readonly URL = `${environment.apiUrl}/roles`;

  listar(): Observable<RolResponse[]> { return this.http.get<RolResponse[]>(this.URL); }
  buscarPorId(id: string): Observable<RolResponse> { return this.http.get<RolResponse>(`${this.URL}/${id}`); }
  crear(body: CreateRolRequest): Observable<RolResponse> { return this.http.post<RolResponse>(this.URL, body); }
  actualizar(id: string, body: UpdateRolRequest): Observable<RolResponse> { return this.http.put<RolResponse>(`${this.URL}/${id}`, body); }
  eliminar(id: string): Observable<void> { return this.http.delete<void>(`${this.URL}/${id}`); }
}
