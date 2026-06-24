import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CreateDetalleProduccionRequest,
  DetalleProduccionResponse,
  UpdateDetalleProduccionRequest,
} from '../models/detalle-produccion.model';

@Injectable({ providedIn: 'root' })
export class DetalleProduccionService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/detalle-produccion`;

  porProduccion(produccionId: string): Observable<DetalleProduccionResponse[]> {
    return this.http.get<DetalleProduccionResponse[]>(`${this.API_URL}/por-produccion/${produccionId}`);
  }

  crear(dto: CreateDetalleProduccionRequest): Observable<DetalleProduccionResponse> {
    return this.http.post<DetalleProduccionResponse>(this.API_URL, dto);
  }

  actualizar(id: string, dto: UpdateDetalleProduccionRequest): Observable<DetalleProduccionResponse> {
    return this.http.put<DetalleProduccionResponse>(`${this.API_URL}/${id}`, dto);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
