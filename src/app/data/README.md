# data/

Capa de **acceso a datos** (comunicación con el backend Spring Boot).

- `repositories/` — clases que encapsulan las llamadas HTTP por recurso.
- `models/` — DTOs / contratos de la API (lo que viaja por la red).

Patrón sugerido: las features consumen `repositories/`; los componentes nunca
llaman a `HttpClient` directamente. La `API_URL` base puede centralizarse aquí
o en `environments/`.
