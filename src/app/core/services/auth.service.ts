import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthResponse, AuthUser, LoginRequest } from '../models/auth.model';
import { TokenStorageService } from './token-storage.service';

/**
 * Servicio central de autenticación.
 * Expone el usuario actual como signal para que la UI reaccione (header, guards, etc.).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(TokenStorageService);
  private readonly router = inject(Router);

  private readonly API_URL = `${environment.apiUrl}/auth`;

  // Estado reactivo del usuario autenticado
  private readonly _currentUser = signal<AuthUser | null>(this.storage.getUser());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);

  /** Inicia sesión, guarda el token + usuario y actualiza el estado. */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap((res) => {
          const user: AuthUser = { username: res.username, rol: res.rol };
          this.storage.setToken(res.token);
          this.storage.setUser(user);
          this._currentUser.set(user);
        }),
      );
  }

  /** Cierra sesión, limpia el almacenamiento y redirige al login. */
  logout(): void {
    this.storage.clear();
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.storage.getToken();
  }

  /** True si hay token y no está expirado. Lo usan los guards. */
  isAuthenticated(): boolean {
    const token = this.storage.getToken();
    if (!token) {
      return false;
    }
    if (this.isTokenExpired(token)) {
      this.storage.clear();
      this._currentUser.set(null);
      return false;
    }
    return true;
  }

  hasRole(...roles: string[]): boolean {
    const rol = this._currentUser()?.rol;
    return rol ? roles.includes(rol) : false;
  }

  // --- Helpers de JWT (decodificación del payload, sin verificar la firma) ---

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload?.exp) {
      return false; // si no trae exp, lo tratamos como no expirado
    }
    return payload.exp * 1000 < Date.now();
  }

  private decodeToken(token: string): { exp?: number; rol?: string; sub?: string } | null {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }
}
