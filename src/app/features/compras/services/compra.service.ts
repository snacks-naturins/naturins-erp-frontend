import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CompraResponse,
  CreateCompraRequest,
  UpdateCompraRequest,
} from '../models/compra.model';

@Injectable({ providedIn: 'root' })
export class CompraService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/compras`;

  listar(): Observable<CompraResponse[]> {
    return this.http.get<CompraResponse[]>(this.API_URL);
  }

  buscarPorId(id: string): Observable<CompraResponse> {
    return this.http.get<CompraResponse>(`${this.API_URL}/${id}`);
  }

  crear(dto: CreateCompraRequest): Observable<CompraResponse> {
    return this.http.post<CompraResponse>(this.API_URL, dto);
  }

  actualizar(id: string, dto: UpdateCompraRequest): Observable<CompraResponse> {
    return this.http.put<CompraResponse>(`${this.API_URL}/${id}`, dto);
  }

  recibir(id: string): Observable<CompraResponse> {
    return this.http.put<CompraResponse>(`${this.API_URL}/${id}/recibir`, {});
  }

  listarPorProveedor(proveedorId: string): Observable<CompraResponse[]> {
    return this.http.get<CompraResponse[]>(`${this.API_URL}/por-proveedor/${proveedorId}`);
  }

  cancelar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
