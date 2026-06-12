import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Producto } from '../models/producto.model';

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  private API_URL = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.API_URL);
  }
}
