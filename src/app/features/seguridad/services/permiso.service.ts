import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ModuloResponse, RolModuloResponse, BulkActualizarPermisosRequest } from '../models/modulo.model';

@Injectable({ providedIn: 'root' })
export class PermisoService {
  private readonly http = inject(HttpClient);
  private readonly MODULOS_URL   = `${environment.apiUrl}/modulos`;
  private readonly ROL_MOD_URL   = `${environment.apiUrl}/rol-modulo`;

  listarModulos(): Observable<ModuloResponse[]> {
    return this.http.get<ModuloResponse[]>(this.MODULOS_URL);
  }

  listarPorRol(rolId: string): Observable<RolModuloResponse[]> {
    return this.http.get<RolModuloResponse[]>(`${this.ROL_MOD_URL}/por-rol/${rolId}`);
  }

  misPermisos(): Observable<RolModuloResponse[]> {
    return this.http.get<RolModuloResponse[]>(`${this.ROL_MOD_URL}/mis-permisos`);
  }

  actualizarBulk(rolId: string, body: BulkActualizarPermisosRequest): Observable<RolModuloResponse[]> {
    return this.http.put<RolModuloResponse[]>(`${this.ROL_MOD_URL}/por-rol/${rolId}`, body);
  }
}
