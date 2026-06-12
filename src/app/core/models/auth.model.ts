// Contratos de autenticación (espejo de los DTOs del backend Spring Boot)

// POST /api/auth/login  ->  request
export interface LoginRequest {
  username: string;
  password: string;
}

// POST /api/auth/login  ->  response
export interface AuthResponse {
  token: string;
  username: string;
  rol: string;
}

// Usuario autenticado que guardamos en sesión (sin el token)
export interface AuthUser {
  username: string;
  rol: string;
}
