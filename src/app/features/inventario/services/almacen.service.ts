import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AlmacenResponse,
  CreateAlmacenRequest,
  UpdateAlmacenRequest,
} from '../models/almacen.model';

@Injectable({ providedIn: 'root' })
export class AlmacenService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/almacenes`;

  listar(): Observable<AlmacenResponse[]> {
    return this.http.get<AlmacenResponse[]>(this.API_URL);
  }

  crear(dto: CreateAlmacenRequest): Observable<AlmacenResponse> {
    return this.http.post<AlmacenResponse>(this.API_URL, dto);
  }

  actualizar(id: string, dto: UpdateAlmacenRequest): Observable<AlmacenResponse> {
    return this.http.put<AlmacenResponse>(`${this.API_URL}/${id}`, dto);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
