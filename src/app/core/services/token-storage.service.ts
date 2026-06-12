import { Injectable } from '@angular/core';

import { AuthUser } from '../models/auth.model';

/**
 * Encapsula el almacenamiento del token JWT y del usuario en localStorage.
 * Ningún otro servicio debe leer localStorage directamente.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly TOKEN_KEY = 'naturins_token';
  private readonly USER_KEY = 'naturins_user';

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  }

  setUser(user: AuthUser): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  clear(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}
