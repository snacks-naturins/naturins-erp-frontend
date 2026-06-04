import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaz basada en tu modelo de Java
export interface Producto {
  id?: number;
  nombre: string;
  precio: number;
  descripcion: string;
  estado: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private API_URL = 'http://localhost:8080/api/productos'; // Ajusta tu URL

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.API_URL);
  }
}