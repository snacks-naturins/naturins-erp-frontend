import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CategoriaResponse, CreateCategoriaRequest } from '../models/categoria.model';

@Injectable({
  providedIn: 'root',
})
export class CategoriaService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/categorias`;

  listar(): Observable<CategoriaResponse[]> {
    return this.http.get<CategoriaResponse[]>(this.API_URL);
  }

  crear(dto: CreateCategoriaRequest): Observable<CategoriaResponse> {
    return this.http.post<CategoriaResponse>(this.API_URL, dto);
  }
}
