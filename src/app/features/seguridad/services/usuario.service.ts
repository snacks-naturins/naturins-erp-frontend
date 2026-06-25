import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UsuarioResponse, CreateUsuarioRequest, UpdateUsuarioRequest, CreatePersonaRequest } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly URL = `${environment.apiUrl}/usuarios`;
  private readonly PERSONAS_URL = `${environment.apiUrl}/personas`;

  listar(): Observable<UsuarioResponse[]> { return this.http.get<UsuarioResponse[]>(this.URL); }
  buscarPorId(id: string): Observable<UsuarioResponse> { return this.http.get<UsuarioResponse>(`${this.URL}/${id}`); }
  crear(body: CreateUsuarioRequest): Observable<UsuarioResponse> { return this.http.post<UsuarioResponse>(this.URL, body); }
  actualizar(id: string, body: UpdateUsuarioRequest): Observable<UsuarioResponse> { return this.http.put<UsuarioResponse>(`${this.URL}/${id}`, body); }
  eliminar(id: string): Observable<void> { return this.http.delete<void>(`${this.URL}/${id}`); }

  crearPersona(body: CreatePersonaRequest): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.PERSONAS_URL, body);
  }
}
