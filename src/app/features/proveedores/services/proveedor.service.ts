import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CreateProveedorRequest,
  ProveedorResponse,
  UpdateProveedorRequest,
} from '../models/proveedor.model';

@Injectable({ providedIn: 'root' })
export class ProveedorService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/proveedores`;

  listar(): Observable<ProveedorResponse[]> {
    return this.http.get<ProveedorResponse[]>(this.API_URL);
  }

  crear(dto: CreateProveedorRequest): Observable<ProveedorResponse> {
    return this.http.post<ProveedorResponse>(this.API_URL, dto);
  }

  actualizar(id: string, dto: UpdateProveedorRequest): Observable<ProveedorResponse> {
    return this.http.put<ProveedorResponse>(`${this.API_URL}/${id}`, dto);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
