# Arquitectura del Frontend — Naturin's ERP

Aplicación **Angular** (standalone components) organizada por **features** con
capas transversales. Cada módulo de negocio del ERP es autocontenido y se carga
mediante *lazy loading*.

---

## 1. Árbol de carpetas

```
src/app/
│
├── core/                      # Singletons: se cargan una sola vez en toda la app
│   ├── guards/                #   guards de rutas (authGuard, roleGuard…)
│   ├── interceptors/          #   interceptores HTTP (JWT, errores, loading)
│   ├── services/              #   servicios globales (auth, sesión, notificaciones)
│   └── models/                #   tipos transversales (User, ApiResponse…)
│
├── shared/                    # Piezas reutilizables y SIN estado
│   ├── components/            #   UI reutilizable (botón, modal, tabla, spinner)
│   ├── directives/            #   directivas reutilizables
│   ├── pipes/                 #   pipes (moneda, fecha…)
│   └── models/                #   tipos auxiliares de UI
│
├── layout/                    # Estructura visual de la app
│   ├── header/
│   └── sidebar/
│
├── features/                  # Módulos de negocio (uno por dominio del ERP)
│   ├── usuarios/
│   │   ├── pages/login/
│   │   ├── services/
│   │   ├── models/
│   │   └── usuarios.routes.ts
│   ├── inventario/
│   │   ├── pages/
│   │   │   ├── products-list/
│   │   │   ├── product-form/
│   │   │   └── kardex/
│   │   ├── services/
│   │   │   └── producto.service.ts
│   │   ├── models/
│   │   │   └── producto.model.ts
│   │   └── inventario.routes.ts
│   ├── ventas/
│   │   ├── pages/pos/
│   │   ├── services/
│   │   ├── models/
│   │   └── ventas.routes.ts
│   ├── compras/               # (pendiente) estructura lista
│   │   └── compras.routes.ts
│   └── clientes/              # (pendiente) estructura lista
│       └── clientes.routes.ts
│
├── data/                      # Capa de acceso a datos (API Spring Boot)
│   ├── repositories/          #   llamadas HTTP encapsuladas por recurso
│   └── models/                #   DTOs / contratos de la API
│
├── state/                     # Estado global compartido entre features
│   └── stores/                #   stores con Signals (sesión, carrito POS…)
│
├── routes/                    # Enrutamiento central
│   └── app.routes.ts          #   agrega las rutas de todas las features
│
├── app.config.ts             # Providers globales (router, HttpClient…)
├── app.ts / app.html / app.css
└── app.spec.ts
```

---

## 2. Responsabilidad de cada capa

| Capa | Para qué sirve | Qué NO va aquí |
|------|----------------|----------------|
| **core/** | Lógica singleton de toda la app: guards, interceptores, auth. | Componentes de UI reutilizables. |
| **shared/** | UI reutilizable sin estado (componentes, pipes, directivas). | Lógica de negocio de un módulo. |
| **layout/** | Cáscara visual (header, sidebar). | Páginas de negocio. |
| **features/** | Cada dominio del ERP, autocontenido. | Código compartido entre módulos. |
| **data/** | Comunicación con el backend (repositorios, DTOs). | Llamar a `HttpClient` desde componentes. |
| **state/** | Estado global entre features (Signals). | Estado local de un solo componente. |
| **routes/** | Composición de todas las rutas. | Lógica de páginas. |

---

## 3. Estructura de una feature

Cada módulo sigue el mismo patrón:

```
<feature>/
├── pages/                  # vistas/componentes de la feature
├── services/               # servicios propios de la feature
├── models/                 # modelos/interfaces propios de la feature
└── <feature>.routes.ts     # rutas de la feature (lazy loading)
```

### Features actuales

| Feature | Estado | Páginas |
|---------|--------|---------|
| `usuarios/`   | ✅ activa    | login |
| `inventario/` | ✅ activa    | products-list, product-form, kardex |
| `ventas/`     | ✅ activa    | pos |
| `compras/`    | ⏳ pendiente | — |
| `clientes/`   | ⏳ pendiente | — |

---

## 4. Enrutamiento (lazy loading)

Cada feature expone sus rutas con `loadComponent` y se agregan en
`routes/app.routes.ts`.

**`features/inventario/inventario.routes.ts`**
```ts
import { Routes } from '@angular/router';

export const INVENTARIO_ROUTES: Routes = [
  {
    path: 'productos',
    loadComponent: () =>
      import('./pages/products-list/products-list').then((m) => m.ProductList),
  },
  {
    path: 'productos/nuevo',
    loadComponent: () =>
      import('./pages/product-form/product-form').then((m) => m.ProductForm),
  },
  {
    path: 'kardex',
    loadComponent: () => import('./pages/kardex/kardex').then((m) => m.Kardex),
  },
];
```

**`routes/app.routes.ts`** (composición central)
```ts
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  ...USUARIOS_ROUTES,
  ...INVENTARIO_ROUTES,
  ...VENTAS_ROUTES,
  ...COMPRAS_ROUTES,
  ...CLIENTES_ROUTES,
  { path: '**', redirectTo: 'login' },
];
```

### Rutas disponibles

| Ruta | Componente | Feature |
|------|------------|---------|
| `/login` | `Login` | usuarios |
| `/productos` | `ProductList` | inventario |
| `/productos/nuevo` | `ProductForm` | inventario |
| `/kardex` | `Kardex` | inventario |
| `/pos` | `Pos` | ventas |

---

## 5. Convención de datos (modelo + servicio)

El modelo y el servicio van separados dentro de la feature.

**`features/inventario/models/producto.model.ts`**
```ts
export interface Producto {
  id?: number;
  nombre: string;
  precio: number;
  descripcion: string;
  estado: boolean;
}
```

**`features/inventario/services/producto.service.ts`**
```ts
@Injectable({ providedIn: 'root' })
export class ProductoService {
  private API_URL = 'http://localhost:8080/api/productos';
  constructor(private http: HttpClient) {}

  listarTodos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.API_URL);
  }
}
```

> `provideHttpClient()` está registrado en `app.config.ts`, requisito para que
> los servicios que usan `HttpClient` funcionen.

---

## 6. Cómo agregar una nueva feature

1. Crear la carpeta `features/<nombre>/` con `pages/`, `services/`, `models/`.
2. Crear las páginas (componentes standalone) dentro de `pages/`.
3. Crear `<nombre>.routes.ts` exportando `export const <NOMBRE>_ROUTES: Routes = [...]`.
4. Importar y agregar `...<NOMBRE>_ROUTES` en `routes/app.routes.ts`.
5. (Opcional) Añadir el enlace en `layout/sidebar/sidebar.html`.

---

## 7. Autenticación (JWT)

Flujo completo de login con token, montado sobre `core/`.

### Contrato del backend

| | |
|---|---|
| **Endpoint** | `POST {apiUrl}/auth/login` |
| **Request** | `{ "username": string, "password": string }` |
| **Response** | `{ "token": string, "username": string, "rol": string }` |
| **Header protegido** | `Authorization: Bearer <token>` |
| **Rutas públicas** | `/api/auth/**` y swagger; el resto exige token |

### Piezas

| Archivo | Rol |
|---------|-----|
| `core/models/auth.model.ts` | Tipos `LoginRequest`, `AuthResponse`, `AuthUser`. |
| `core/services/token-storage.service.ts` | Lee/escribe token y usuario en `localStorage`. |
| `core/services/auth.service.ts` | `login()`, `logout()`, `isAuthenticated()`, `hasRole()`, signal `currentUser`. |
| `core/interceptors/auth.interceptor.ts` | Inyecta `Authorization: Bearer` en cada request. |
| `core/interceptors/error.interceptor.ts` | Ante 401/403 cierra sesión y va al login. |
| `core/guards/auth.guard.ts` | `authGuard` (sesión) y `roleGuard(...roles)` (por rol). |

Los interceptores se registran en `app.config.ts`:
```ts
provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))
```

### Flujo

1. El usuario envía el formulario → `AuthService.login()` hace `POST /auth/login`.
2. Se guardan token + usuario en `localStorage` y se actualiza el signal `currentUser`.
3. Redirige a `/productos`.
4. Cada request siguiente lleva el token automáticamente (auth interceptor).
5. Las rutas protegidas usan `canActivate: [authGuard]`; sin token válido → `/login`.
6. El token se decodifica para verificar expiración (`exp`); si expiró, se limpia la sesión.
7. El header muestra `username` / `rol` y el botón **Salir** llama a `logout()`.

### Proteger una ruta

```ts
{ path: 'pos', canActivate: [authGuard], loadComponent: () => ... }
// por rol:
{ path: 'admin', canActivate: [roleGuard('ADMIN')], loadComponent: () => ... }
```

### Configuración de entorno

La URL del API vive en `src/environments/environment.ts` (`apiUrl`).
En build de producción se reemplaza por `environment.prod.ts` (ver
`fileReplacements` en `angular.json`).

---

## 8. Notas de migración

- Se eliminaron los componentes `dashboard/panel-control` y `production/order-form`.
- El **login** redirige a `/productos` (antes a `/dashboard`).
- El **sidebar** ya no muestra los enlaces *Dashboard* ni *Producción*.
- Se agregó `provideHttpClient()` en `app.config.ts`.

---

_Última actualización: 2026-06-11_
