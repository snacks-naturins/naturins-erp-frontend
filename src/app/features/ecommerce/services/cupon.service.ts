import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CuponResponse, CreateCuponRequest, UpdateCuponRequest } from '../models/cupon.model';

@Injectable({ providedIn: 'root' })
export class CuponService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/ecommerce/cupones`;

  listar(): Observable<CuponResponse[]> {
    return this.http.get<CuponResponse[]>(this.API_URL);
  }

  crear(dto: CreateCuponRequest): Observable<CuponResponse> {
    return this.http.post<CuponResponse>(this.API_URL, dto);
  }

  actualizar(id: string, dto: UpdateCuponRequest): Observable<CuponResponse> {
    return this.http.put<CuponResponse>(`${this.API_URL}/${id}`, dto);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
