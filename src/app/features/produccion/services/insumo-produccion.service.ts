import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CreateInsumoProduccionRequest,
  InsumoProduccionResponse,
  UpdateInsumoProduccionRequest,
} from '../models/insumo-produccion.model';

@Injectable({ providedIn: 'root' })
export class InsumoProduccionService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/insumo-produccion`;

  porProduccion(produccionId: string): Observable<InsumoProduccionResponse[]> {
    return this.http.get<InsumoProduccionResponse[]>(`${this.API_URL}/por-produccion/${produccionId}`);
  }

  crear(dto: CreateInsumoProduccionRequest): Observable<InsumoProduccionResponse> {
    return this.http.post<InsumoProduccionResponse>(this.API_URL, dto);
  }

  actualizar(id: string, dto: UpdateInsumoProduccionRequest): Observable<InsumoProduccionResponse> {
    return this.http.put<InsumoProduccionResponse>(`${this.API_URL}/${id}`, dto);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
