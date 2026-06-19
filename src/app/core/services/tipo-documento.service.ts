import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { TipoDocumentoResponse } from '../models/tipo-documento.model';

@Injectable({ providedIn: 'root' })
export class TipoDocumentoService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/tipo-documento`;

  listar(): Observable<TipoDocumentoResponse[]> {
    return this.http.get<TipoDocumentoResponse[]>(this.API_URL);
  }
}
