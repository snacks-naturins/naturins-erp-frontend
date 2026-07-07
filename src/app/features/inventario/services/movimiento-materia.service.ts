import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CreateMovimientoMateriaRequest,
  MovimientoMateriaResponse,
} from '../models/movimiento-materia.model';

@Injectable({ providedIn: 'root' })
export class MovimientoMateriaService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/movimientos-materia`;

  crear(dto: CreateMovimientoMateriaRequest): Observable<MovimientoMateriaResponse> {
    return this.http.post<MovimientoMateriaResponse>(this.API_URL, dto);
  }

  listarPorMateria(materiaPrimaId: string): Observable<MovimientoMateriaResponse[]> {
    return this.http.get<MovimientoMateriaResponse[]>(
      `${this.API_URL}/por-materia/${materiaPrimaId}`
    );
  }

  kardexPorFecha(
    materiaPrimaId: string,
    desde: string,
    hasta: string
  ): Observable<MovimientoMateriaResponse[]> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<MovimientoMateriaResponse[]>(
      `${this.API_URL}/por-materia/${materiaPrimaId}/kardex`,
      { params }
    );
  }
}
