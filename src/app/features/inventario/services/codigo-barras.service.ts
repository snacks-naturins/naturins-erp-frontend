import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface CodigoBarrasResponse {
  id: string;
  presentacionProductoId: string;
  nombreProducto: string;
  tituloPresentacion: string;
  codigo: string;
  tipo: string;
}

@Injectable({ providedIn: 'root' })
export class CodigoBarrasService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/codigos-barras`;

  buscarPorCodigo(codigo: string): Observable<CodigoBarrasResponse> {
    return this.http.get<CodigoBarrasResponse>(`${this.API_URL}/buscar`, { params: { codigo } });
  }

  listarPorPresentacion(presentacionProductoId: string): Observable<CodigoBarrasResponse[]> {
    return this.http.get<CodigoBarrasResponse[]>(`${this.API_URL}/por-presentacion/${presentacionProductoId}`);
  }
}
