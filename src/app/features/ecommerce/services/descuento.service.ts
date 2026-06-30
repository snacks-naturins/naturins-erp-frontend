import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DescuentoResponse, CreateDescuentoRequest } from '../models/descuento.model';

@Injectable({ providedIn: 'root' })
export class DescuentoService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/descuentos`;

  listar(): Observable<DescuentoResponse[]> {
    return this.http.get<DescuentoResponse[]>(this.API);
  }

  crear(dto: CreateDescuentoRequest): Observable<DescuentoResponse> {
    return this.http.post<DescuentoResponse>(this.API, dto);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
