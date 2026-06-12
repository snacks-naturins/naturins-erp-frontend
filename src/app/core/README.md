# core/

Código **singleton** que se carga una sola vez en toda la app.

- `guards/` — guards de rutas (`authGuard`, `roleGuard`, etc.).
- `interceptors/` — interceptores HTTP (token JWT, manejo de errores, loading).
- `services/` — servicios globales de aplicación (auth, sesión, notificaciones).
- `models/` — interfaces/tipos transversales (User, ApiResponse, etc.).

Regla: aquí NO van componentes de UI reutilizables (eso es `shared/`).
