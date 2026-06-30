import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { BannerResponse, CreateBannerRequest, UpdateBannerRequest } from '../models/banner.model';

@Injectable({ providedIn: 'root' })
export class BannerService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/ecommerce/banners`;

  listar(): Observable<BannerResponse[]> {
    return this.http.get<BannerResponse[]>(this.API_URL);
  }

  obtener(id: string): Observable<BannerResponse> {
    return this.http.get<BannerResponse>(`${this.API_URL}/${id}`);
  }

  crear(dto: CreateBannerRequest): Observable<BannerResponse> {
    return this.http.post<BannerResponse>(this.API_URL, dto);
  }

  actualizar(id: string, dto: UpdateBannerRequest): Observable<BannerResponse> {
    return this.http.put<BannerResponse>(`${this.API_URL}/${id}`, dto);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
