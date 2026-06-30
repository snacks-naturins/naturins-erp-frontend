# Plan de Implementación E-commerce — Naturin's

**Versión:** 2.0  
**Fecha:** 2026-06-29  
**Framework shop:** React 19 + Vite + Tailwind v4 + Zustand + TanStack Query v5  
**Framework ERP:** Angular (Standalone Components, Signals)  
**Backend:** Spring Boot 3.x en `http://localhost:8080`

---

## Arquitectura general

```
┌─────────────────────────────────────────────────────────────┐
│  naturins-erp-frontend (Angular)  :4200                     │
│  Módulo /ecommerce — Admin del canal web                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  naturins-erp-backend (Spring Boot)  :8080                  │
│  • /api/**            → JWT rol ERP (ADMIN/VENDEDOR/…)      │
│  • /api/public/**     → sin autenticación                   │
│  • /api/ecommerce/**  → JWT tipo=CLIENTE                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  naturins-shop (React)  :5173                               │
│  Tienda online para clientes finales                        │
└─────────────────────────────────────────────────────────────┘
```

**Principio:** No hay panel admin dentro de la tienda. El ERP Angular **es** el admin del e-commerce.

---

## Resumen de fases

| Fase | Área | Descripción | Estado |
|------|------|-------------|--------|
| **A** | Backend | Endpoints e-commerce en Spring Boot | ✅ Completo |
| **B** | React Shop | Setup base del proyecto naturins-shop | ✅ Completo |
| **C** | React Shop | Páginas core (Home, Productos, Carrito, Auth) | ✅ Completo |
| **D** | React Shop | Páginas avanzadas (Checkout, Cuenta, Blog) | ✅ Completo |
| **E** | Angular ERP | Módulo `/ecommerce` de administración | ✅ Completo |

---

## Fase A — Backend E-commerce (Spring Boot)

> **Objetivo:** Exponer los endpoints necesarios para la tienda sin tocar el flujo ERP existente.  
> **Directorio:** `naturins-erp-backend/`

### A.1 — SecurityConfig + JWT para clientes

**Cambios en `SecurityConfig.java`:**
- Agregar CORS para origen `http://localhost:5173` (React shop)
- Rutas públicas sin auth: `/api/public/**`, `/api/ecommerce/auth/**`
- Resto de rutas solo requieren `authenticated()` (sin checks de rol en controllers)

**Cambios en `JwtService.java`:**
- Nuevo claim `tipo` en el token: `tipo=CLIENTE` para cuentas ecommerce vs `tipo=ERP` para usuarios internos
- Método `extractTipo(token)` para distinguir ambos tipos

---

### A.2 — Producto.visibleEcommerce

**Cambio en entidad `Producto.java`:**
```java
@Column(nullable = false)
private boolean visibleEcommerce = false;
```

**En `UpdateProductoRequest.java`:** agregar campo opcional `Boolean visibleEcommerce`

**En `ProductoResponse.java`:** agregar campo `boolean visibleEcommerce`

---

### A.3 — DTOs públicos

Ubicación: `model/dto/ecommerce/public/`

| DTO | Campos |
|-----|--------|
| `ProductoPublicoResponse` | id, nombre, descripcion, urlImagen, nombreCategoria, `List<PresentacionPublicaResponse>` |
| `PresentacionPublicaResponse` | id, nombre, precioVenta, stockDisponible (suma lotes DISPONIBLE) |
| `CategoriaPublicaResponse` | id, nombre, colorInterfaz |
| `BannerResponse` | id, titulo, subtitulo, urlImagen, urlDestino, orden |

**Cálculo de `stockDisponible`** — nuevo método en `LoteRepository`:
```java
@Query("SELECT COALESCE(SUM(l.stockLote), 0) FROM Lote l " +
       "WHERE l.presentacionProducto.id = :id AND l.estado = 'DISPONIBLE'")
BigDecimal sumarStockDisponiblePorPresentacion(@Param("id") String presentacionProductoId);
```

---

### A.4 — PublicController + PublicService

**Ruta base:** `GET /api/public/**` (sin auth)

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/public/productos` | Lista productos con `visibleEcommerce=true` y `activo=true` |
| `GET /api/public/productos/{id}` | Detalle de un producto público |
| `GET /api/public/categorias` | Lista categorías activas |
| `GET /api/public/banners` | Lista banners con `activo=true` ordenados por `orden ASC` |

**`PublicServiceImpl`:**
- Filtra `productoRepository.findByVisibleEcommerceAndActivo(true, true)`
- Para cada producto: mapea presentaciones activas con `sumarStockDisponiblePorPresentacion()`
- `listarBanners()`: `bannerRepository.findByActivoTrueOrderByOrdenAsc()`

---

### A.5 — CuentaEcommerce + EcommerceAuthController

**Nueva entidad `CuentaEcommerce.java`:**
```
id (UUID), email (unique), passwordHash, nombre, telefono, activo
@OneToOne → Cliente
```

**Endpoints:** `POST /api/ecommerce/auth/registro`, `POST /api/ecommerce/auth/login`, `GET /api/ecommerce/auth/me`

**Flujo registro:**
1. Busca o crea `Persona` con los datos del cliente
2. Crea `Cliente` con `aplicaIgv=false` (B2C)
3. Crea `CuentaEcommerce` con `BCryptPasswordEncoder`
4. Genera JWT con `tipo=CLIENTE`

**Flujo login:**
- Verifica email + password + `activo=true`
- Genera JWT con `generateToken(email, "CLIENTE", "CLIENTE")`
- Response: `{ token, email, nombre }`

---

### A.6 — Carrito + DetalleCarrito para ecommerce

> El backend ya tiene las entidades `Carrito` y `DetalleCarrito` del ERP (Fase 9 backend).  
> Solo se exponen endpoints que el checkout puede usar.

**Endpoint adicional:** `GET /api/carritos/por-cliente/{clienteId}` — ya existente.

El carrito ecommerce se crea via `POST /api/carritos` con el `clienteId` de la `CuentaEcommerce`.

---

### A.7 — Entidad Cupon + CuponController

**Nueva entidad `Cupon.java`:**
```
id (UUID), codigo (unique, MAYÚSCULAS), tipo (TipoCupon), valor (BigDecimal)
fechaInicio, fechaFin, usosMaximos (nullable), usosActuales, montoMinimo (nullable)
estado (EstadoCupon: ACTIVO/INACTIVO/VENCIDO/AGOTADO)
```

**Enums:**  
`TipoCupon`: `PORCENTAJE`, `MONTO_FIJO`, `ENVIO_GRATIS`  
`EstadoCupon`: `ACTIVO`, `INACTIVO`, `VENCIDO`, `AGOTADO`

**DTOs en `model/dto/ecommerce/cupon/`:**

| DTO | Campos clave |
|-----|-------------|
| `CreateCuponRequest` | codigo(@NotBlank @Size(max=50)), tipo(TipoCupon), valor(@DecimalMin("0.01")), fechaInicio, fechaFin, usosMaximos?, montoMinimo? |
| `UpdateCuponRequest` | todos opcionales: tipo, valor, fechaInicio, fechaFin, usosMaximos, montoMinimo, estado |
| `CuponResponse` | id, codigo, tipo, valor, fechaInicio, fechaFin, usosMaximos, usosActuales, montoMinimo, estado |
| `ValidarCuponRequest` | codigo, montoSubtotal |
| `ValidarCuponResponse` | cuponId, codigo, tipo(TipoCupon), descuento(BigDecimal), envioGratis(boolean) |

**Endpoints `CuponController` (`/api/ecommerce/cupones`):**
```
POST   /api/ecommerce/cupones          ← crear (201)
PUT    /api/ecommerce/cupones/{id}     ← actualizar
GET    /api/ecommerce/cupones/{id}     ← obtener
GET    /api/ecommerce/cupones          ← listar todos
DELETE /api/ecommerce/cupones/{id}     ← eliminar
POST   /api/ecommerce/cupones/validar  ← validar y calcular descuento
```

**Lógica `CuponServiceImpl.validar()`:**
1. Busca por `codigo` (case-insensitive)
2. Verifica `estado = ACTIVO`
3. Verifica `fechaInicio <= hoy <= fechaFin`
4. Verifica `usosActuales < usosMaximos` (si `usosMaximos != null`)
5. Verifica `subtotal >= montoMinimo` (si `montoMinimo != null`)
6. Calcula descuento según `TipoCupon`:
   - `PORCENTAJE`: `subtotal × valor / 100`
   - `MONTO_FIJO`: `min(valor, subtotal)`
   - `ENVIO_GRATIS`: descuento=0, envioGratis=true

---

### A.8 — Entidad Banner + BannerController

**Nueva entidad `Banner.java`:**
```
id (UUID), titulo(@NotBlank, max=150), subtitulo, urlImagen(@NotBlank)
urlDestino, orden(int), activo(boolean, default=true)
```

**DTOs en `model/dto/ecommerce/banner/`:**

| DTO | Campos |
|-----|--------|
| `CreateBannerRequest` | titulo, subtitulo?, urlImagen, urlDestino?, orden |
| `UpdateBannerRequest` | todos opcionales: titulo, subtitulo, urlImagen, urlDestino, orden, activo |
| `BannerResponse` | id, titulo, subtitulo, urlImagen, urlDestino, orden, activo |

**Endpoints `BannerController` (`/api/ecommerce/banners`):**
```
POST   /api/ecommerce/banners         ← crear (201)
PUT    /api/ecommerce/banners/{id}    ← actualizar
GET    /api/ecommerce/banners/{id}    ← obtener
GET    /api/ecommerce/banners         ← listar todos
DELETE /api/ecommerce/banners/{id}    ← eliminar
```
> Los banners públicos se acceden via `GET /api/public/banners` (filtrado activo=true, ordenado por orden ASC)

---

### A.9 — EcommerceCheckoutController

**Endpoint:** `POST /api/ecommerce/checkout` (requiere JWT tipo=CLIENTE)

**DTOs en `model/dto/ecommerce/checkout/`:**

| DTO | Campos |
|-----|--------|
| `CheckoutRequest` | metodoPagoId(@NotBlank), tipoEntrega(@NotNull TipoEntregaPedido), direccionEntrega?, cuponId? |
| `CheckoutResponse` | pedidoId, numeroPedido, subtotal, descuento, costoEnvio, total, estado(EstadoPedido) |

**Nuevo método en `LoteRepository`:**
```java
@Query("SELECT l FROM Lote l WHERE l.presentacionProducto.id = :presentacionProductoId " +
       "AND l.estado = 'DISPONIBLE' AND l.stockLote > 0 ORDER BY l.fechaVencimiento ASC NULLS LAST")
List<Lote> findLotesDisponiblesPorPresentacionFEFO(@Param("presentacionProductoId") String id);
```

**Lógica `EcommerceCheckoutServiceImpl.realizarCheckout()`:**
1. Busca `CuentaEcommerce` por email del JWT → verifica `activo=true`
2. Busca `Carrito` con estado `ACTIVO` para el cliente
3. Verifica que el carrito tenga al menos 1 detalle
4. Obtiene `MetodoPago` por id
5. Obtiene primer `Usuario` con estado `ACTIVO` como vendedor "sistema"
6. Calcula `subtotal` sumando `detalle.precioUnitario × detalle.cantidad`
7. Si `cuponId` presente: verifica cupon y calcula `descuento`; si `envioGratis` → `costoEnvio=0`
8. `costoEnvio = tipoEntrega=DELIVERY && !envioGratis ? 10.0 : 0.0`
9. Crea `Pedido`: canal=`ECOMMERCE`, prioridad=`NORMAL`, igv=`ZERO`, estado=`NUEVO`, estadoPago=`PENDIENTE`
10. Por cada `DetalleCarrito`: selecciona lotes por FEFO, crea `DetallePedido`
11. Marca carrito → `PROCESADO`; incrementa `cupon.usosActuales`
12. Número de pedido: `"ECO-" + año + "-" + UUID.substring(0,6).toUpperCase()`

---

## Fase B — React Shop: Setup base

> **Directorio:** `naturins-shop/`  
> **Objetivo:** Crear el proyecto Vite + React con todas las dependencias y configuración base.

### B.1 — Dependencias

```json
{
  "react": "^19",
  "react-dom": "^19",
  "react-router-dom": "^7",
  "@tanstack/react-query": "^5",
  "zustand": "^5",
  "axios": "^1",
  "react-hook-form": "^7",
  "zod": "^3",
  "@hookform/resolvers": "^3",
  "sonner": "^1",
  "@fortawesome/react-fontawesome": "^0.2",
  "@fortawesome/free-solid-svg-icons": "^6",
  "@fortawesome/free-regular-svg-icons": "^6"
}
```

### B.2 — Paleta de colores Tailwind

| Token | Valor | Uso |
|-------|-------|-----|
| brown | `#733702` | Textos principales, hover |
| orange | `#F1860B` | CTA primario, acentos |
| yellow | `#F2B707` | Destacados |
| green | `#98C01E` | Éxito, ecológico |
| cream | `#FDF6E3` | Fondo general |

### B.3 — Estructura de carpetas

```
naturins-shop/src/
├── api/              ← funciones axios por recurso
├── components/
│   ├── layout/       ← Header, Footer, MiniCart
│   └── ui/           ← EmptyState, etc.
├── data/             ← datos estáticos (blog)
├── pages/            ← una carpeta por página
├── router/           ← AppRouter.tsx
└── store/            ← Zustand stores
    ├── authStore.ts  ← persist "naturins-auth"
    └── cartStore.ts  ← persist "naturins-cart"
```

### B.4 — Stores Zustand

**`authStore.ts`** (persist `"naturins-auth"`):
```typescript
interface AuthStore {
  usuario: { nombre: string; email: string; clienteId: string } | null;
  token: string | null;
  isAuthenticated: () => boolean;
  login: (usuario, token) => void;
  logout: () => void;
}
```

**`cartStore.ts`** (persist `"naturins-cart"`):
```typescript
interface CartStore {
  items: CartItem[];        // CartItem: presentacionId, nombreProducto, nombre, precio, cantidad, stockDisponible, imagen?
  agregar: (item) => void;  // si ya existe, incrementa cantidad
  quitar: (presentacionId) => void;
  setCantidad: (presentacionId, cantidad) => void;  // quita si cantidad <= 0
  vaciar: () => void;
  totalItems: () => number;
  total: () => number;
}
```

### B.5 — API client (axios)

```typescript
// src/api/client.ts
import axios from 'axios';
export const api = axios.create({ baseURL: 'http://localhost:8080/api' });
// interceptor: agrega Authorization: Bearer <token> del authStore
// interceptor: ante 401 → logout + redirect /login
```

---

## Fase C — React Shop: Páginas core

> **Objetivo:** Implementar las páginas de navegación, catálogo y autenticación básica.

### C.1 — Layout (Header + Footer)

**`Header.tsx`:**
- Logo + nav desktop: Inicio / Productos / Blog / Nosotros
- Buscador inline (navega a `/productos?q=...`)
- Carrito con badge de cantidad → abre MiniCart
- Auth: si logueado → link "Nombre" a `/mi-cuenta` + botón logout; si no → "Ingresar"
- Menú hamburguesa mobile con los mismos items + Mi cuenta / Mis pedidos

**`MiniCart.tsx`:** overlay lateral con items del carrito, subtotal, botón "Ver carrito"

### C.2 — Home

**`Home.tsx`:**
- Hero con imagen de fondo y CTA "Ver productos"
- Sección banners: carousel de `GET /api/public/banners` (activo=true)
- Sección productos destacados: primeros 8 de `GET /api/public/productos`
- Sección propuesta de valor (iconos: 100% Natural, Sin Gluten, etc.)

### C.3 — Catálogo de Productos

**`Productos.tsx`:**
- `GET /api/public/productos` con TanStack Query (staleTime: 5 min)
- `GET /api/public/categorias` para filtros
- Filtros: categoría (select), búsqueda (input con debounce), sin stock (hide/show)
- Grid responsivo: 2 cols mobile / 3 cols md / 4 cols lg
- ProductCard: imagen, nombre, categoría badge, precio desde, botón "Ver"
- Leer `?q=` del querystring para búsqueda inicial desde el header

### C.4 — Detalle de Producto

**`ProductoDetalle.tsx`:**
- `GET /api/public/productos/:id`
- Imagen principal + info: nombre, descripción, categoría
- Selector de presentación (radio/select): muestra precio y stock
- Control de cantidad (min=1, max=stockDisponible)
- Botón "Agregar al carrito" → `cartStore.agregar(...)` → toast sonner
- Botón "Ir al carrito" si ya en carrito

### C.5 — Carrito

**`Carrito.tsx`:**
- Lista de items con imagen, nombre, presentación, precio, controles +/−/🗑
- Resumen con totales
- Botón "Ir al checkout" si `isAuthenticated()` → `/checkout`; si no → `/login`
- Botón "Vaciar carrito"
- `EmptyState` si carrito vacío

### C.6 — Login + Registro

**`Login.tsx`:**
- Form: email + password
- `POST /api/ecommerce/auth/login` → guarda en `authStore` → redirect `/checkout` o `/`
- Link a `/registro`

**`Registro.tsx`:**
- Form: nombre, email, teléfono, password, confirmar password
- `POST /api/ecommerce/auth/registro`
- Validación con zod + react-hook-form
- Toast éxito → redirect `/login`

### C.7 — Páginas estáticas

**`Nosotros.tsx`:** Historia, misión, valores, equipo.  
**`Contacto.tsx`:** Form de contacto (nombre, email, mensaje) — solo UI, no backend.

---

## Fase D — React Shop: Páginas avanzadas

> **Objetivo:** Checkout completo, área de cliente, blog.

### D.1 — Checkout

**Archivo:** `src/api/checkout.api.ts`
```typescript
export const listarMetodosPago = (): Promise<MetodoPagoResponse[]>
export const validarCupon = (req: ValidarCuponRequest): Promise<ValidarCuponResponse>
export const realizar = (req: CheckoutRequest): Promise<CheckoutResponse>
// CheckoutRequest: metodoPagoId, tipoEntrega, direccionEntrega?, cuponId?
// CheckoutResponse: pedidoId, numeroPedido, subtotal, descuento, costoEnvio, total, estado
```

**`Checkout.tsx`:**
- Guard: si no autenticado → redirect `/login?redirect=/checkout`
- Carga `GET /api/metodos-pago` al montar
- Form con zod: tipoEntrega (RECOJO/DELIVERY), metodoPagoId, direccionEntrega (required si DELIVERY)
- Sección cupón: input código → botón "Aplicar" → `validarCupon()` → muestra descuento
- Resumen en tiempo real:
  - `subtotal` = cartStore.total()
  - `descuento` = cuponAplicado?.descuento ?? 0
  - `costoEnvio` = tipoEntrega=DELIVERY && !envioGratis ? 10 : 0
  - `totalFinal` = subtotal - descuento + costoEnvio
- Submit: `checkoutApi.realizar()` → `cartStore.vaciar()` → navigate `/pedido-confirmado/:num` con state
- Errores: toast sonner con `error.response?.data?.message`

**`PedidoConfirmado.tsx`:**
- Lee `useParams` (numeroPedido) + `useLocation().state` (CheckoutResponse)
- Card de éxito con numero, total, estado
- Botones: "Ver mis pedidos" → `/mis-pedidos` y "Seguir comprando" → `/`

### D.2 — Mi Cuenta

**Archivo:** `src/pages/MiCuenta.tsx`
- Guard: si no autenticado → redirect `/login`
- Avatar circular con inicial del nombre
- Muestra: nombre, email, teléfono del `authStore.usuario`
- Link "Ver mis pedidos"
- Botón "Cerrar sesión" → `authStore.logout()` → navigate `/`

### D.3 — Mis Pedidos

**Archivo:** `src/api/pedido.api.ts`
```typescript
export interface PedidoClienteResponse {
  id: string; numeroPedido: string; total: number;
  estado: string; estadoPago: string; fechaCreacion: string;
}
export const listarPorCliente = (clienteId: string): Promise<PedidoClienteResponse[]>
// GET /api/pedidos/por-cliente/:clienteId
```

**`MisPedidos.tsx`:**
- Guard: si no autenticado → redirect `/login`
- Carga pedidos del cliente logueado
- Tabla/cards con: numeroPedido, fecha, total, badge estado, badge estadoPago
- Mapa de colores por estado:
  ```typescript
  const ESTADO_INFO = {
    NUEVO: { label: 'Nuevo', color: 'bg-blue-100 text-blue-700' },
    CONFIRMADO: { label: 'Confirmado', color: 'bg-indigo-100 text-indigo-700' },
    EN_PREPARACION: { label: 'En preparación', color: 'bg-yellow-100 text-yellow-700' },
    ENTREGADO: { label: 'Entregado', color: 'bg-green-100 text-green-700' },
    CANCELADO: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
    // ...
  }
  ```
- `EmptyState` si sin pedidos

### D.4 — Blog

**Archivo:** `src/data/blog.ts`
```typescript
export interface ArticuloBlog {
  id: number; slug: string; titulo: string; resumen: string;
  contenido: string;  // pseudo-markdown: ## headers, **bold**, - listas
  categoria: string; imagen: string;
  fechaPublicacion: string; tiempoLectura: number;
}
export const articulos: ArticuloBlog[]  // 4 artículos estáticos
export function getArticuloPorSlug(slug: string): ArticuloBlog | undefined
```

**Artículos incluidos:**
1. "5 beneficios de los snacks naturales" (Salud)
2. "Quinua: el superalimento peruano" (Ingredientes)
3. "Snacks saludables para la oficina" (Tips)
4. "Cómo leer las etiquetas nutricionales" (Educación)

**`Blog.tsx`:**
- Primer artículo como card destacada horizontal (imagen grande + texto)
- Resto en grid 3 columnas
- Badge de categoría con color por tipo
- Links a `/blog/:slug`

**`BlogArticulo.tsx`:**
- `useParams({ slug })` → `getArticuloPorSlug()` → si no existe → `<Navigate to="/blog" />`
- Renderizador pseudo-markdown:
  - `## texto` → `<h2>`
  - `**texto**` / `*texto*` → bold/italic con `dangerouslySetInnerHTML` + regex
  - `- item` → `<ul><li>`
  - resto → `<p>`
- CTA box al final → link a `/productos`
- Sección "También te puede interesar" con 2 artículos relacionados

---

## Fase E — Angular ERP: Módulo E-commerce

> **Objetivo:** Panel de administración del canal web dentro del ERP Angular.  
> **Directorio:** `naturins-erp-frontend/src/app/features/ecommerce/`

### E.1 — Modelos, Servicios y Rutas

**Modelos en `features/ecommerce/models/`:**

`banner.model.ts`:
```typescript
export interface BannerResponse { id: string; titulo: string; subtitulo?: string; urlImagen: string; urlDestino?: string; orden: number; activo: boolean; }
export interface CreateBannerRequest { titulo: string; subtitulo?: string; urlImagen: string; urlDestino?: string; orden: number; }
export interface UpdateBannerRequest { titulo?: string; subtitulo?: string; urlImagen?: string; urlDestino?: string; orden?: number; activo?: boolean; }
```

`cupon.model.ts`:
```typescript
export type TipoCupon = 'PORCENTAJE' | 'MONTO_FIJO' | 'ENVIO_GRATIS';
export type EstadoCupon = 'ACTIVO' | 'INACTIVO' | 'VENCIDO' | 'AGOTADO';
export interface CuponResponse { id: string; codigo: string; tipo: TipoCupon; valor: number; fechaInicio: string; fechaFin: string; usosMaximos?: number; usosActuales: number; montoMinimo?: number; estado: EstadoCupon; }
export interface CreateCuponRequest { codigo: string; tipo: TipoCupon; valor: number; fechaInicio: string; fechaFin: string; usosMaximos?: number; montoMinimo?: number; }
export interface UpdateCuponRequest { tipo?: TipoCupon; valor?: number; fechaInicio?: string; fechaFin?: string; usosMaximos?: number; montoMinimo?: number; estado?: EstadoCupon; }
```

**Servicios en `features/ecommerce/services/`:**

`banner.service.ts`: `listar()`, `crear(req)`, `actualizar(id, req)`, `eliminar(id)` → `${apiUrl}/ecommerce/banners`

`cupon.service.ts`: `listar()`, `crear(req)`, `actualizar(id, req)`, `eliminar(id)` → `${apiUrl}/ecommerce/cupones`

**`ecommerce.routes.ts`** (5 rutas lazy bajo `MainLayout`):
```typescript
{ path: 'ecommerce',            loadComponent: EcommerceOverview  },
{ path: 'ecommerce/productos',  loadComponent: EcommerceProductos },
{ path: 'ecommerce/banners',    loadComponent: EcommerceBanners   },
{ path: 'ecommerce/cupones',    loadComponent: EcommerceCupones   },
{ path: 'ecommerce/pedidos',    loadComponent: EcommercePedidos   },
```

**Cambios en `app.routes.ts`:** `...ECOMMERCE_ROUTES` en children de `MainLayout`

**Cambios en `sidebar.ts`:** nueva sección "E-COMMERCE" con 5 ítems de navegación

---

### E.2 — Catálogo Web (ecommerce-productos)

**`ecommerce-productos.ts` / `.html`:**
- Usa `ProductoService` del módulo inventario (reutiliza `GET /api/productos`)
- Lista todos los productos con columnas: imagen, nombre, `nombreCategoria`, estado, visible en tienda
- Toggle switch por producto: `toggleVisible(p)` → `productoSvc.actualizar(p.id, { visibleEcommerce: !p.visibleEcommerce })`
- Búsqueda por nombre con `debouncedSignal`
- `EmptyState` si sin resultados

> **Nota importante:** el campo es `p.nombreCategoria` (no `p.categoria`)

---

### E.3 — Banners (ecommerce-banners)

**`ecommerce-banners.ts` / `.html`:**
- Grid de cards con: imagen preview, título, subtítulo, orden, badge activo/inactivo
- Modal CRUD (crear/editar): campos titulo, subtitulo, urlImagen, urlDestino, orden
- Toggle activo/inactivo en cada card: `svc.actualizar(b.id, { activo: !b.activo })`
- Botón eliminar con `ConfirmDialogComponent`
- Ordenar por `orden ASC`

---

### E.4 — Cupones (ecommerce-cupones)

**`ecommerce-cupones.ts` / `.html`:**
- Tabla con columnas: código, tipo, valor/descripción, fechas, usos (actuales/máximos), estado
- Modal CRUD con select de tipo (`TipoCupon`): PORCENTAJE / MONTO_FIJO / ENVIO_GRATIS
- Al editar: campo `codigo` deshabilitado (inmutable)
- Badge de estado con colores: ACTIVO=verde, INACTIVO=gris, VENCIDO=rojo, AGOTADO=naranja
- Acceso al endpoint público de validar cupón desde la tabla para pruebas

---

### E.5 — Pedidos Web (ecommerce-pedidos)

**`ecommerce-pedidos.ts` / `.html`:**
- Reutiliza `PedidoService` del módulo ventas (`GET /api/pedidos`)
- Filtra en el frontend: `pedidos().filter(p => p.canal === 'ECOMMERCE')`
- Columnas: numeroPedido, cliente, fecha, total, estado, estadoPago
- Acciones rápidas: "Avanzar estado" (`PUT /{id}/confirmar` o siguiente), "Cancelar"
- Modal de detalle del pedido con items del carrito
- Filtro por estado para buscar pedidos web específicos

---

### E.6 — Overview E-commerce (ecommerce-overview)

**`ecommerce-overview.ts` / `.html`:**
- KPIs (datos de los servicios existentes):
  - Total pedidos web (canal=ECOMMERCE)
  - Ventas web del mes (suma totales de pedidos ECOMMERCE del mes)
  - Cupones activos (`cupones.filter(c => c.estado === 'ACTIVO').length`)
  - Banners activos (`banners.filter(b => b.activo).length`)
- Distribución de pedidos web por estado (mini tabla o chips)
- Cards de acceso rápido a las 4 sub-secciones del módulo

---

## Rutas completas del sistema

### Backend (`http://localhost:8080`)

| Prefijo | Auth | Descripción |
|---------|------|-------------|
| `/api/public/**` | ninguna | Catálogo público para la tienda |
| `/api/ecommerce/auth/**` | ninguna | Registro/login de clientes |
| `/api/ecommerce/checkout` | JWT tipo=CLIENTE | Realizar pedido desde tienda |
| `/api/ecommerce/cupones/**` | JWT ERP | Gestión de cupones (admin) |
| `/api/ecommerce/banners/**` | JWT ERP | Gestión de banners (admin) |
| `/api/**` | JWT ERP | Todo el resto del ERP |

### React Shop (`http://localhost:5173`)

| Ruta | Página | Auth |
|------|--------|------|
| `/` | Home | no |
| `/productos` | Catálogo | no |
| `/producto/:id` | Detalle | no |
| `/carrito` | Carrito | no |
| `/checkout` | Checkout | sí (CLIENTE) |
| `/pedido-confirmado/:num` | Confirmación | no |
| `/login` | Login | no |
| `/registro` | Registro | no |
| `/mi-cuenta` | Mi Cuenta | sí (CLIENTE) |
| `/mis-pedidos` | Mis Pedidos | sí (CLIENTE) |
| `/blog` | Blog | no |
| `/blog/:slug` | Artículo | no |
| `/nosotros` | Nosotros | no |
| `/contacto` | Contacto | no |

### Angular ERP — Módulo E-commerce

| Ruta | Página |
|------|--------|
| `/ecommerce` | Overview / KPIs |
| `/ecommerce/productos` | Catálogo Web (toggle visibleEcommerce) |
| `/ecommerce/banners` | Gestión de Banners |
| `/ecommerce/cupones` | Gestión de Cupones |
| `/ecommerce/pedidos` | Pedidos Web (canal=ECOMMERCE) |

---

## Reglas de negocio clave

### Productos en tienda
- `visibleEcommerce=true` AND `activo=true` → aparece en tienda
- `stockDisponible` = suma de `stockLote` de lotes `DISPONIBLE` en tiempo real
- Si `stockDisponible=0` → se puede mostrar como "Sin stock" o ocultar

### Cupones
- `codigo` siempre en MAYÚSCULAS al guardar
- Validación secuencial: ACTIVO → fechas → usos → monto mínimo
- `usosActuales` se incrementa al completar el checkout, no al validar

### Checkout y pedidos web
- Canal: `CanalPedido.ECOMMERCE`
- IGV siempre ZERO (clientes B2C, `aplicaIgv=false`)
- Vendedor: primer `Usuario` con estado=ACTIVO como "vendedor sistema"
- Número de pedido: `"ECO-" + año + "-" + 6 chars UUID`
- Lote seleccionado por FEFO (First Expired First Out) con `NULLS LAST`
- `costoEnvio = DELIVERY && !envioGratis ? 10.0 : 0.0`

---

## Checklist de implementación

```
FASE A — Backend
  [x] A.1 SecurityConfig: CORS :5173, rutas públicas
  [x] A.2 Producto.visibleEcommerce
  [x] A.3 DTOs públicos (ProductoPublicoResponse, PresentacionPublicaResponse, etc.)
  [x] A.4 PublicController (/api/public/productos, /categorias, /banners)
  [x] A.5 CuentaEcommerce + EcommerceAuthController (registro, login, me)
  [x] A.6 Carrito para ecommerce (ya existía en backend)
  [x] A.7 Cupon + CuponController (/api/ecommerce/cupones + /validar)
  [x] A.8 Banner + BannerController (/api/ecommerce/banners)
  [x] A.9 EcommerceCheckoutController + FEFO lote selection

FASE B — React Shop setup
  [x] B.1 Dependencias instaladas
  [x] B.2 Tailwind configurado con paleta de marca
  [x] B.3 Estructura de carpetas creada
  [x] B.4 authStore + cartStore (Zustand persist)
  [x] B.5 API client axios con interceptores

FASE C — React Shop core
  [x] C.1 Header (nav, buscador, carrito, auth) + Footer + MiniCart
  [x] C.2 Home (hero, carousel banners, productos destacados)
  [x] C.3 Productos (catálogo con filtros y búsqueda)
  [x] C.4 ProductoDetalle (presentaciones, agregar al carrito)
  [x] C.5 Carrito (CRUD con Zustand, resumen, checkout button)
  [x] C.6 Login + Registro (auth clientes ecommerce)
  [x] C.7 Nosotros + Contacto

FASE D — React Shop avanzado
  [x] D.1 Checkout.tsx (form, cupón, resumen, submit)
  [x] D.2 PedidoConfirmado.tsx
  [x] D.3 MiCuenta.tsx
  [x] D.4 MisPedidos.tsx + pedido.api.ts
  [x] D.5 Blog.tsx + BlogArticulo.tsx + src/data/blog.ts
  [x] AppRouter.tsx con todas las rutas
  [x] Carrito.tsx → /checkout si autenticado

FASE E — Angular ERP módulo ecommerce
  [x] E.1 ecommerce.routes.ts + banner.model.ts + cupon.model.ts + servicios
  [x] E.2 ecommerce-productos (toggle visibleEcommerce)
  [x] E.3 ecommerce-banners (CRUD con grid de cards)
  [x] E.4 ecommerce-cupones (CRUD con tabla y modal)
  [x] E.5 ecommerce-pedidos (filtro canal=ECOMMERCE, gestión de estados)
  [x] E.6 ecommerce-overview (KPIs + accesos rápidos)
  [x] app.routes.ts + sidebar.ts actualizados
```

---

## Pendientes / mejoras futuras

| # | Mejora | Prioridad |
|---|--------|-----------|
| 1 | Pasarela de pago real (Culqi, Mercado Pago) | Alta |
| 2 | Notificaciones email post-checkout (JavaMailSender / SendGrid) | Media |
| 3 | Galería de imágenes múltiples por producto | Media |
| 4 | Dashboard en tiempo real — pedidos nuevos via polling o WebSocket | Media |
| 5 | SEO / Open Graph en tienda (react-helmet-async) | Baja |
| 6 | Reviews / valoraciones de productos | Baja |
| 7 | Wishlist para clientes | Baja |

---

_Última actualización: 2026-06-29_
