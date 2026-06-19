import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CreateProductoRequest,
  ProductoResponse,
  UpdateProductoRequest,
} from '../models/producto.model';

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/productos`;

  listar(): Observable<ProductoResponse[]> {
    return this.http.get<ProductoResponse[]>(this.API_URL);
  }

  obtenerPorId(id: string): Observable<ProductoResponse> {
    return this.http.get<ProductoResponse>(`${this.API_URL}/${id}`);
  }

  crear(dto: CreateProductoRequest): Observable<ProductoResponse> {
    return this.http.post<ProductoResponse>(this.API_URL, dto);
  }

  actualizar(id: string, dto: UpdateProductoRequest): Observable<ProductoResponse> {
    return this.http.put<ProductoResponse>(`${this.API_URL}/${id}`, dto);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
