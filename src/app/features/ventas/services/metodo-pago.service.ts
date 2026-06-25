import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  MetodoPagoResponse,
  CreateMetodoPagoRequest,
  UpdateMetodoPagoRequest,
} from '../models/metodo-pago.model';

@Injectable({ providedIn: 'root' })
export class MetodoPagoService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/metodos-pago`;

  listar(): Observable<MetodoPagoResponse[]> {
    return this.http.get<MetodoPagoResponse[]>(this.API_URL);
  }

  listarActivos(): Observable<MetodoPagoResponse[]> {
    return this.http.get<MetodoPagoResponse[]>(`${this.API_URL}/por-estado/ACTIVO`);
  }

  crear(body: CreateMetodoPagoRequest): Observable<MetodoPagoResponse> {
    return this.http.post<MetodoPagoResponse>(this.API_URL, body);
  }

  actualizar(id: string, body: UpdateMetodoPagoRequest): Observable<MetodoPagoResponse> {
    return this.http.put<MetodoPagoResponse>(`${this.API_URL}/${id}`, body);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
