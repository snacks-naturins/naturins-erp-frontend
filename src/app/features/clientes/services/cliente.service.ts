import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  ClienteResponse,
  CreateClienteRequest,
  UpdateClienteRequest,
} from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/clientes`;

  listar(): Observable<ClienteResponse[]> {
    return this.http.get<ClienteResponse[]>(this.API_URL);
  }

  crear(dto: CreateClienteRequest): Observable<ClienteResponse> {
    return this.http.post<ClienteResponse>(this.API_URL, dto);
  }

  actualizar(id: string, dto: UpdateClienteRequest): Observable<ClienteResponse> {
    return this.http.put<ClienteResponse>(`${this.API_URL}/${id}`, dto);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
