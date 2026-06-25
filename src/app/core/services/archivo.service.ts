import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ArchivoService {
  private readonly http = inject(HttpClient);
  private readonly URL = `${environment.apiUrl}/uploads`;

  subirImagen(file: File): Observable<{ url: string; filename: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ url: string; filename: string }>(this.URL, fd);
  }

  subirCv(file: File): Observable<{ url: string; filename: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ url: string; filename: string }>(`${this.URL}/cv`, fd);
  }
}
