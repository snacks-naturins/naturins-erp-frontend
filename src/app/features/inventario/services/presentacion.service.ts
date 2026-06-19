import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CreatePresentacionRequest,
  PresentacionResponse,
  UpdatePresentacionRequest,
} from '../models/presentacion.model';

@Injectable({ providedIn: 'root' })
export class PresentacionService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/presentaciones-producto`;

  listar(): Observable<PresentacionResponse[]> {
    return this.http.get<PresentacionResponse[]>(this.API_URL);
  }

  crear(dto: CreatePresentacionRequest): Observable<PresentacionResponse> {
    return this.http.post<PresentacionResponse>(this.API_URL, dto);
  }

  actualizar(id: string, dto: UpdatePresentacionRequest): Observable<PresentacionResponse> {
    return this.http.put<PresentacionResponse>(`${this.API_URL}/${id}`, dto);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
