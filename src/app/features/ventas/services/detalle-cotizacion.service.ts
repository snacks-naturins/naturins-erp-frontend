import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CreateDetalleCotizacionRequest, DetalleCotizacionResponse, UpdateDetalleCotizacionRequest } from '../models/detalle-cotizacion.model';

@Injectable({ providedIn: 'root' })
export class DetalleCotizacionService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/detalle-cotizacion`;

  crear(dto: CreateDetalleCotizacionRequest): Observable<DetalleCotizacionResponse> {
    return this.http.post<DetalleCotizacionResponse>(this.API_URL, dto);
  }

  porCotizacion(cotizacionId: string): Observable<DetalleCotizacionResponse[]> {
    return this.http.get<DetalleCotizacionResponse[]>(`${this.API_URL}/por-cotizacion/${cotizacionId}`);
  }

  actualizar(id: string, dto: UpdateDetalleCotizacionRequest): Observable<DetalleCotizacionResponse> {
    return this.http.put<DetalleCotizacionResponse>(`${this.API_URL}/${id}`, dto);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
