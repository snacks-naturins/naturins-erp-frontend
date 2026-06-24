# Guía de Implementación Frontend — Naturin's ERP

**Versión:** 1.0  
**Última actualización:** 2026-06-23  
**Framework:** Angular 17+ (Standalone Components, Signals)  
**Backend:** Spring Boot 3.x en `http://localhost:8080`

---

## 1. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Angular 17+ (standalone, sin NgModules) |
| Estilos | Tailwind CSS |
| Routing | Angular Router con lazy loading |
| HTTP | `HttpClient` con interceptores JWT |
| Estado global | Angular Signals (`signal`, `computed`, `effect`) |
| Formularios | Reactive Forms (`FormBuilder`, `FormGroup`, `Validators`) |
| Fechas | `@angular/common` pipes (`date`, `currency`) |
| Íconos | Heroicons (SVG inline) o PrimeIcons |
| Notificaciones | Toast/Snackbar propio en `shared/` |
| Entorno | `src/environments/environment.ts` → `apiUrl` |

---

## 2. Arquitectura de Carpetas (estado actual)

```
src/app/
├── core/                          ← Singletons globales ✅
│   ├── guards/auth.guard.ts       ✅
│   ├── interceptors/
│   │   ├── auth.interceptor.ts    ✅  (inyecta Bearer token)
│   │   └── error.interceptor.ts   ✅  (401/403 → /login)
│   ├── models/
│   │   ├── auth.model.ts          ✅
│   │   ├── persona.model.ts       ✅
│   │   └── tipo-documento.model.ts✅
│   └── services/
│       ├── auth.service.ts        ✅
│       ├── token-storage.service.ts ✅
│       ├── persona.service.ts     ✅
│       ├── tipo-documento.service.ts ✅
│       └── upload.service.ts      ✅
│
├── shared/                        ← UI reutilizable (por llenar) ⏳
│   ├── components/                ← spinner, modal, tabla, badge, confirm-dialog
│   ├── pipes/                     ← moneda-sol, estado-badge, fecha-hora
│   └── directives/
│
├── layout/                        ✅ (parcial — falta actualizar sidebar)
│   ├── header/
│   ├── sidebar/
│   └── main-layout/
│
├── features/                      ← Un directorio por dominio de negocio
│   ├── usuarios/                  ✅ (login)
│   ├── inventario/                ✅ archivos, lógica incompleta
│   ├── ventas/                    ✅ solo POS stub
│   ├── compras/                   ⏳ solo routes vacío
│   ├── clientes/                  ✅ stub básico
│   ├── proveedores/               ✅ stub básico
│   └── dashboard/                 ✅ página vacía
│
├── routes/app.routes.ts           ✅ (incompleto)
└── app.config.ts                  ✅
```

---

## 3. Convenciones Globales

### 3.1 Formato de respuesta de error del backend

```typescript
interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}
```

| Código | Qué mostrar en UI |
|--------|------------------|
| `400` | Lista de campos con error de validación |
| `401` | "Sesión expirada. Inicia sesión nuevamente." → redirigir a `/login` |
| `404` | "No se encontró el recurso solicitado." |
| `409` | `error.message` (ej. "Ya existe un almacén con ese nombre") |
| `422` | `error.message` (ej. "Stock insuficiente") |
| `500` | "Error interno del servidor. Intenta más tarde." |

### 3.2 Enumeraciones reutilizables

Crear en `shared/models/enums.model.ts`:

```typescript
export type EstadoGeneral = 'ACTIVO' | 'INACTIVO';
export type EstadoProveedor = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'POTENCIAL';
export type EstadoCliente = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'POTENCIAL';
export type TipoAlmacen = 'PRINCIPAL' | 'PRODUCCION' | 'DISTRIBUCION' | 'TIENDA';
export type EstadoPedido = 'NUEVO' | 'CONFIRMADO' | 'EN_PREPARACION' | 'LISTO_DESPACHO' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO' | 'DEVUELTO';
export type EstadoPagoPedido = 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | 'REEMBOLSADO' | 'VENCIDO';
export type EstadoPago = 'PENDIENTE' | 'EN_PROCESO' | 'CONFIRMADO' | 'RECHAZADO' | 'REEMBOLSADO' | 'VENCIDO';
export type EstadoCotizacion = 'BORRADOR' | 'ENVIADA' | 'ACEPTADA' | 'RECHAZADA' | 'VENCIDA' | 'CONVERTIDA';
export type EstadoCompra = 'PENDIENTE' | 'RECIBIDA_PARCIAL' | 'COMPLETADA' | 'CANCELADA';
export type EstadoProduccion = 'PLANIFICADA' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA' | 'EN_REVISION';
export type EstadoLote = 'DISPONIBLE' | 'EN_CUARENTENA' | 'BLOQUEADO' | 'VENCIDO' | 'AGOTADO' | 'AGOTADO_MERMA';
export type EstadoPasarelaPago = 'ACTIVA' | 'INACTIVA' | 'EN_MANTENIMIENTO';
export type EstadoComprobante = 'EMITIDO' | 'ENVIADO_SUNAT' | 'ACEPTADO' | 'RECHAZADO_SUNAT' | 'ANULADO';
```

### 3.3 Paginación / listados

Todos los `GET /listar` devuelven arrays planos (el backend no usa `Page<T>`). Implementar filtrado y paginación en el frontend con pipes o señales reactivas.

### 3.4 Campos auto-calculados — nunca enviar al backend

Los siguientes campos son calculados por el servidor y **no deben aparecer en los formularios**:

| Entidad | Campos auto |
|---------|------------|
| `Compra` | `numeroOrden`, `fechaCompra`, `subtotal`, `igv`, `total`, `estado` (inicial) |
| `DetalleCompra` | `subTotal` |
| `Produccion` | `numeroOrden`, `costoTotal` (inicial), `estado` (inicial) |
| `Cotizacion` | `numeroCotizacion`, `subTotal`, `igv`, `total`, `estado` (inicial), `usuario` |
| `Pedido` | `numeroPedido`, `subTotal`, `igv`, `total`, `estado` (inicial), `estadoPago` (inicial), `usuarioVendedor` |
| `DetallePedido` | `subtotal` |
| `DetalleCotizacion` | `subtotal` |
| `Pago` | `estado` (inicial PENDIENTE), `fechaPago` |
| `PasarelaPago` | `estado` (inicial ACTIVA) |
| `ComprobantePago` | `subtotal`, `igv`, `total`, `vecesImpreso`, `estado` (inicial) |

---

## 4. Plan de Implementación por Fases

### Resumen de fases

| Fase | Feature | Estado | Prioridad |
|------|---------|--------|-----------|
| **F1** | Core + Layout completo | ✅ parcial | Alta |
| **F2** | Configuración maestros | ⏳ | Alta |
| **F3** | Personas, Proveedores, Clientes | ✅ stub | Alta |
| **F4** | Catálogo (Categorías, Productos, Presentaciones) | ✅ parcial | Alta |
| **F5** | Materias Primas | ⏳ | Alta |
| **F6** | Compras | ⏳ | Media |
| **F7** | Producción + Merma | ⏳ | Media |
| **F8** | Inventario + Lotes | ✅ parcial | Media |
| **F9** | Ventas (Cotizaciones + Pedidos + POS) | ✅ stub | Alta |
| **F10** | Pagos + Facturación | ⏳ | Alta |
| **F11** | Dashboard + Reportes | ✅ vacío | Baja |

---

## 5. F1 — Core + Layout

### Qué completar

1. **Sidebar** (`layout/sidebar/`): añadir todos los módulos con íconos y rutas.
2. **authGuard**: proteger todas las rutas excepto `/login`.
3. **error.interceptor**: mostrar toast según código HTTP.
4. **Shared components mínimos**:
   - `ConfirmDialogComponent` (modal de confirmación para eliminar)
   - `ToastService` + `ToastComponent` (notificaciones)
   - `LoadingSpinnerComponent`
   - `EstadoBadgePipe` (colorea chips según estado)
   - `MonedaSolPipe` (formatea `BigDecimal` como `S/ 1,234.50`)

### Sidebar: estructura de menú sugerida

```
🏠 Dashboard
━━ CONFIGURACIÓN ━━
⚙️  Almacenes
💳  Métodos de Pago
🌐  Pasarelas de Pago
━━ PERSONAS ━━
🏢  Proveedores
👤  Clientes
━━ CATÁLOGO ━━
🗂️  Categorías
📦  Productos
🏷️  Presentaciones
━━ OPERACIONES ━━
🧪  Materias Primas
🛒  Compras
🏭  Producción
📊  Inventario / Lotes
━━ VENTAS ━━
📋  Cotizaciones
📝  Pedidos
🖥️  POS
━━ FINANZAS ━━
💰  Pagos
🧾  Comprobantes
━━ ANÁLISIS ━━
📈  Reportes
```

### Estructura de rutas (app.routes.ts)

```typescript
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/usuarios/pages/login/login') },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', ... },
      ...CONFIGURACION_ROUTES,
      ...PROVEEDORES_ROUTES,
      ...CLIENTES_ROUTES,
      ...INVENTARIO_ROUTES,
      ...COMPRAS_ROUTES,
      ...PRODUCCION_ROUTES,
      ...VENTAS_ROUTES,
      ...PAGOS_ROUTES,
      ...REPORTES_ROUTES,
    ]
  },
  { path: '**', redirectTo: 'login' }
];
```

---

## 6. F2 — Configuración Maestros

### Feature: `features/configuracion/`

```
features/configuracion/
├── pages/
│   ├── almacenes/           ← listado + form en modal
│   ├── metodos-pago/        ← listado + form en modal
│   └── pasarelas-pago/      ← listado + form en modal
├── models/
│   ├── almacen.model.ts
│   ├── metodo-pago.model.ts
│   └── pasarela-pago.model.ts
├── services/
│   ├── almacen.service.ts    (ya existe en inventario — mover aquí)
│   ├── metodo-pago.service.ts
│   └── pasarela-pago.service.ts
└── configuracion.routes.ts
```

### 6.1 Almacenes

**Modelo** (`almacen.model.ts`):
```typescript
export interface Almacen {
  id: string;
  codigo?: string;
  nombre: string;
  tipo: 'PRINCIPAL' | 'PRODUCCION' | 'DISTRIBUCION' | 'TIENDA';
  ubicacion?: string;
  telefono?: string;
  capacidadKg?: number;
  responsableId?: string;
  estado: 'ACTIVO' | 'INACTIVO';
  stockOcupadoKg?: number;       // calculado por backend
  porcentajeUso?: number;        // calculado por backend
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateAlmacenRequest {
  nombre: string;
  tipo: string;
  codigo?: string;
  ubicacion?: string;
  telefono?: string;
  capacidadKg?: number;
  responsableId?: string;
}

export interface UpdateAlmacenRequest {
  nombre?: string;
  tipo?: string;
  codigo?: string;
  ubicacion?: string;
  telefono?: string;
  capacidadKg?: number;
  responsableId?: string;
  estado?: string;
}
```

**Endpoints** (`almacen.service.ts`):
```typescript
// GET  /api/almacenes
// POST /api/almacenes
// GET  /api/almacenes/{id}
// PUT  /api/almacenes/{id}
// DELETE /api/almacenes/{id}
// GET  /api/almacenes/por-estado/{estado}
// GET  /api/almacenes/por-tipo/{tipo}
```

**Página `almacenes.ts`**: tabla con `nombre`, `tipo`, `ubicacion`, barra de uso (`porcentajeUso`%), `estado` badge. Formulario en modal lateral. Botón desactivar (PUT con estado INACTIVO).

### 6.2 Métodos de Pago

**Modelo** (`metodo-pago.model.ts`):
```typescript
export interface MetodoPago {
  id: string;
  nombre: string;
  estado: 'ACTIVO' | 'INACTIVO';
}
export interface CreateMetodoPagoRequest { nombre: string; }
export interface UpdateMetodoPagoRequest { nombre?: string; estado?: string; }
```

**Endpoints**: `GET/POST/PUT/DELETE /api/metodos-pago`, `GET /api/metodos-pago/por-estado/{estado}`

**Regla UI**: antes de DELETE mostrar confirm-dialog. Si el servidor responde 500 con FK violation, mostrar "Este método tiene pagos asociados; desactívalo en lugar de eliminarlo".

### 6.3 Pasarelas de Pago

**Modelo** (`pasarela-pago.model.ts`):
```typescript
export interface PasarelaPago {
  id: string;
  nombre: string;
  estado: 'ACTIVA' | 'INACTIVA' | 'EN_MANTENIMIENTO';
}
export interface CreatePasarelaPagoRequest { nombre: string; }
export interface UpdatePasarelaPagoRequest { nombre?: string; estado?: string; }
```

**Endpoints**: `GET/POST/PUT/DELETE /api/pasarelas-pago`, `GET /api/pasarelas-pago/por-estado/{estado}`

**Regla UI**: no se puede eliminar si `estado = ACTIVA` (el backend devuelve 422 — mostrar el mensaje).

---

## 7. F3 — Personas, Proveedores, Clientes

### 7.1 Personas (core)

Ya existe `core/models/persona.model.ts` y `core/services/persona.service.ts`.

**Modelo** (verificar/completar):
```typescript
export interface Persona {
  id: string;
  nombres: string;
  apellidos: string;
  tipoDocumentoId: string;
  numeroDocumento: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}
```

**Endpoints usados**: `POST /api/personas`, `GET /api/personas/{id}`, `PUT /api/personas/{id}`

### 7.2 Proveedores

**Feature**: `features/proveedores/` (ya existe stub)

**Modelos**:
```typescript
export interface Proveedor {
  id: string;
  personaId: string;
  nombrePersona?: string;         // campo plano del response
  ruc?: string;
  razonSocial?: string;
  contacto?: string;
  diasCredito?: number;
  rubro?: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'POTENCIAL';
}

export interface ProveedorProducto {
  id: string;
  proveedorId: string;
  presentacionProductoId: string;
  nombrePresentacion?: string;
  precioCompra: number;
  tiempoEntregaDias?: number;
  cantidadMinimaCompra?: number;
  esPrincipal: boolean;
  observacion?: string;
  estado: 'ACTIVO' | 'INACTIVO';
}
```

**Páginas**:
- `proveedores-list.ts`: tabla con nombre/RUC/estado/rubro. Búsqueda por nombre.
- `proveedor-detalle.ts` (o tab): datos del proveedor + sub-tabla del catálogo.

**Endpoints**:
```
GET  /api/proveedores
POST /api/proveedores
GET  /api/proveedores/{id}
PUT  /api/proveedores/{id}
DELETE /api/proveedores/{id}          ← baja lógica (INACTIVO)
GET  /api/proveedores/por-estado/{estado}
POST /api/proveedores/{id}/catalogo
GET  /api/proveedores/{id}/catalogo
PUT  /api/proveedores/{id}/catalogo/{catalogoId}
DELETE /api/proveedores/{id}/catalogo/{catalogoId}
```

### 7.3 Clientes

**Feature**: `features/clientes/` (ya existe stub)

**Modelo**:
```typescript
export interface Cliente {
  id: string;
  personaId: string;
  nombrePersona?: string;
  tipoCliente: 'PERSONA' | 'EMPRESA';
  razonSocial?: string;
  ruc?: string;
  aplicaIgv: boolean;
  limiteCredito?: number;
  descuentoPreferencial?: number;
  estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'POTENCIAL';
}
```

**Páginas**: `clientes-list.ts` + búsqueda por nombre/documento.

**Endpoints**:
```
GET  /api/clientes
POST /api/clientes
GET  /api/clientes/{id}
PUT  /api/clientes/{id}
DELETE /api/clientes/{id}             ← baja lógica (INACTIVO)
GET  /api/clientes/por-estado/{estado}
```

---

## 8. F4 — Catálogo de Productos

### Feature: `features/inventario/` (ampliar estructura existente)

```
inventario/
├── pages/
│   ├── categorias/            ← listado simple (CRUD básico)
│   ├── products-list/         ✅ completar
│   ├── product-form/          ✅ completar
│   ├── presentaciones/        ✅ completar
│   ├── codigos-barras/        ← nuevo
│   ├── combos/                ← nuevo
│   ├── almacenes/             ← mover a configuracion
│   ├── lotes/                 ✅ completar
│   └── kardex/                ✅ completar
```

### 8.1 Categorías

**Modelo**:
```typescript
export interface Categoria {
  id: string;
  nombre: string;
  colorInterfaz?: string;
  estado: 'ACTIVO' | 'INACTIVO';
}
```

**Endpoints**: `GET/POST /api/categorias`, `GET /api/categorias/{id}`

**UI**: tabla sencilla, formulario inline o modal. Sin DELETE (diseño del backend).

### 8.2 Productos

**Modelo** (completar el existente):
```typescript
export interface Producto {
  id: string;
  categoriaId: string;
  nombreCategoria?: string;
  nombre: string;
  descripcion?: string;
  urlImagen?: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'DESCONTINUADO';
}
```

**Páginas**:
- `products-list.ts`: tabla con imagen miniatura, nombre, categoría, estado. Filtro por categoría y estado.
- `product-form.ts`: formulario con upload de imagen (`/api/upload`) y selector de categoría.

**Endpoints**:
```
GET  /api/productos
POST /api/productos
GET  /api/productos/{id}
PUT  /api/productos/{id}
DELETE /api/productos/{id}            ← soft delete (INACTIVO)
GET  /api/productos/por-categoria/{categoriaId}
GET  /api/productos/por-estado/{estado}
GET  /api/productos/buscar?termino=
```

### 8.3 Presentaciones

**Modelo** (completar el existente):
```typescript
export interface PresentacionProducto {
  id: string;
  productoId: string;
  nombreProducto?: string;
  nombre: string;
  factorConversion: number;
  precioVenta: number;
  peso?: number;                     // en KG
  unidadMedida?: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'DESCONTINUADO' | 'PROXIMAMENTE';
}
```

**Endpoints**:
```
GET  /api/presentaciones-producto
POST /api/presentaciones-producto
PUT  /api/presentaciones-producto/{id}
DELETE /api/presentaciones-producto/{id}
GET  /api/presentaciones-producto/por-producto/{productoId}
GET  /api/presentaciones-producto/buscar?termino=
```

**UI**: mostrar como sub-tabla dentro de la vista de detalle del producto.

---

## 9. F5 — Materias Primas

### Feature: `features/materias-primas/`

```
materias-primas/
├── pages/
│   ├── materias-lista/        ← tabla + form
│   └── movimientos-materia/   ← kardex de materia prima
├── models/
│   ├── materia-prima.model.ts
│   └── movimiento-materia.model.ts
├── services/
│   ├── materia-prima.service.ts
│   └── movimiento-materia.service.ts
└── materias-primas.routes.ts
```

**Modelos**:
```typescript
export interface MateriaPrima {
  id: string;
  nombre: string;
  unidadMedida: string;
  costoUnitario: number;
  stock: number;                // solo lectura
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface MovimientoMateria {
  id: string;
  materiaPrimaId: string;
  nombreMateriaPrima?: string;
  usuarioId?: string;
  tipo: 'ENTRADA' | 'SALIDA_PRODUCCION' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' | 'DEVOLUCION';
  cantidad: number;
  precioUnitario: number;
  descripcion?: string;
  referenciaId?: string;
  tipoReferencia?: string;
  fechaCreacion: string;
}
```

**Páginas**:
- `materias-lista.ts`: tabla con nombre, unidad, `stock` (solo lectura), costo. Botón "+ Movimiento" abre modal con tipo (ENTRADA, AJUSTE_+/-).
- `movimientos-materia.ts`: kardex de una materia prima por ID; tabla cronológica inmutable.

**Reglas UI**:
- El campo `stock` nunca aparece en el formulario de creación/edición.
- Movimientos `PUT` y `DELETE` devuelven `405` — no mostrar botones de editar/eliminar.
- Si `SALIDA_PRODUCCION` o `AJUSTE_NEGATIVO` resultan en stock negativo, el backend devuelve `422` — mostrar mensaje.

**Endpoints**:
```
GET  /api/materia-prima
POST /api/materia-prima
GET  /api/materia-prima/{id}
PUT  /api/materia-prima/{id}
DELETE /api/materia-prima/{id}
GET  /api/materia-prima/por-estado/{estado}
GET  /api/materia-prima/buscar?nombre=

POST /api/movimientos-materia
GET  /api/movimientos-materia
GET  /api/movimientos-materia/{id}
GET  /api/movimientos-materia/por-materia/{materiaPrimaId}
```

---

## 10. F6 — Compras

### Feature: `features/compras/`

```
compras/
├── pages/
│   ├── compras-lista/         ← listado de OC con filtros
│   └── compra-detalle/        ← OC + ítems inline + botón recibir
├── models/
│   ├── compra.model.ts
│   └── detalle-compra.model.ts
├── services/
│   ├── compra.service.ts
│   └── detalle-compra.service.ts
└── compras.routes.ts
```

**Modelos**:
```typescript
export interface Compra {
  id: string;
  numeroOrden: string;           // auto: OC-00001
  proveedorId: string;
  nombreProveedor?: string;
  usuarioId?: string;
  fechaCompra: string;           // auto
  estado: 'PENDIENTE' | 'RECIBIDA_PARCIAL' | 'COMPLETADA' | 'CANCELADA';
  subtotal: number;              // auto
  igv: number;                   // auto
  total: number;                 // auto
  observacion?: string;
}

export interface DetalleCompra {
  id: string;
  compraId: string;
  materiaPrimaId: string;
  nombreMateriaPrima?: string;
  cantidad: number;
  precioCompra: number;
  subTotal: number;              // auto
}
```

**Flujo de pantallas**:

```
[compras-lista] → Nueva OC: solo pide proveedorId + observacion
                 → Click en OC → [compra-detalle]

[compra-detalle]:
  ┌─────────────────────────────────────┐
  │ OC-00001  |  Proveedor: Frutos SAC  │
  │ Estado: PENDIENTE   Total: S/ 1,917 │
  │ [+ Agregar ítem]  [✓ Recibir todo]  │
  ├─────────────────────────────────────┤
  │ Maní 50kg  @ S/8.50  = S/ 425.00 🗑 │
  │ Almendras 20kg @ S/42 = S/ 840.00 🗑│
  └─────────────────────────────────────┘
```

**Reglas UI**:
- `numeroOrden`, `fechaCompra`, `subtotal`, `igv`, `total` son **solo lectura**.
- Agregar/editar/eliminar ítems solo si `estado = PENDIENTE`.
- Botón "Recibir mercancía" (`PUT /api/compras/{id}/recibir`) solo si `estado = PENDIENTE` y hay al menos 1 ítem.
- Tras recibir, mostrar confirmación y actualizar estado a `COMPLETADA`.
- Cancelar OC: soft delete (estado → CANCELADA).

**Endpoints**:
```
POST   /api/compras
GET    /api/compras
GET    /api/compras/{id}
PUT    /api/compras/{id}
DELETE /api/compras/{id}              ← estado → CANCELADA
GET    /api/compras/por-estado/{estado}
GET    /api/compras/por-proveedor/{proveedorId}
PUT    /api/compras/{id}/recibir

POST   /api/detalle-compra
GET    /api/detalle-compra/{id}
PUT    /api/detalle-compra/{id}
DELETE /api/detalle-compra/{id}
GET    /api/detalle-compra/por-compra/{compraId}
```

---

## 11. F7 — Producción + Merma

### Feature: `features/produccion/`

```
produccion/
├── pages/
│   ├── produccion-lista/      ← listado de órdenes
│   └── produccion-detalle/    ← orden + insumos + detalles + botón completar
├── models/
│   ├── produccion.model.ts
│   ├── detalle-produccion.model.ts
│   ├── insumo-produccion.model.ts
│   └── merma.model.ts
├── services/
│   ├── produccion.service.ts
│   ├── detalle-produccion.service.ts
│   ├── insumo-produccion.service.ts
│   └── merma.service.ts
└── produccion.routes.ts
```

**Modelos clave**:
```typescript
export interface Produccion {
  id: string;
  numeroOrden: string;           // auto: OP-00001
  usuarioId?: string;
  fechaProduccion: string;
  costoTotal: number;            // auto (0 al crear)
  observacion?: string;
  estado: 'PLANIFICADA' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA' | 'EN_REVISION';
}

export interface DetalleProduccion {
  id: string;
  produccionId: string;
  presentacionProductoId: string;
  nombrePresentacion?: string;
  cantidadProducida: number;
  costoUnitario?: number;        // se fija al completar
}

export interface InsumoProduccion {
  id: string;
  produccionId: string;
  materiaPrimaId: string;
  nombreMateriaPrima?: string;
  cantidadUsada: number;
  costoUnitario: number;
}

export interface Merma {
  id: string;
  loteId: string;
  tipo: string;
  cantidad: number;
  observacion?: string;
  fechaCreacion: string;         // inmutable
}
```

**Flujo de pantalla `produccion-detalle`**:

```
[Header]  OP-00001 | Estado: PLANIFICADA | Costo total: S/ 0.00
          [EN PROCESO]  [COMPLETAR]  [CANCELAR]

[Tab: Salidas (Detalles)]   → qué producto se va a producir y cuánto
  + Agregar: presentacionProductoId, cantidadProducida

[Tab: Entradas (Insumos)]   → qué insumos se consumen
  + Agregar: materiaPrimaId, cantidadUsada, costoUnitario

[Tab: Mermas] (solo tras completar, asociadas al lote generado)
```

**Reglas UI**:
- Solo editar detalles/insumos si `estado = PLANIFICADA`.
- `PUT /{id}/completar` requiere al menos 1 insumo y 1 detalle.
- Tras completar, el backend crea lotes automáticamente — mostrar alerta de éxito.
- Merma: no hay botón editar (405); solo crear y eliminar.

**Endpoints**:
```
POST   /api/produccion
GET    /api/produccion
GET    /api/produccion/{id}
PUT    /api/produccion/{id}
DELETE /api/produccion/{id}
GET    /api/produccion/por-estado/{estado}
PUT    /api/produccion/{id}/completar
PUT    /api/produccion/{id}/cancelar

POST/GET/PUT/DELETE /api/detalle-produccion
GET    /api/detalle-produccion/por-produccion/{id}

POST/GET/PUT/DELETE /api/insumo-produccion
GET    /api/insumo-produccion/por-produccion/{id}

POST/GET/DELETE /api/mermas           ← no PUT (405)
GET    /api/mermas/por-lote/{loteId}
GET    /api/mermas/por-tipo/{tipo}
```

---

## 12. F8 — Inventario + Lotes

### Feature: `features/inventario/` (completar estructura existente)

```
inventario/
├── pages/
│   ├── lotes/                 ✅ completar
│   ├── kardex/                ✅ completar
│   ├── movimientos/           ← nuevo (movimientoInventario)
│   └── alertas/               ← nuevo (stockAlerta)
├── models/
│   ├── lote.model.ts          ✅ completar
│   └── movimiento.model.ts    ✅ completar
```

**Modelos**:
```typescript
export interface Lote {
  id: string;
  presentacionProductoId: string;
  nombrePresentacion?: string;
  almacenId: string;
  nombreAlmacen?: string;
  codigoLote: string;
  stockLote: number;
  costoUnitario: number;
  fechaProduccion?: string;
  fechaVencimiento?: string;
  estado: 'DISPONIBLE' | 'EN_CUARENTENA' | 'BLOQUEADO' | 'VENCIDO' | 'AGOTADO' | 'AGOTADO_MERMA';
}

export interface MovimientoInventario {
  id: string;
  loteId: string;
  codigoLote?: string;
  usuarioId?: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' | 'TRANSFERENCIA';
  cantidad: number;
  descripcion?: string;
  referenciaId?: string;
  tipoReferencia?: string;
  fechaCreacion: string;         // inmutable
}
```

**Páginas**:
- `lotes.ts`: tabla con código, presentación, almacén, stock, vencimiento, estado. Resaltar lotes próximos a vencer (< 30 días) en amarillo/rojo.
- `kardex.ts`: seleccionar presentación → mostrar historial de movimientos del inventario. Tabla con fecha, tipo, cantidad, saldo resultante.
- `alertas.ts`: listar `StockAlerta` — presentación, tipo alerta, stock mínimo/crítico, estado.

**Endpoints**:
```
GET  /api/lotes
POST /api/lotes
GET  /api/lotes/{id}
PUT  /api/lotes/{id}
DELETE /api/lotes/{id}
GET  /api/lotes/buscar?codigo=
GET  /api/lotes/por-presentacion/{id}
GET  /api/lotes/por-almacen/{id}
GET  /api/lotes/por-estado/{estado}
GET  /api/lotes/disponibles

POST /api/movimientos-inventario
GET  /api/movimientos-inventario
GET  /api/movimientos-inventario/{id}
GET  /api/movimientos-inventario/por-lote/{loteId}

GET  /api/stock-alerta
POST /api/stock-alerta
GET  /api/stock-alerta/{id}
PUT  /api/stock-alerta/{id}
DELETE /api/stock-alerta/{id}
GET  /api/stock-alerta/por-presentacion/{presentacionId}
```

---

## 13. F9 — Ventas (Cotizaciones + Pedidos + POS)

### Feature: `features/ventas/`

```
ventas/
├── pages/
│   ├── cotizaciones/
│   │   ├── cotizaciones-lista/
│   │   └── cotizacion-detalle/
│   ├── pedidos/
│   │   ├── pedidos-lista/
│   │   └── pedido-detalle/
│   └── pos/                   ✅ completar
├── models/
│   ├── cotizacion.model.ts
│   ├── detalle-cotizacion.model.ts
│   ├── pedido.model.ts
│   └── detalle-pedido.model.ts
├── services/
│   ├── cotizacion.service.ts
│   ├── pedido.service.ts
│   └── detalle-pedido.service.ts
└── ventas.routes.ts
```

### 13.1 Cotizaciones

**Modelos**:
```typescript
export interface Cotizacion {
  id: string;
  numeroCotizacion: string;      // auto: COT-00001
  clienteId: string;
  nombreCliente?: string;
  incluyeIgv: boolean;
  descuento?: number;
  subTotal: number;              // auto
  igv: number;                   // auto
  total: number;                 // auto
  fechaVencimiento?: string;
  estado: 'BORRADOR' | 'ENVIADA' | 'ACEPTADA' | 'RECHAZADA' | 'VENCIDA' | 'CONVERTIDA';
}

export interface DetalleCotizacion {
  id: string;
  cotizacionId: string;
  presentacionProductoId: string;
  nombrePresentacion?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;              // auto
}
```

**Endpoints**:
```
POST   /api/cotizaciones         ← clienteId, incluyeIgv, descuento?, fechaVencimiento?
GET    /api/cotizaciones
GET    /api/cotizaciones/{id}
PUT    /api/cotizaciones/{id}
DELETE /api/cotizaciones/{id}    ← solo si BORRADOR
GET    /api/cotizaciones/por-cliente/{clienteId}
GET    /api/cotizaciones/por-estado/{estado}
PUT    /api/cotizaciones/{id}/enviar
PUT    /api/cotizaciones/{id}/aceptar
PUT    /api/cotizaciones/{id}/rechazar

POST   /api/detalle-cotizacion
PUT    /api/detalle-cotizacion/{id}
DELETE /api/detalle-cotizacion/{id}
GET    /api/detalle-cotizacion/por-cotizacion/{cotizacionId}
```

### 13.2 Pedidos

**Modelos**:
```typescript
export interface Pedido {
  id: string;
  numeroPedido: string;          // auto: ORD-00001
  clienteId: string;
  nombreCliente?: string;
  metodoPagoId: string;
  canal: 'MOSTRADOR' | 'TELEFONO' | 'WEB' | 'DELIVERY' | 'MAYORISTA';
  prioridad: 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE';
  tipoEntrega: 'RETIRO_TIENDA' | 'DELIVERY' | 'COURIER' | 'RECOJO_ALMACEN';
  costoEnvio: number;
  direccionEntrega?: string;
  descuento?: number;
  subTotal: number;              // auto
  igv: number;                   // auto
  total: number;                 // auto
  estado: EstadoPedido;
  estadoPago: EstadoPagoPedido;
}

export interface DetallePedido {
  id: string;
  pedidoId: string;
  presentacionProductoId: string;
  nombrePresentacion?: string;
  loteId?: string;
  precioUnitario: number;
  cantidad: number;
  descuento?: number;
  subtotal: number;              // auto
}
```

**Reglas UI**:
- `subTotal`, `igv`, `total` solo lectura — siempre vienen del servidor.
- Botón "Confirmar" (`PUT /{id}/confirmar`): visible si `estado = NUEVO`.
- Botón "Cancelar" (`PUT /{id}/cancelar`): visible si `estado` no es ENTREGADO ni DEVUELTO.
- Agregar/editar/eliminar detalles solo si `estado = NUEVO` o `CONFIRMADO`.
- Al crear un `DetallePedido`, los totales del pedido se recalculan automáticamente en el servidor → refrescar.

**Endpoints**:
```
POST   /api/pedidos              ← clienteId, metodoPagoId, canal, prioridad, tipoEntrega, costoEnvio, ...
GET    /api/pedidos
GET    /api/pedidos/{id}
PUT    /api/pedidos/{id}
DELETE /api/pedidos/{id}         ← soft: CANCELADO
GET    /api/pedidos/por-cliente/{clienteId}
GET    /api/pedidos/por-estado/{estado}
GET    /api/pedidos/por-estado-pago/{estadoPago}
PUT    /api/pedidos/{id}/confirmar
PUT    /api/pedidos/{id}/cancelar

POST   /api/detalle-pedido
GET    /api/detalle-pedido/{id}
PUT    /api/detalle-pedido/{id}
DELETE /api/detalle-pedido/{id}
GET    /api/detalle-pedido/por-pedido/{pedidoId}
```

### 13.3 POS (Punto de Venta)

**Pantalla POS** (`pos.ts`): interfaz de venta rápida en pantalla completa.

```
┌──────────────────────┬─────────────────────────────┐
│  🔍 Buscar producto  │  Cliente: [Consumidor Final] │
│  ──────────────────  │  ───────────────────────────│
│  Mix Frutos S. 200g  │  PEDIDO ACTUAL               │
│  S/ 14.90  [+]       │  Mix 200g  x2  S/ 29.80      │
│                      │  Doypack 500g x1 S/ 34.90    │
│  Doypack Mix 500g    │  ───────────────────────────│
│  S/ 34.90  [+]       │  Subtotal:      S/ 64.70     │
│                      │  IGV (18%):     S/ 11.65     │
│  ...                 │  TOTAL:         S/ 76.35     │
│                      │  ─────────────── ─────────── │
│                      │  [💳 Pagar]     [🗑 Vaciar]  │
└──────────────────────┴─────────────────────────────┘
```

**Flujo POS**:
1. Buscar producto (GET `/api/presentaciones-producto/buscar?termino=` o por código de barras GET `/api/codigos-barras/buscar`).
2. Crear pedido (POST `/api/pedidos`) con canal=MOSTRADOR, cliente=consumidor final.
3. Agregar detalles (POST `/api/detalle-pedido`).
4. Confirmar (PUT `/api/pedidos/{id}/confirmar`).
5. Registrar pago (POST `/api/pagos`).
6. Confirmar pago (PUT `/api/pagos/{id}/confirmar`).
7. Emitir comprobante (POST `/api/comprobantes-pago`).

---

## 14. F10 — Pagos + Facturación

### Feature: `features/pagos/`

```
pagos/
├── pages/
│   ├── pagos/
│   │   ├── pagos-lista/       ← listado con filtros por estado/pedido
│   │   └── pago-form/         ← registrar pago para un pedido
│   └── comprobantes/
│       ├── comprobantes-lista/
│       └── comprobante-form/
├── models/
│   ├── pago.model.ts
│   └── comprobante-pago.model.ts
├── services/
│   ├── pago.service.ts
│   └── comprobante-pago.service.ts
└── pagos.routes.ts
```

### 14.1 Pagos

**Modelo**:
```typescript
export interface Pago {
  id: string;
  pedidoId: string;
  numeroPedido?: string;
  monto: number;
  fechaPago: string;             // auto: now()
  metodoPagoId: string;
  nombreMetodoPago?: string;
  pasarelaPagoId?: string;
  nombrePasarelaPago?: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'CONFIRMADO' | 'RECHAZADO' | 'REEMBOLSADO' | 'VENCIDO';
  observacion?: string;
  codigoOperacion?: string;
}

export interface CreatePagoRequest {
  pedidoId: string;
  monto: number;
  metodoPagoId: string;
  pasarelaPagoId?: string;
  observacion?: string;
  codigoOperacion?: string;
}
```

**Reglas UI**:
- `estado` y `fechaPago` no van en el form de creación (auto).
- Botón "Confirmar" visible si `estado = PENDIENTE` o `EN_PROCESO`.
- Botón "Rechazar" visible si `estado = PENDIENTE` o `EN_PROCESO`.
- No se puede editar ni eliminar si `estado = CONFIRMADO` o `RECHAZADO` — ocultar botones.
- Mostrar `estadoPago` del pedido asociado y recalcularlo en la UI tras confirmar.

**Endpoints**:
```
POST /api/pagos                  ← pedidoId, monto, metodoPagoId, pasarelaPagoId?, observacion?, codigoOperacion?
GET  /api/pagos
GET  /api/pagos/{id}
PUT  /api/pagos/{id}
DELETE /api/pagos/{id}           ← solo si PENDIENTE
GET  /api/pagos/por-pedido/{pedidoId}
GET  /api/pagos/por-estado/{estado}
PUT  /api/pagos/{id}/confirmar   ← actualiza estadoPago del pedido
PUT  /api/pagos/{id}/rechazar    ← actualiza estadoPago del pedido
```

### 14.2 Comprobantes de Pago

**Modelo**:
```typescript
export interface ComprobantePago {
  id: string;
  pedidoId: string;
  tipo: 'BOLETA' | 'FACTURA' | 'NOTA_CREDITO' | 'NOTA_DEBITO' | 'TICKET';
  incluyeIgv: boolean;
  serie: string;
  numero: string;
  fechaEmision: string;
  subtotal: number;              // auto (del pedido)
  igv: number;                   // auto (del pedido)
  total: number;                 // auto (del pedido)
  vecesImpreso: number;          // auto: 0
  urlPdf?: string;
  urlXml?: string;
  hashDigital?: string;
  estado: 'EMITIDO' | 'ENVIADO_SUNAT' | 'ACEPTADO' | 'RECHAZADO_SUNAT' | 'ANULADO';
}

export interface CreateComprobantePagoRequest {
  pedidoId: string;
  tipo: string;
  incluyeIgv: boolean;
  serie: string;
  numero: string;
  fechaEmision: string;
}
```

**Reglas UI**:
- Solo se puede emitir un comprobante por pedido (409 si ya existe — mostrar mensaje).
- `subtotal`, `igv`, `total` son solo lectura.
- Botón "Registrar impresión" (`PUT /{id}/registrar-impresion`) incrementa `vecesImpreso`.
- Botón "Anular" (`PUT /{id}/anular`) solo si `estado = EMITIDO`.

**Endpoints**:
```
POST   /api/comprobantes-pago    ← pedidoId, tipo, incluyeIgv, serie, numero, fechaEmision
GET    /api/comprobantes-pago
GET    /api/comprobantes-pago/{id}
PUT    /api/comprobantes-pago/{id}
DELETE /api/comprobantes-pago/{id}   ← solo si EMITIDO
GET    /api/comprobantes-pago/buscar?serie=&numero=
GET    /api/comprobantes-pago/por-pedido/{pedidoId}
GET    /api/comprobantes-pago/por-tipo/{tipo}
GET    /api/comprobantes-pago/por-estado/{estado}
PUT    /api/comprobantes-pago/{id}/anular
PUT    /api/comprobantes-pago/{id}/registrar-impresion
```

---

## 15. F11 — Dashboard + Reportes

### Feature: `features/dashboard/` (completar)

### 15.1 Dashboard KPIs

**Modelo**:
```typescript
export interface DashboardResumen {
  totalPedidos: number;
  pedidosPendientesProcesar: number;
  pedidosPendientesPago: number;
  ventasDelMes: number;
  comprasDelMes: number;
  produccionesCompletadasDelMes: number;
  mermasDelMes: number;
  lotesProximosAVencer: number;
  carritosActivos: number;
  valorInventario: number;
}
```

**Endpoint**: `GET /api/dashboard/resumen`

**UI sugerida**: grid de tarjetas KPI con iconos, valor principal y etiqueta. Paleta de colores por categoría (ventas=verde, alertas=rojo, producción=azul).

### 15.2 Reportes Operativos

**Modelos**:
```typescript
export interface LoteProximoVencer {
  loteId: string; codigoLote: string; nombrePresentacion: string;
  nombreAlmacen: string; fechaVencimiento: string; diasRestantes: number;
  stockLote: number; estado: string;
}

export interface ProductoMasVendido {
  presentacionProductoId: string; nombrePresentacion: string;
  cantidadTotalVendida: number; montoTotalVendido: number;
}

export interface CuentaPorCobrar {
  pedidoId: string; numeroPedido: string; nombreCliente: string;
  total: number; estado: string; fechaCreacion: string;
}

export interface ResumenVentas {
  totalVentas: number; cantidadPedidos: number;
  pedidosPagados: number; pedidosPendientes: number;
  items: { pedidoId: string; numeroPedido: string; nombreCliente: string; total: number; fechaCreacion: string; estadoPago: string; }[];
}
```

**Endpoints** (todos `GET`):
```
GET /api/reportes/proximos-vencer?dias=30
GET /api/reportes/inventario
GET /api/reportes/productos-mas-vendidos?desde=2026-01-01&hasta=2026-06-30&limite=10
GET /api/reportes/cuentas-por-cobrar
GET /api/reportes/ventas?desde=2026-06-01&hasta=2026-06-30
GET /api/reportes/compras?desde=2026-06-01&hasta=2026-06-30
```

**UI**: página de reportes con tabs. Cada tab muestra su tabla + parámetros de filtro (date range picker). Botón "Exportar CSV" (implementación client-side).

---

## 16. Patrones Comunes de Implementación

### 16.1 Servicio base (patrón estándar)

```typescript
@Injectable({ providedIn: 'root' })
export class AlmacenService {
  private readonly url = `${environment.apiUrl}/almacenes`;
  constructor(private http: HttpClient) {}

  listar(): Observable<Almacen[]> {
    return this.http.get<Almacen[]>(this.url);
  }
  crear(data: CreateAlmacenRequest): Observable<Almacen> {
    return this.http.post<Almacen>(this.url, data);
  }
  actualizar(id: string, data: UpdateAlmacenRequest): Observable<Almacen> {
    return this.http.put<Almacen>(`${this.url}/${id}`, data);
  }
  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
```

### 16.2 Componente de listado (patrón estándar)

```typescript
@Component({ standalone: true, imports: [CommonModule, RouterModule, ...], ... })
export class AlmacenesComponent {
  private svc = inject(AlmacenService);
  almacenes = signal<Almacen[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.svc.listar().subscribe({
      next: (data) => { this.almacenes.set(data); this.cargando.set(false); },
      error: (err) => { this.error.set(err.error?.message ?? 'Error'); this.cargando.set(false); }
    });
  }

  eliminar(id: string) {
    // abrir ConfirmDialog → si confirma → svc.eliminar(id) → cargar()
  }
}
```

### 16.3 Formularios reactivos

```typescript
// Regla: usar los mismos constraints del backend
this.form = this.fb.group({
  nombre: ['', [Validators.required, Validators.maxLength(100)]],
  tipo: ['', Validators.required],
  capacidadKg: [null],            // null = sin límite
  estado: ['ACTIVO']
});
```

### 16.4 Manejo de errores 409 (duplicado)

```typescript
this.svc.crear(this.form.value).subscribe({
  error: (err) => {
    if (err.status === 409) {
      this.toast.error(err.error.message);  // "Ya existe un almacén con ese nombre"
    } else if (err.status === 400) {
      // err.error puede ser un array de ValidationError
      this.toast.error('Revisa los campos del formulario');
    }
  }
});
```

### 16.5 Chips de estado con colores

```typescript
// shared/pipes/estado-color.pipe.ts
const COLORES: Record<string, string> = {
  ACTIVO: 'bg-green-100 text-green-800',
  INACTIVO: 'bg-gray-100 text-gray-600',
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  CONFIRMADO: 'bg-blue-100 text-blue-800',
  COMPLETADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-700',
  PAGADO: 'bg-green-100 text-green-800',
  PARCIAL: 'bg-orange-100 text-orange-800',
  // ...
};
```

---

## 17. Tabla de Referencia de Endpoints

### Todos los endpoints del backend (resumen)

| Módulo | Base URL | Métodos especiales |
|--------|----------|--------------------|
| Auth | `/api/auth` | `POST /login`, `GET /me` |
| Personas | `/api/personas` | CRUD |
| TipoDocumento | `/api/tipo-documento` | CRUD |
| Usuarios | `/api/usuarios` | CRUD |
| Roles | `/api/roles` | CRUD |
| Almacenes | `/api/almacenes` | `/por-estado`, `/por-tipo` |
| MetodoPago | `/api/metodos-pago` | `/por-estado` |
| PasarelaPago | `/api/pasarelas-pago` | `/por-estado` |
| Proveedores | `/api/proveedores` | `/por-estado`, `/{id}/catalogo` |
| Clientes | `/api/clientes` | `/por-estado` |
| MateriaPrima | `/api/materia-prima` | `/por-estado`, `/buscar` |
| MovimientoMateria | `/api/movimientos-materia` | `/por-materia/{id}` |
| Categorias | `/api/categorias` | solo GET/POST |
| Productos | `/api/productos` | `/por-categoria`, `/por-estado`, `/buscar` |
| Presentaciones | `/api/presentaciones-producto` | `/por-producto`, `/por-estado`, `/buscar` |
| CodigosBarras | `/api/codigos-barras` | `/por-presentacion` |
| Combos | `/api/combos` | `/por-estado`, `/buscar` |
| DetalleCombo | `/api/detalle-combo` | `/por-combo/{id}` |
| Compras | `/api/compras` | `/por-estado`, `/por-proveedor`, `PUT /{id}/recibir` |
| DetalleCompra | `/api/detalle-compra` | `/por-compra/{id}` |
| Produccion | `/api/produccion` | `/por-estado`, `PUT /{id}/completar`, `PUT /{id}/cancelar` |
| DetalleProduccion | `/api/detalle-produccion` | `/por-produccion/{id}` |
| InsumoProduccion | `/api/insumo-produccion` | `/por-produccion/{id}` |
| Lotes | `/api/lotes` | `/disponibles`, `/por-presentacion`, `/por-almacen`, `/por-estado`, `/buscar` |
| Mermas | `/api/mermas` | `/por-lote`, `/por-tipo` (no PUT) |
| MovimientoInventario | `/api/movimientos-inventario` | `/por-lote/{id}` |
| StockAlerta | `/api/stock-alerta` | `/por-presentacion/{id}` |
| PromocionLote | `/api/promocion-lote` | `/por-lote/{id}`, `/activa/{loteId}` |
| Cotizaciones | `/api/cotizaciones` | `/por-cliente`, `/por-estado`, `PUT /{id}/enviar`, `/aceptar`, `/rechazar` |
| DetalleCotizacion | `/api/detalle-cotizacion` | `/por-cotizacion/{id}` |
| Pedidos | `/api/pedidos` | `/por-cliente`, `/por-estado`, `/por-estado-pago`, `PUT /{id}/confirmar`, `/cancelar` |
| DetallePedido | `/api/detalle-pedido` | `/por-pedido/{id}` |
| HistorialEstados | `/api/historial-estados` | (no PUT/DELETE — 405) |
| DetalleEmpaque | `/api/detalle-empaque` | CRUD |
| Carrito | `/api/carritos` | `/por-cliente`, `/por-estado`, `PUT /{id}/vaciar`, `PUT /{id}/procesar` |
| DetalleCarrito | `/api/detalle-carrito` | `/por-carrito/{id}` |
| Pagos | `/api/pagos` | `/por-pedido`, `/por-estado`, `PUT /{id}/confirmar`, `PUT /{id}/rechazar` |
| ComprobantePago | `/api/comprobantes-pago` | `/buscar`, `/por-pedido`, `/por-tipo`, `/por-estado`, `PUT /{id}/anular`, `/registrar-impresion` |
| Dashboard | `/api/dashboard` | `GET /resumen` |
| Reportes | `/api/reportes` | `/proximos-vencer`, `/inventario`, `/productos-mas-vendidos`, `/cuentas-por-cobrar`, `/ventas`, `/compras` |

---

_Última actualización: 2026-06-23_
