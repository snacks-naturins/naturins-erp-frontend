import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CreateMermaRequest, MermaResponse } from '../models/merma.model';

@Injectable({ providedIn: 'root' })
export class MermaService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/mermas`;

  porLote(loteId: string): Observable<MermaResponse[]> {
    return this.http.get<MermaResponse[]>(`${this.API_URL}/por-lote/${loteId}`);
  }

  listar(): Observable<MermaResponse[]> {
    return this.http.get<MermaResponse[]>(this.API_URL);
  }

  crear(dto: CreateMermaRequest): Observable<MermaResponse> {
    return this.http.post<MermaResponse>(this.API_URL, dto);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
