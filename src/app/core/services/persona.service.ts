import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreatePersonaRequest, PersonaResponse } from '../models/persona.model';

@Injectable({ providedIn: 'root' })
export class PersonaService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/personas`;

  listar(): Observable<PersonaResponse[]> {
    return this.http.get<PersonaResponse[]>(this.API_URL);
  }

  crear(dto: CreatePersonaRequest): Observable<PersonaResponse> {
    return this.http.post<PersonaResponse>(this.API_URL, dto);
  }

  obtenerPorId(id: string): Observable<PersonaResponse> {
    return this.http.get<PersonaResponse>(`${this.API_URL}/${id}`);
  }
}
