# ANÁLISIS EXHAUSTIVO DEL PROYECTO — Naturin's ERP Frontend

> Fecha de análisis: 2026-07-09  
> Versión analizada: Angular 19 (Signals + Standalone Components, Tailwind CSS)

---

## 1. Inventario del Proyecto

### 1.1 Módulos y páginas

| Feature | Ruta | Componente | Descripción |
|---------|------|------------|-------------|
| **Usuarios** | `/login` | `Login` | Pantalla de inicio de sesión |
| **Dashboard** | `/dashboard` | `Dashboard` | KPIs + gráficos ventas + actividad reciente |
| **Inventario** | `/productos` | `ProductList` | Lista de productos con stock agregado |
| **Inventario** | `/productos/nuevo` | `ProductForm` | Formulario crear/editar producto |
| **Inventario** | `/productos/:id/editar` | `ProductForm` | (mismo componente, modo edición) |
| **Inventario** | `/presentaciones` | `Presentaciones` | CRUD de presentaciones/SKUs |
| **Inventario** | `/almacenes` | `Almacenes` | CRUD de almacenes |
| **Inventario** | `/lotes` | `Lotes` | CRUD de lotes con clasificación vencimiento |
| **Inventario** | `/kardex` | `Kardex` | Movimientos de inventario de productos |
| **Inventario** | `/materia-prima` | `MateriasPrimas` | CRUD de materias primas |
| **Inventario** | `/materia-prima/:id/kardex` | `MateriaPrimaKardex` | Movimientos de una MP específica |
| **Producción** | `/produccion` | `ProduccionLista` | Kanban de órdenes de producción |
| **Producción** | `/produccion/:id` | `ProduccionDetalle` | Detalle OP: insumos / salidas / mermas |
| **Producción** | `/recetas` | `Recetas` | CRUD de recetas + cálculo de insumos |
| **Compras** | `/compras` | `ComprasLista` | Lista de órdenes de compra |
| **Compras** | `/compras/:id` | `CompraDetalle` | Detalle OC: líneas + recibir/cancelar |
| **Ventas** | `/pos` | `Pos` | Punto de venta con carrito FEFO |
| **Ventas** | `/cotizaciones` | `Cotizaciones` | Lista + formulario con vista previa |
| **Ventas** | `/pedidos` | `Pedidos` | Kanban de pedidos por estado |
| **Ventas** | `/metodos-pago` | `MetodosPago` | CRUD de métodos de pago |
| **Clientes** | `/clientes` | `Clientes` | CRUD clientes (persona + datos comerciales) |
| **Proveedores** | `/proveedores` | `Proveedores` | Lista+ficha proveedores + catálogo MP |
| **Seguridad** | `/empleados` (ruta: usuarios) | `Usuarios` | Wizard crear empleados + gestión |
| **Seguridad** | `/roles` | `Roles` | CRUD de roles |
| **Seguridad** | `/departamentos` | `Departamentos` | CRUD de departamentos |
| **Seguridad** | `/permisos-rbac` | `PermisosRbac` | Matriz de permisos por rol/módulo |
| **E-commerce** | `/ecommerce` | `EcommerceOverview` | Resumen KPIs tienda online |
| **E-commerce** | `/ecommerce/productos` | `EcommerceProductos` | Catálogo web (toggle visibilidad) |
| **E-commerce** | `/ecommerce/banners` | `EcommerceBanners` | CRUD banners del carrusel |
| **E-commerce** | `/ecommerce/cupones` | `EcommerceCupones` | CRUD cupones de descuento |
| **E-commerce** | `/ecommerce/descuentos` | `EcommerceDescuentos` | CRUD descuentos por producto |
| **E-commerce** | `/ecommerce/pedidos` | `EcommercePedidos` | Pedidos del canal ECOMMERCE |

**Items marcados "Pronto" en el sidebar (sin ruta real):**
- Facturación (bajo Ventas)
- Reportes (bajo Administración)

### 1.2 Servicios y endpoints

| Servicio | URL base | Métodos expuestos |
|---------|----------|-------------------|
| `AuthService` | `/auth` | `login`, `logout`, `isAuthenticated`, `hasRole` |
| `ProductoService` | `/productos` | `listar`, `obtenerPorId`, `crear`, `actualizar`, `eliminar` |
| `CategoriaService` | `/categorias` | `listar`, `crear` |
| `PresentacionService` | `/presentaciones` | `listar`, `crear`, `actualizar`, `eliminar` |
| `LoteService` | `/lotes` | `listar`, `listarDisponibles`, `crear`, `actualizar`, `eliminar` |
| `MovimientoService` | `/movimientos-inventario` | `listar`, `crear` |
| `AlmacenService` | `/almacenes` | `listar`, `listarPorEstado`, `crear`, `actualizar`, `eliminar` |
| `MateriaPrimaService` | `/materias-primas` | `listar`, `listarActivos`, `crear`, `actualizar`, `eliminar` |
| `MovimientoMateriaService` | `/movimientos-materia-prima` | (kardex MP) |
| `ProduccionService` | `/producciones` | `listar`, `buscarPorId`, `crear`, `actualizar`, `completar`, `cancelar` |
| `DetalleProduccionService` | `/detalles-produccion` | CRUD por producción |
| `InsumoProduccionService` | `/insumos-produccion` | CRUD por producción |
| `MermaService` | `/mermas` | `listar`, `crear`, `eliminar` |
| `RecetaService` | `/recetas` | `listar`, `crear`, `activar`, `archivar`, `calcular`, `producir` |
| `CompraService` | `/compras` | `listar`, `buscarPorId`, `crear`, `recibir`, `cancelar` |
| `DetalleCompraService` | `/detalles-compra` | `porCompra`, `crearBulk`, `actualizar`, `eliminar` |
| `PedidoService` | `/pedidos` | `listar`, `crear`, `confirmar`, `preparar`, `despachar`, `entregar`, `cancelar` |
| `DetallePedidoService` | `/detalles-pedido` | `crearBulk` |
| `CotizacionService` | `/cotizaciones` | `listar`, `crear`, `enviar`, `aceptar`, `rechazar`, `eliminar` |
| `DetalleCotizacionService` | `/detalles-cotizacion` | `crear` |
| `MetodoPagoService` | `/metodos-pago` | `listarActivos` |
| `ClienteService` | `/clientes` | `listar`, `crear`, `actualizar`, `eliminar` |
| `ProveedorService` | `/proveedores` | `listar`, `crear`, `actualizar`, `eliminar`, `listarCatalogo`, `agregarCatalogo`, `actualizarCatalogo`, `eliminarCatalogo` |
| `DashboardService` | `/dashboard` | `getResumen` |
| `BannerService` | `/banners` | `listar`, `crear`, `actualizar`, `eliminar` |
| `CuponService` | `/cupones` | `listar`, `crear`, `actualizar`, `eliminar` |
| `DescuentoService` | `/descuentos` | CRUD |
| `UsuarioService` | `/usuarios` | `listar`, `crearPersona`, `crear`, `actualizar`, `eliminar` |
| `RolService` | `/roles` | `listar` |
| `DepartamentoService` | `/departamentos` | `listar` |
| `PermisoService` | `/permisos` | `listarModulos`, `listarPorRol`, `actualizarBulk` |
| `PersonaService` | `/personas` | `crear`, `obtenerPorId` |
| `TipoDocumentoService` | `/tipos-documento` | `listar` |
| `UploadService` / `ArchivoService` | `/archivos` | `subirImagen`, `subirCv` |

### 1.3 Modelos de datos por módulo

**Inventario — Producto**
```
ProductoResponse: id, categoriaId, nombreCategoria, nombre, descripcion, urlImagen,
  estado (ACTIVO|INACTIVO|DESCONTINUADO), precioCompra, stockMinimo, stockCritico,
  visibleEcommerce, ingredientes, pesoNeto, porcionRecomendada,
  caloriasXPorcion, proteinasXPorcion, carbohidratosXPorcion, grasasXPorcion,
  fibrasXPorcion, alergenos, certificaciones, imagenesAdicionales[]
```

**Inventario — PresentacionResponse**
```
id, productoId, nombreProducto, nombre, factorConversion, precioVenta,
peso, unidadMedida, estado (ACTIVO|INACTIVO|DESCONTINUADO|PROXIMAMENTE)
```

**Inventario — LoteResponse**
```
id, presentacionProductoId, nombreProducto, almacenId, nombreAlmacen,
codigoLote, numeroLoteProveedor, fechaFabricacion, fechaIngreso, fechaVencimiento,
stockLote, costoUnitario, estado (DISPONIBLE|EN_CUARENTENA|BLOQUEADO|VENCIDO|AGOTADO|AGOTADO_MERMA)
```

**Inventario — MovimientoInventario**
```
id, loteId, codigoLote, tipoMovimiento (ENTRADA|SALIDA|AJUSTE_POSITIVO|AJUSTE_NEGATIVO|
  TRANSFERENCIA_ENTRADA|TRANSFERENCIA_SALIDA), cantidad, stockResultante, costoUnitario,
tipoReferencia (PEDIDO|COMPRA|PRODUCCION|MERMA|TRANSFERENCIA|AJUSTE_MANUAL|DEVOLUCION),
referenciaId, observacion
```

**Producción — Produccion**
```
id, numeroOrden, usuarioId, nombreUsuario, fechaProduccion, costoTotal,
observacion, estado (PLANIFICADA|EN_PROCESO|COMPLETADA|CANCELADA), recetaId
```

**Producción — Receta**
```
id, nombre, descripcion, presentacionId, nombrePresentacion, nombreProducto,
rendimientoPorLote, estado (ACTIVA|INACTIVA|ARCHIVADA),
ingredientes[]: {id, materiaPrimaId, nombreMateriaPrima, unidadMedida, cantidadPorLote, stockActual}
```

**Ventas — Pedido**
```
id, numeroPedido, clienteId, nombreCliente, usuarioVendedorId, metodoPagoId,
canal (PRESENCIAL|TELEFONO|WHATSAPP|ECOMMERCE|EMAIL|MARKETPLACE),
prioridad (BAJA|NORMAL|ALTA|URGENTE),
tipoEntrega (DELIVERY|RECOJO_TIENDA|AGENCIA),
costoEnvio, direccionEntrega, descuento, subTotal, igv, total,
estado (NUEVO|CONFIRMADO|EN_PREPARACION|LISTO_DESPACHO|EN_CAMINO|ENTREGADO|CANCELADO|DEVUELTO),
estadoPago (PENDIENTE|PARCIAL|PAGADO|REEMBOLSADO|VENCIDO)
```

**Ventas — Cotización**
```
id, numeroCotizacion, clienteId, nombreCliente, incluyeIgv, descuento,
total, observacion, fechaVencimiento,
estado (BORRADOR|ENVIADA|ACEPTADA|RECHAZADA|VENCIDA|CONVERTIDA)
```

**Clientes — Cliente**
```
id, personaId, nombreCompleto, tipoCliente (PERSONA|EMPRESA),
razonSocial, ruc, aplicaIgv, limiteCredito, descuentoPreferencial,
estado (ACTIVO|INACTIVO|SUSPENDIDO|POTENCIAL)
```

**Proveedores — Proveedor**
```
id, personaId, nombreCompleto, ruc, razonSocial, contacto, diasCredito, rubro, estado
ProveedorProducto: id, proveedorId, materiaPrimaId, nombreMateriaPrima, unidadMedida,
  precioCompra, tiempoEntregaDias, cantidadMinimaCompra, esPrincipal, observacion, imagenUrl, estado
```

**Seguridad — Usuario**
```
id, personaId, nombreCompleto, numeroDocumento, telefono, correo, username,
rolId, nombreRol, departamentoId, nombreDepartamento, urlAvatar,
ultimoAcceso, intentosFallidos, estado (ACTIVO|INACTIVO|BLOQUEADO)
```

**E-commerce — Cupón**
```
id, codigo, tipo (PORCENTAJE|MONTO_FIJO|ENVIO_GRATIS), valor, fechaInicio, fechaFin,
usosMaximos, usosActuales, montoMinimo, estado (ACTIVO|INACTIVO|VENCIDO)
```

**Dashboard — DashboardResumen**
```
totalPedidos, pedidosPendientesProcesar, pedidosPendientesPago,
ventasDelMes, comprasDelMes, produccionesCompletadasDelMes,
mermasDelMes, lotesProximosAVencer, carritosActivos, valorInventario
```

---

## 2. Análisis de UI/UX por módulo

### 2.1 Dashboard

**Qué hace bien:**
- Seis KPI cards con ícono, valor y delta porcentual, buen uso de colores semánticos.
- Gráfico de barras de ventas mensuales (Chart.js) + doughnut de inventario por almacén.
- Lista de top productos con barras de progreso.
- Feed de actividad reciente con íconos y timestamps.
- El `ngOnDestroy` destruye los charts correctamente.

**Qué mejorar:**
- Los datos de ventas mensuales (`dashboard.ts` líneas 130-152) son **hardcodeados** — el array `[180, 210, 195…]` nunca viene del backend. El servicio solo carga `ventasDelMes` (un número), no el histórico mensual.
- Los datos de "Inventario por almacén" también están hardcodeados (40%, 25%, 20%, 15%) y nunca reflejan los almacenes reales.
- Los `topProducts` son hardcodeados con nombres de ejemplo, no se cargan del API.
- El feed de `activity` son strings literales hardcodeados; el backend debería tener un endpoint `/dashboard/actividad`.
- El KPI "Ventas del día" (`mapearKpis` línea 117) ignora `data.ventasDelMes` y vuelve a poner el hardcode `S/ 12,480`.
- El `delta` de todos los KPIs es hardcodeado (siempre "12%", "8%", etc.), nunca es una comparación real con el período anterior.
- El link "Ver todo" de actividad reciente apunta a `href="#"` — ruta muerta.
- Falta un selector de rango de fechas para los gráficos.
- No hay widget de "Producción en curso" que muestre las OPs activas actualmente.
- No hay alerta visual de lotes próximos a vencer en el dashboard (solo muestra la cantidad pero no los productos).

**Propuestas concretas:**
1. Crear endpoint `GET /dashboard/ventas-mensuales?año=2026` que devuelva array de 12 meses.
2. Crear endpoint `GET /dashboard/actividad-reciente?limite=10`.
3. Crear endpoint `GET /dashboard/inventario-por-almacen`.
4. Agregar widget de "Lotes por vencer" con tabla de los 5 más urgentes y botón → `/lotes`.
5. Agregar widget de "OPs en curso" enlazando a `/produccion`.

---

### 2.2 Inventario — Lista de Productos (`/productos`)

**Qué hace bien:**
- Búsqueda con debounce implementada correctamente (`debouncedSignal`).
- Stock agregado calculado cliente-side cruzando lotes y presentaciones.
- Alertas visuales de lotes vencidos y próximos a vencer en la columna Stock.
- Modal de ver y confirmar eliminación bien implementados.
- `Breadcrumb` y `EmptyState` reutilizables usados.
- Carga de presentaciones y lotes en paralelo (no bloqueante del listado).

**Qué mejorar:**
- Los filtros de "Categoría", "Almacén" y "Estado" son **botones decorativos** (`products-list.html` líneas 39-45): no tienen `(click)` handler ni lógica asociada. El usuario puede hacer click pero nada ocurre.
- El botón "Exportar" también es decorativo (`products-list.html` línea 14): sin handler.
- No hay paginación — carga TODOS los productos en memoria. Si hay 500+ productos esto se vuelve lento.
- El `codigo()` method construye un código visual `SNK-XXXXXX` cortando el UUID, pero este código no existe en el backend (no hay campo `codigo` en `ProductoResponse`). El usuario ve un código que no puede buscar en ningún otro sistema.
- El modal de "ver producto" muestra solo nombre, categoría y estado. No muestra precio, stock, descripción ni info nutricional.
- No hay columna de precio de compra ni precio de venta (la presentación tiene `precioVenta`, el producto tiene `precioCompra`).
- `stockDe(p.id)` carga todos los lotes y presentaciones para calcular el stock — 3 llamadas API al cargar la página. Sería mejor un endpoint `/productos/:id/stock` o que el backend devuelva el stock en el listado.

**Propuestas concretas:**
1. Conectar los filtros de Categoría, Estado y Almacén a signals + lógica de filtrado en `computed()`.
2. Agregar paginación con `PaginationComponent` (ya existe en shared) — 50 productos por página.
3. Implementar exportar a Excel usando `xlsx` o llamada a endpoint `GET /productos/exportar`.
4. Enriquecer el modal de ver: mostrar precio compra, rango de precios de venta (min/max de presentaciones), descripción, estado nutricional si existe.
5. Pedir al backend que el listado `GET /productos` incluya un campo `stockTotal` para evitar 2 llamadas extra.

---

### 2.3 Inventario — Formulario de Producto (`/productos/nuevo` y `/productos/:id/editar`)

**Qué hace bien:**
- Formulario reactivo con validadores en todos los campos relevantes.
- Sube imagen por archivo (drag & drop) + validación de tipo y tamaño.
- Galería de imágenes adicionales con subida.
- Modal de creación rápida de categoría sin salir del formulario.
- Cálculo en tiempo real del margen bruto con `computed()`.
- Sección de información nutricional completa.
- En edición carga correctamente el producto y hace `patchValue`.

**Qué mejorar:**
- El campo `precioVenta` existe en el formulario (`product-form.ts` línea 75) pero **no se envía al backend** (no existe en `CreateProductoRequest` ni en `UpdateProductoRequest`). El precio de venta vive en `Presentacion`, no en `Producto`. El formulario induce a confusión: el operador llena "Precio de venta" y ese dato se pierde silenciosamente.
- El campo `unidad` (línea 70: `unidad: ['UNIDAD']`) tampoco existe en el modelo del backend — se descarta silenciosamente.
- El campo `controlLotes` (línea 77: `controlLotes: [true]`) tampoco existe en el modelo del backend.
- El campo `permitirDescuentos` (línea 78) tampoco existe en el backend.
- El campo `stockInicial` (línea 73) no se envía al backend: al crear un producto nuevo el stock es 0 siempre. El operador que pone 100 en "Stock inicial" se sorprende de que quede en 0.
- No hay validación cruzada visible en la UI cuando `stockCritico > stockMinimo` (hay la validación en el método `guardar()` pero el mensaje de error aparece abajo, lejos de los campos).
- La sección nutricional no valida que `caloriasXPorcion` sea un número positivo razonable (acepta 999999).
- Al cancelar/volver desde el formulario de edición, no hay prompt de confirmación si hay cambios no guardados (`form.dirty`).
- No hay campo para `precioVentaPublico` o `margenDeseado` con cálculo inverso.

**Propuestas concretas:**
1. Remover los campos `precioVenta`, `unidad`, `controlLotes`, `permitirDescuentos` del formulario de Producto, o explicar con texto que el precio de venta se configura en Presentaciones.
2. Implementar `stockInicial` como campo que, al guardar, crea un movimiento de inventario `AJUSTE_POSITIVO` en el lote por defecto.
3. Agregar guard de salida (`CanDeactivate`) que pregunte si hay cambios sin guardar.

---

### 2.4 Inventario — Presentaciones (`/presentaciones`)

**Qué hace bien:**
- CRUD completo (listar, crear, editar, eliminar).
- Dropdown de búsqueda de producto con filtro en tiempo real.
- Cálculo automático de `factorConversion` según peso y unidad.
- El campo `estado: PROXIMAMENTE` es útil para comunicar próximos lanzamientos al e-commerce.

**Qué mejorar:**
- La tabla no muestra el precio de venta en formato moneda formateada — muestra el número crudo.
- No hay filtro por producto ni por estado activo/inactivo/descontinuado.
- No hay columna con la cantidad de lotes activos vinculados.
- Al crear una presentación no hay campo para asignar el precio de compra de esa presentación (diferente al precio de compra del producto padre), lo que puede ser necesario para presentaciones de distintos tamaños.
- La página no tiene breadcrumb a diferencia de otras páginas (inconsistencia visual).

**Propuestas concretas:**
1. Agregar filtros chips: "Activo / Inactivo / Descontinuado / Próximamente".
2. Agregar columna "Lotes con stock" mostrando cuántos lotes tienen stock > 0.
3. Agregar breadcrumb.

---

### 2.5 Inventario — Lotes (`/lotes`)

**Qué hace bien:**
- KPIs en la parte superior: vigentes, próximos a vencer, vencidos, valor total.
- Clasificación inteligente `clasif()` que combina el `estado` real del backend con el cálculo de días hasta vencimiento.
- Borde izquierdo de color en las filas según clasificación.
- Botón de autogenerar código de lote.
- Formulario incluye `fechaIngreso` con valor por defecto = hoy.

**Qué mejorar:**
- No hay filtros por estado (vencido, próximo, vigente) — hay que buscar manualmente.
- No hay filtro por almacén ni por producto.
- La tabla muestra `nombreProducto` pero no la presentación — si un producto tiene múltiples presentaciones (100g, 200g, 500g) el operador no sabe cuál es.
- No hay exportación de lotes (útil para auditorías).
- Cuando se elimina un lote con stock > 0, el backend debería rechazarlo, pero el frontend no avisa al usuario qué hacer (transferir el stock primero).
- El KPI "Valor total" acumula `stockLote * costoUnitario` incluyendo lotes VENCIDOS y AGOTADOS, inflando el valor inventariado.

**Propuestas concretas:**
1. Agregar filtros chips: "Todos / Vigente / Próx. vencer / Vencido / Cuarentena / Bloqueado / Agotado".
2. Agregar filtro dropdown de almacén.
3. El KPI de valor debe excluir lotes VENCIDO y AGOTADO.
4. Agregar columna "Presentación" con el nombre de la presentación.

---

### 2.6 Inventario — Kardex (`/kardex`)

**Qué hace bien:**
- Permite registrar movimientos manuales (ajustes, transferencias) con formulario reactivo.
- Vista diferenciada de entradas (verde) y salidas (rojo) con ícono de dirección.
- Búsqueda por código de lote o nombre de producto.

**Qué mejorar:**
- No hay filtro por tipo de movimiento (solo ver entradas, solo ver salidas, etc.).
- No hay filtro por rango de fechas — carga todos los movimientos históricos de golpe. Con miles de registros esto es un problema de performance.
- No hay paginación.
- El campo `tipoReferencia` en el formulario es un select vacío (la referencia al pedido/compra/producción nunca se rellena automáticamente en movimientos manuales).
- La columna "Producto" llama a `productoDe()` que busca en el map de lotes — si el lote fue eliminado del backend la columna muestra `—`.
- No hay columna de "stock resultante" en la tabla, lo cual es fundamental en un kardex para ver la evolución.

**Propuestas concretas:**
1. Agregar filtros: tipo de movimiento (chip multiple), rango fechas (date range picker).
2. Agregar columna "Stock resultante" mapeada de `stockResultante`.
3. Implementar paginación server-side: `GET /movimientos-inventario?page=0&size=50&loteId=X&desde=X&hasta=X`.
4. Agregar exportar a Excel.

---

### 2.7 Inventario — Materias Primas (`/materia-prima`)

**Qué hace bien:**
- CRUD completo con validaciones.
- Stats en la parte superior: activas, inactivas, agotadas, bajo mínimo.
- `nivelStock()` calcula criticidad correctamente.
- El botón "Ver Kardex" navega a `/materia-prima/:id/kardex`.
- El campo nombre se deshabilita en edición (correcto).

**Qué mejorar:**
- El campo `stock` se deshabilita en edición y **no se actualiza por formulario** — el único mecanismo para cambiar el stock de una MP es a través de compras o el kardex de MP. El operador que necesita hacer un ajuste manual debe ir a otro sitio. No hay botón de acceso directo "Registrar movimiento" desde la lista de MP.
- No hay campo de `categoría` o `grupo` para agrupar materias primas (ej: "Frutas", "Semillas", "Aditivos").
- No hay campo de `proveedor preferido` visible en la lista.
- No hay columna de `costoUnitario` en la lista (solo en el modal de edición).
- Sin paginación ni agrupación por estado.

**Propuestas concretas:**
1. Agregar columna `Costo unitario` y `Proveedor principal` en la tabla.
2. Agregar botón inline "Ajustar stock" que abra el kardex de MP directamente.
3. Agregar filtro por estado con chips.

---

### 2.8 Producción — Lista de OPs (`/produccion`)

**Qué hace bien:**
- Vista Kanban con 4 columnas (PLANIFICADA → EN_PROCESO → COMPLETADA → CANCELADA).
- Crea nueva OP directamente desde el modal con solo un campo de observación.
- Al crear una OP, navega directamente al detalle.
- Orden cronológico descendente.

**Qué mejorar:**
- No hay ningún campo de "producto a producir" al crear la OP — el operador crea una OP vacía y luego agrega insumos y salidas manualmente. El flujo natural debería ser: seleccionar receta → calcular insumos → crear OP. La página de Recetas sí permite esto (`Producir desde receta`), pero el botón "Nueva OP" en `/produccion` lo omite.
- No hay búsqueda/filtro en el Kanban.
- Las tarjetas del Kanban no muestran qué producto se va a producir (porque no está en el modelo).
- Las tarjetas no muestran el número de insumos ni salidas ya registradas.
- No hay indicador del "progreso" de la OP (ej: 3/5 insumos registrados).
- Las columnas del Kanban no tienen un límite de WIP visible.

**Propuestas concretas:**
1. Al crear OP, mostrar selector opcional de receta. Si se selecciona, pre-poblar insumos automáticamente.
2. Mostrar en la tarjeta: nombre del producto principal (de la primera salida o de la receta asociada).
3. Agregar búsqueda por número de orden.

---

### 2.9 Producción — Detalle de OP (`/produccion/:id`)

**Qué hace bien:**
- Tabs "Insumos / Salidas / Mermas" bien organizados.
- Modal de insumos con cards seleccionables de materias primas.
- Modal de completar pide almacén destino y fecha de vencimiento.
- El tab Mermas solo aparece cuando la OP está COMPLETADA.
- Estados claramente definidos con transiciones lógicas.
- Cada sección tiene CRUD completo (editar, eliminar, agregar).

**Qué mejorar:**
- El costo unitario de los insumos se prellenan del `costoUnitario` de la MP, pero el operador lo puede editar sin validación de que sea un valor razonable (acepta 0 o negativo).
- Al completar la OP, si hay varias salidas (varios SKUs producidos), todos van al mismo almacén con la misma fecha de vencimiento — no es correcto si se producen SKUs con vidas útiles diferentes.
- La pestaña Mermas no agrupa por tipo de merma ni muestra el total de merma del período.
- No hay campo de "cantidad planificada" vs "cantidad real producida" para calcular el rendimiento de la OP.
- El costo total de la OP (`costoTotal`) se muestra en el encabezado pero no se desglosa (no hay detalle de "insumos: S/ X, mermas: S/ Y").
- Al completar la OP no se valida que la suma de insumos > 0 antes de confirmar.
- `cargarMermasTab()` carga TODOS los lotes y TODAS las mermas del sistema, filtrando client-side. Con muchos datos esto puede ser ineficiente.

---

### 2.10 Producción — Recetas (`/recetas`)

**Qué hace bien:**
- CRUD completo con ingredientes dinámicos (agregar/quitar líneas).
- Modal de cálculo: permite ingresar `lotesAProducir` y ver si hay stock suficiente.
- Flujo directo "Calcular → Producir" que crea la OP y navega al detalle.
- Estados ACTIVA/INACTIVA/ARCHIVADA con transiciones.
- Computed `totalActivas` y `totalArchivadas`.

**Qué mejorar:**
- No hay posibilidad de **editar** una receta existente — solo crear y archivar. Si el rendimiento cambió o se cambió un ingrediente, hay que archivar la receta y crear una nueva.
- No hay historial de versiones de receta.
- Al crear la receta, la descripción es un textarea libre sin límite visible.
- No hay campo de "tiempo estimado de producción" en la receta.
- La receta no tiene campo de "temperatura de proceso" u otras variables técnicas.
- La lista no muestra cuántas veces se ha producido con cada receta.
- El filtro de estado usa un signal simple (`filtroEstado`) pero no hay chips visuales de filtro, solo el select básico.

---

### 2.11 Compras — Lista y Detalle

**Qué hace bien:**
- La lista muestra KPIs: pendientes, completadas, canceladas.
- Al crear OC se navega al detalle de inmediato.
- El detalle permite agregar ítems del catálogo del proveedor (multi-select con cards).
- Las acciones "Recibir" y "Cancelar" tienen confirmación.
- Se pueden editar y eliminar ítems individuales.

**Qué mejorar:**
- La OC no incluye fecha de entrega esperada — el operador no puede hacer seguimiento de si el proveedor entregó a tiempo.
- No hay campo de `nro. de factura/guía del proveedor` al recibir la OC. Al marcar "recibir" no se pide evidencia documental.
- El modelo `CompraResponse` no incluye `fechaEntregaEsperada`, `nroFacturaProveedor`, `condicionPago`.
- Solo hay `COMPLETADA` como estado final — no hay `RECIBIDA_PARCIAL` completamente implementada (está en el enum pero no hay acción de "recibir parcial").
- No hay flujo de "recibir parcialmente" que permita marcar qué ítems se recibieron y en qué cantidad.
- Al recibir la OC, la lógica de crear lotes en inventario es responsabilidad del backend, pero el frontend no muestra los lotes creados como resultado de la recepción.
- No hay campo de moneda para compras en dólares o euros.
- El botón de "Exportar" no existe en la lista de compras.

---

### 2.12 Ventas — POS (`/pos`)

**Qué hace bien:**
- Layout dividido 62/38 catálogo/carrito — apropiado para pantallas de caja.
- Selección FEFO automática de lotes (más próximo a vencer primero).
- Búsqueda de cliente con dropdown en tiempo real.
- Cálculo automático de IGV según `cliente.aplicaIgv`.
- Tipos de entrega con campo de dirección condicional para DELIVERY.
- Alerta de stock al intentar agregar sin disponibilidad.
- Modal de éxito con número de pedido y total.
- Recarga de lotes tras finalizar la venta para reflejar el nuevo stock.
- Colores de stock (<= 0: rojo, <= 10: amarillo) en las tarjetas.

**Qué mejorar:**
- No hay campo de descuento en el POS — si el cajero quiere dar un 10% de descuento manual, no puede.
- No hay campo de "monto recibido" y "vuelto" (cambio) — esencial en ventas en efectivo.
- No hay soporte para venta sin cliente (venta anónima/consumidor final).
- El botón "Finalizar venta" requiere cliente obligatorio — en ventas retail esto es una fricción.
- El POS no imprime ticket automáticamente tras la venta — el modal de éxito solo tiene "Nueva venta".
- El campo `costoEnvio` siempre se envía como 0 al backend, incluso en `DELIVERY`.
- El POS ocupa toda la pantalla (`h-screen overflow-hidden`) lo que choca con el layout del `MainLayout` (sidebar + header). La pantalla debería ocultar el sidebar en modo POS.
- Si el backend falla al crear el pedido pero no al crear los detalles (fallo parcial en `crearBulk`), no hay rollback ni aviso adecuado.
- No hay búsqueda por código de barras (campo con listener de tecla Enter para escanear).

**Propuestas concretas:**
1. Agregar campo "Descuento (%)" en el carrito.
2. Agregar campo "Recibido / Vuelto" para pagos en efectivo.
3. Hacer el cliente opcional con opción "Venta rápida / Sin cliente".
4. Al completar la venta, agregar botón "Imprimir ticket" (ventana de impresión).
5. Agregar input de código de barras que busque la presentación por `codigoBarras`.

---

### 2.13 Ventas — Pedidos (`/pedidos`)

**Qué hace bien:**
- Vista Kanban con 5 columnas de estado.
- KPIs: pedidos hoy, activos, total S/.
- Acciones de avance de estado directamente desde las tarjetas.
- Toggle para mostrar/ocultar cancelados y devueltos.
- Búsqueda por número de pedido o nombre de cliente.

**Qué mejorar:**
- Al hacer "Avanzar" el estado, la página recarga TODOS los pedidos (`this.cargar()`) — debería actualizar solo la tarjeta en cuestión.
- El filtro de búsqueda solo filtra pedidos ya cargados en memoria — si hay 1000 pedidos, todos se cargan primero.
- No hay filtro por canal (PRESENCIAL / ECOMMERCE / WHATSAPP).
- No hay filtro por fecha (hoy, esta semana, este mes).
- Las tarjetas del Kanban no muestran los ítems del pedido (productos comprados).
- No hay acceso al detalle del pedido desde el Kanban (modal o página de detalle).
- El estado `EN_CAMINO` existe en el modelo pero no en el Kanban (columnas solo van hasta ENTREGADO sin pasar por EN_CAMINO).

**Propuestas concretas:**
1. Crear página `/pedidos/:id` de detalle con los ítems, historial de estados y opciones de impresión.
2. Filtros de canal y fecha en la barra de filtros.
3. Actualizar solo el pedido afectado tras avanzar, sin recargar todo.

---

### 2.14 Ventas — Cotizaciones (`/cotizaciones`)

**Qué hace bien:**
- Vista dual: lista + formulario con preview en tiempo real.
- El preview usa `window.print()` para generar PDF — funcional pero básico.
- Los datos del cliente (IGV) se auto-detectan al seleccionar.
- Filtros de estado bien implementados con chips.
- El formulario no usa routing — cambia vista con `view = signal('list' | 'form')` manteniendo el estado.

**Qué mejorar:**
- No hay modo de editar una cotización existente — solo crear y cambiar su estado. Si el cliente pide modificar los ítems después de crear el borrador, no se puede.
- El print (`window.print()`) imprime toda la página incluido el sidebar — necesita `@media print { .sidebar { display: none } }`.
- La cotización no tiene campo de "nombre del proyecto" o "referencia interna".
- No hay acción de "Convertir a pedido" directamente desde la cotización ACEPTADA (hay `cotizacionId` en `CreatePedidoRequest` pero no hay botón en la UI).
- El número de cotización en el preview es `COT-2026-XXXX` hardcodeado — el número real viene del backend después de guardar.
- No hay opción de enviar la cotización por email directamente desde la UI.
- El descuento es en monto fijo (S/) — no hay opción de descuento porcentual.

**Propuestas concretas:**
1. Implementar "Editar cotización" cargando los detalles y pre-poblando el formulario.
2. Agregar botón "Convertir a pedido" en cotizaciones ACEPTADAS.
3. Agregar CSS de impresión que oculte el sidebar y header.

---

### 2.15 Clientes (`/clientes`)

**Qué hace bien:**
- CRUD completo con flujo Persona → Cliente al crear.
- Deshabilitación de campos de persona en modo edición (correcto).
- Validación de email, límite de crédito y descuento preferencial.
- Estados ACTIVO / INACTIVO / SUSPENDIDO / POTENCIAL.

**Qué mejorar:**
- No hay página de detalle de cliente con su historial de pedidos y cotizaciones.
- La tabla no muestra el número de documento del cliente.
- No hay filtro por tipo de cliente (PERSONA / EMPRESA) ni por estado.
- No hay columna de "último pedido" o "total comprado".
- El campo `limiteCredito` existe pero no hay ninguna validación en el POS que bloquee ventas cuando el cliente supere su límite.
- No hay campo de categoría de cliente (A, B, C por volumen de compra).
- La búsqueda solo filtra por `nombreCompleto`, `razonSocial` y `ruc`, no por `correo` ni teléfono.

**Propuestas concretas:**
1. Crear página `/clientes/:id` con historial de pedidos, cotizaciones y saldo de crédito usado.
2. Agregar filtros por tipo y estado.
3. Implementar validación de límite de crédito en el POS antes de finalizar la venta.

---

### 2.16 Proveedores (`/proveedores`)

**Qué hace bien:**
- Layout master-detail (lista + ficha) que evita navegación innecesaria.
- Tabs "Compras / Catálogo" dentro de la ficha.
- El catálogo del proveedor (qué materias primas suministra) con precios y condiciones.
- Upload de imagen del producto del proveedor.
- El primer proveedor se selecciona automáticamente al cargar.

**Qué mejorar:**
- La tab "Compras" en la ficha del proveedor no muestra nada — no hay implementación que cargue las OCs vinculadas al proveedor seleccionado (la lista de compras del proveedor).
- No hay filtro por estado en la lista de proveedores (ACTIVO / SUSPENDIDO).
- El "rubro" del proveedor es texto libre — debería ser un catálogo predefinido.
- No hay campo de `banco`, `cuenta bancaria` o `datos de pago` del proveedor.
- No hay campo de `correo de facturación` diferente al correo de contacto.
- No hay historial de precios en el catálogo (cuándo cambió el precio de la MP).

---

### 2.17 Seguridad — Usuarios / Empleados (`/empleados`)

**Qué hace bien:**
- Wizard de 2 pasos: datos personales → credenciales.
- Upload de foto y CV en el paso 1.
- Vista agrupada por departamento.
- Filtros por departamento, rol y estado.
- Panel de edición in-situ (sin modal separado).

**Qué mejorar:**
- El `formUsuario` tiene el campo `password` en edición con `[Validators.minLength(8)]`, pero si se deja vacío se interpreta como "no cambiar contraseña" (`v.password?.trim() ? { password: v.password.trim() } : {}`). Sin embargo, si el validador de minLength falla porque se escribió "abc" (< 8 chars), el formulario queda inválido. La validación debería ser condicional: si el campo está lleno, mínimo 8 caracteres.
- No hay campo de "salario" ni "fecha de inicio" del empleado.
- No hay registro de "último acceso" visible en la tarjeta del usuario.
- `intentosFallidos` existe en el modelo pero no se muestra en ninguna parte de la UI.
- No hay acción de "Desbloquear" para usuarios en estado BLOQUEADO.
- El CV subido (`urlCv`) se guarda en la persona pero no hay forma de verlo/descargarlo desde la UI de empleados.

---
![alt text](image.png)
### 2.18 Seguridad — Permisos RBAC (`/permisos-rbac`)

**Qué hace bien:**
- Matriz de permisos (rol × módulo × acciones CRUD) muy bien implementada.
- Toggle por celda individual o por fila completa.
- Feedback de éxito/error al guardar.
- Carga los módulos y roles disponibles dinámicamente.

**Qué mejorar:**
- Los permisos se guardan pero **no se usan en la UI** — no hay directiva o guard que oculte menús o botones según los permisos del usuario logueado. El `AuthService` solo expone `hasRole()` pero no `hasPermission(modulo, accion)`.
- No hay función "Copiar permisos de otro rol" que agilice la configuración.
- No hay preview de "qué ve este rol" en el sidebar.

---

### 2.19 E-commerce

**Qué hace bien:**
- `EcommerceOverview` agrega KPIs de pedidos web, ventas, cupones activos, banners activos.
- `EcommercePedidos` filtra por `canal === 'ECOMMERCE'` — comparte el mismo flujo de estados que los pedidos presenciales.
- Los banners tienen toggle activo/inactivo inline.
- Los cupones tienen tipo PORCENTAJE / MONTO_FIJO / ENVIO_GRATIS con límites de uso y monto mínimo.

**Qué mejorar:**
- `EcommerceOverview` usa `any[]` como tipo para `pedidosEcommerce`, `cupones` y `banners` — pérdida total del tipado TypeScript.
- `EcommerceProductos` no fue analizado en detalle pero su función es toggle `visibleEcommerce` — demasiado simple para estar en el sidebar como ítem separado. Podría ser una columna en la lista de productos.
- No hay módulo de "Pedidos pendientes de pago" que filtre los pedidos ECOMMERCE con `estadoPago === 'PENDIENTE'`.
- No hay integración de pasarela de pago visible.
- Los cupones no tienen campo de `descripcion` para mostrar al cliente.
- El `EcommerceBanners` usa template-driven forms (`FormsModule`) con `[(ngModel)]` a través del objeto `form: CreateBannerRequest` — inconsistente con el resto que usa reactive forms.
- No hay acceso al `banner-editor` desde la lista de banners (existe la ruta y el componente pero no hay link).

---

## 3. Análisis del Flujo de Usuario

### 3.1 Flujos principales y su coherencia

**Flujo A: Compra de materia prima → Stock**
1. Crear proveedor → ✅ implementado
2. Agregar MP al catálogo del proveedor → ✅ implementado
3. Crear OC → ✅ implementado
4. Agregar ítems a la OC desde el catálogo del proveedor → ✅ implementado
5. Marcar OC como "Recibida" → ✅ implementado
6. ¿Se crean los lotes en inventario automáticamente? → Depende del backend. El frontend no lo verifica ni muestra.
7. ¿El stock de la MP se actualiza? → No hay feedback visual al regresar a `/materia-prima`.

**Flujo B: Producción desde receta**
1. Crear receta con ingredientes → ✅ implementado
2. Calcular insumos → ✅ implementado
3. Crear OP desde la receta → ✅ navega a detalle
4. Insumos se pre-cargan automáticamente en la OP → ❌ Los insumos de la receta se registran en el backend al crear la OP desde receta, pero el tab "Insumos" carga vacío inicialmente y necesita un refresh. 
5. Agregar salidas → ✅ implementado
6. Completar OP → ✅ pide almacén y fecha vencimiento
7. ¿Se actualiza el stock en `/lotes`? → Depende del backend.

**Flujo C: Venta POS**
1. Seleccionar productos → ✅ con FEFO automático
2. Seleccionar cliente → ✅ con IGV automático
3. Seleccionar método de pago → ✅
4. Finalizar → ✅ crea Pedido + Detalles + Confirma en 3 llamadas API
5. ¿El pedido aparece en `/pedidos`? → ✅ debería si el backend funciona
6. ¿El stock se reduce inmediatamente? → ✅ recargarLotes() actualiza el catálogo del POS
7. ¿Se genera comprobante? → ❌ No hay factura, boleta ni ticket

**Flujo D: Cotización → Pedido**
1. Crear cotización → ✅ implementado
2. Marcar como "Enviada" → ✅
3. Marcar como "Aceptada" → ✅
4. Convertir a pedido → ❌ **FLUJO ROTO**: El campo `cotizacionId` existe en `CreatePedidoRequest` pero no hay botón en la UI de cotizaciones que genere el pedido. El operador debe ir manualmente al POS o a `/pedidos` sin referencia a la cotización.

### 3.2 Pasos que se pueden simplificar

1. **Crear lote manualmente**: El operador debe ir a `/lotes`, crear un lote, asignarlo a una presentación y un almacén. Debería poder crear el lote directamente desde la ficha de un producto.
2. **Ajuste de stock de MP**: El operador debe ir a `/materia-prima/:id/kardex` para registrar un ajuste. Debería haber un botón "Ajustar stock" en la lista de materias primas.
3. **Ver pedidos de un cliente**: No existe la vista. El operador debe buscar en `/pedidos` y filtrar manualmente.

### 3.3 Flujos rotos o incompletos

| Flujo | Estado | Descripción |
|-------|--------|-------------|
| Cotización → Pedido | ❌ Roto | Botón "Convertir a pedido" no existe |
| OC Recibida → Lotes creados | ⚠️ Opaco | El frontend no confirma que se crearon los lotes |
| Producción → Stock actualizado | ⚠️ Opaco | No hay retroalimentación visual tras completar OP |
| Empleado bloqueado → Desbloquear | ❌ Incompleto | No hay acción de desbloqueo en la UI |
| Editar cotización | ❌ Ausente | Solo crear, no editar |
| Editar receta | ❌ Ausente | Solo crear o archivar |
| Historial de precios de MP por proveedor | ❌ Ausente | Campo `motivoCambioPrecio` existe en el modelo pero no se muestra |
| Tab "Compras" en ficha proveedor | ❌ Vacía | No carga las OCs del proveedor |
| Impresión de cotización | ⚠️ Parcial | `window.print()` imprime el sidebar también |
| Impresión de pedido/ticket | ❌ Ausente | |

### 3.4 Navegación del sidebar

**Evaluación para un operador de snacks:**

El sidebar agrupa bien por áreas funcionales. Sin embargo:
- **"Inventario" como título de sección incluye Materias Primas y Producción** — para un operador, "Producción" debería estar bajo "Producción", no mezclado con "Inventario".
- El ítem "Materia Prima" está bajo la sección "Producción" del sidebar, pero su ruta `/materia-prima` está en el módulo Inventario. Esta es una inconsistencia conceptual.
- **"Empleados" está bajo "Administración"** como ítem de sidebar con ruta `/empleados`, pero la sección tiene nombre `/seguridad` en las rutas y `usuarios` en el componente. El sidebar dice "Empleados" pero la breadcrumb dice "Usuarios".
- "Facturación" y "Reportes" están marcados como "Pronto" pero ocupan espacio visual permanente — considerar mostrarlos solo cuando estén disponibles.
- No hay indicador de notificaciones en el sidebar (ej: "3 pedidos urgentes", "2 lotes por vencer").

---

## 4. Funcionalidades Faltantes o Incompletas

### 4.1 Páginas stub o sin implementación completa

| Página | Problema |
|--------|----------|
| `/ecommerce` → `EcommerceOverview` | Usa `any[]` para los datos; sin tipado |
| `/ecommerce/productos` | Sin analizar en detalle, pero su única función es toggle `visibleEcommerce` |
| Tab "Compras" en ficha de proveedor | Existe el tab pero no carga las OCs del proveedor |
| Dashboard — Gráfico ventas | Datos hardcodeados, no del API |
| Dashboard — Top productos | Hardcodeados |
| Dashboard — Actividad reciente | Hardcodeada |
| `banner-editor` | Existe el componente y la ruta pero no hay link en `EcommerceBanners` |

### 4.2 Acciones CRUD faltantes

| Módulo | Acción faltante |
|--------|----------------|
| Cotizaciones | Editar cotización existente |
| Recetas | Editar receta existente |
| Pedidos | Ver detalle completo con ítems |
| Clientes | Ver historial de pedidos del cliente |
| Proveedores | Ver historial de compras en la tab "Compras" |
| Usuarios | Desbloquear usuario bloqueado |
| Usuarios | Ver/descargar CV del empleado |
| Compras | Recepción parcial (recibir solo algunos ítems) |
| Compras | Registrar número de factura del proveedor al recibir |
| Cotizaciones | Convertir cotización aceptada en pedido |
| Lotes | Transferencia de stock entre almacenes |
| Producción | Editar receta |

### 4.3 Filtros, búsquedas o paginación faltantes

| Módulo | Filtro/Búsqueda faltante |
|--------|--------------------------|
| Productos | Filtro por categoría, almacén y estado (botones decorativos) |
| Lotes | Filtro por estado, almacén, producto |
| Kardex inventario | Filtro por fecha, tipo de movimiento; paginación |
| Pedidos | Filtro por canal, fecha, estado de pago |
| Materias primas | Agrupación/filtro por categoría |
| Cotizaciones | Filtro por rango de fechas |
| Compras | Filtro por rango de fechas |
| Proveedores | Filtro por estado |
| Usuarios | (tiene filtros) |
| Ecommerce pedidos | Filtro por estado de pago |

### 4.4 Exportación a PDF/Excel

| Módulo | Estado |
|--------|--------|
| Productos | Botón existe, sin handler |
| Cotizaciones | `window.print()` funcional pero imprime el sidebar también |
| Lotes | No existe |
| Kardex | No existe |
| Compras | No existe |
| Pedidos | No existe |
| Materias primas | No existe |
| Reportes | Ítem de sidebar marcado "Pronto", no implementado |

### 4.5 Dashboard — Widgets faltantes

Los siguientes widgets deberían estar pero no están:
1. **Ventas del día** con número real (actualmente hardcodeado a `S/ 12,480`).
2. **Compras del mes** (está en `DashboardResumen.comprasDelMes` pero no se muestra en ningún KPI).
3. **Mermas del mes** (campo `mermasDelMes` del modelo no aparece en la UI).
4. **Carritos activos** (`carritosActivos` del modelo no aparece en la UI).
5. **Tabla de lotes próximos a vencer** (top 5 con días restantes).
6. **OPs en curso** (filtrar `produccion` con estado EN_PROCESO).
7. **Ventas por canal** (pie chart: Presencial vs E-commerce vs WhatsApp).
8. **Top productos** con datos reales del API.
9. **Inventario por almacén** con datos reales del API.
10. **Actividad reciente** con datos reales del API.

---

## 5. Campos de Base de Datos Faltantes

### 5.1 Tabla `productos`

| Campo | Tipo | Motivo |
|-------|------|--------|
| `codigo_barras` | VARCHAR(20) | Para escaneo en POS y kardex; el código `SNK-XXXXXX` que se genera en frontend es ficticio |
| `codigo_interno` | VARCHAR(30) | Código propio del operador (ej: `SNACK-001`) |
| `precio_venta_base` | DECIMAL(10,2) | Precio de referencia del producto base (antes de segmentar por presentación) |
| `unidad_medida_base` | VARCHAR(20) | Unidad base para cálculos de producción (kg, L, unidad) |
| `controlar_por_lotes` | BOOLEAN | Si el producto requiere trazabilidad por lote o es de libre despacho |
| `permite_descuentos` | BOOLEAN | Si el producto puede recibir descuentos en POS/cotizaciones |
| `imagen_principal_id` | UUID | FK a tabla de archivos en vez de URL directa (más mantenible) |

### 5.2 Tabla `presentaciones` (presentacion_producto)

| Campo | Tipo | Motivo |
|-------|------|--------|
| `codigo_barras` | VARCHAR(20) | EAN-13 o QR del SKU específico para escaneo |
| `precio_compra` | DECIMAL(10,2) | El costo por presentación puede diferir del costo del producto base |
| `precio_mayorista` | DECIMAL(10,2) | Precio para clientes tipo EMPRESA vs PERSONA |
| `stock_minimo` | INT | Límite mínimo para alertas de reposición por presentación |
| `ubicacion_almacen` | VARCHAR(50) | Pasillo/estante en el almacén para picking |

### 5.3 Tabla `materias_primas`

| Campo | Tipo | Motivo |
|-------|------|--------|
| `categoria` | VARCHAR(50) o FK | Para agrupar (Frutas Deshidratadas, Semillas, Aditivos, Granos) |
| `proveedor_principal_id` | UUID FK `proveedores` | Enlace directo al proveedor principal sin pasar por el catálogo |
| `codigo_interno` | VARCHAR(30) | Código interno de almacén |
| `lugar_almacenamiento` | VARCHAR(100) | Instrucciones especiales de almacenaje (temperatura, luz) |
| `vida_util_dias` | INT | Para alertas automáticas de vencimiento al recibir |
| `densidad` | DECIMAL(8,4) | Para conversiones de volumen a masa en recetas |

### 5.4 Tabla `compras`

| Campo | Tipo | Motivo |
|-------|------|--------|
| `fecha_entrega_esperada` | DATE | Para medir puntualidad del proveedor |
| `fecha_entrega_real` | DATE | Para calcular desvíos y KPIs de proveedor |
| `nro_factura_proveedor` | VARCHAR(50) | Número de factura del proveedor para contabilidad |
| `nro_guia_remision` | VARCHAR(50) | Guía de remisión para control de entrada al almacén |
| `moneda` | VARCHAR(3) | PEN / USD para compras en dólares |
| `tipo_cambio` | DECIMAL(8,4) | Si la moneda es USD, el tipo de cambio al momento de la compra |
| `condicion_pago` | VARCHAR(50) | CONTADO / CREDITO / 30 DIAS |
| `almacen_destino_id` | UUID FK `almacenes` | A qué almacén ingresa la mercadería (actualmente se define al "recibir" lotes) |

### 5.5 Tabla `pedidos`

| Campo | Tipo | Motivo |
|-------|------|--------|
| `monto_recibido` | DECIMAL(10,2) | Para calcular el vuelto en ventas en efectivo desde el POS |
| `vuelto` | DECIMAL(10,2) | Calculado: monto_recibido - total |
| `observacion_entrega` | TEXT | Instrucciones de entrega (puerta, departamento, horario) |
| `codigo_seguimiento` | VARCHAR(50) | Código de tracking de la agencia de envío |
| `agencia_envio` | VARCHAR(100) | Nombre de la agencia (OLVA, SHALOM, etc.) |
| `fecha_promesa_entrega` | DATE | Fecha prometida al cliente |

### 5.6 Tabla `cotizaciones`

| Campo | Tipo | Motivo |
|-------|------|--------|
| `nombre_proyecto` | VARCHAR(150) | Referencia interna o nombre del proyecto cotizado |
| `tipo_descuento` | ENUM('MONTO','PORCENTAJE') | Para descuentos porcentuales además de monto fijo |
| `porcentaje_descuento` | DECIMAL(5,2) | Si tipo_descuento = PORCENTAJE |
| `version` | INT | Para versionado de cotizaciones revisadas |
| `cotizacion_padre_id` | UUID FK self | Para rastrear revisiones de la misma cotización |

### 5.7 Tabla `clientes`

| Campo | Tipo | Motivo |
|-------|------|--------|
| `categoria_cliente` | ENUM('A','B','C') | Segmentación por volumen de compra para políticas de precio |
| `saldo_credito_usado` | DECIMAL(10,2) | Para validación en POS del límite de crédito |
| `fecha_ultimo_pedido` | DATETIME | Para análisis de clientes inactivos |
| `total_comprado` | DECIMAL(12,2) | Acumulado histórico de compras |
| `correo_facturacion` | VARCHAR(150) | Email diferente al personal para envío de facturas |

### 5.8 Tabla `proveedores`

| Campo | Tipo | Motivo |
|-------|------|--------|
| `cuenta_bancaria` | VARCHAR(30) | Para transferencias de pago |
| `banco` | VARCHAR(50) | Banco del proveedor |
| `correo_facturacion` | VARCHAR(150) | Email para facturación |
| `correo_pedidos` | VARCHAR(150) | Email para envío de OCs |
| `calificacion` | TINYINT (1-5) | Calificación del proveedor por desempeño |

### 5.9 Tabla `recetas`

| Campo | Tipo | Motivo |
|-------|------|--------|
| `tiempo_produccion_minutos` | INT | Para planificación de capacidad |
| `temperatura_proceso` | VARCHAR(50) | Instrucciones técnicas de producción |
| `instrucciones_proceso` | TEXT | Pasos del proceso productivo |
| `costo_estimado_por_lote` | DECIMAL(10,2) | Calculado en base a ingredientes (podría ser computed) |
| `version` | INT | Para control de cambios en la receta |
| `receta_padre_id` | UUID FK self | Versiones anteriores de la misma receta |

### 5.10 Tabla `cupones` (e-commerce)

| Campo | Tipo | Motivo |
|-------|------|--------|
| `descripcion` | VARCHAR(255) | Texto descriptivo para mostrar al cliente en el carrito |
| `aplica_a` | ENUM('TODO','CATEGORIA','PRODUCTO') | Scope del cupón |
| `categoria_id` | UUID FK `categorias` | Si aplica_a = CATEGORIA |
| `producto_id` | UUID FK `productos` | Si aplica_a = PRODUCTO |
| `usos_por_cliente` | INT | Límite de usos por cliente (no solo total) |

---

## 6. Inconsistencias Técnicas

### 6.1 Formularios sin validación completa

**`product-form.ts`**
- Campo `precioVenta` (línea 75) sin `Validators.required` — el usuario puede guardar sin precio de venta y este dato se pierde.
- Campo `stockInicial` (línea 73) sin restricción máxima ni mínima explícita.
- No hay `CanDeactivate` guard para evitar pérdida de datos al navegar.

**`ecommerce-banners.ts`**
- El formulario es template-driven con binding directo `this.form = { titulo: '', urlImagen: '', ... }`. Usa `FormsModule` con `[(ngModel)]`. Inconsistente con el 100% del proyecto que usa reactive forms.
- La validación de URL se hace con `try { new URL(url) }` — válido pero no previene URLs locales o `javascript:` XSS.

**`recetas.ts`**
- Los ingredientes se validan con condicionales explícitos en `guardarReceta()` en lugar de usar `Validators` en un `FormArray`. Esto hace el formulario más difícil de mantener y no muestra errores en tiempo real.

**`cotizaciones.ts`**
- El formulario de cotización no usa `FormGroup` en absoluto — usa signals individuales (`clienteIdSignal`, `lineas`, `incluyeIgv`, `descuento`, etc.). Esto funciona pero es inconsistente con el patrón del resto del proyecto.
- El campo `descuento` (tipo `number`) no tiene validación de rango (puede ser negativo o mayor al subtotal).

**`compra-detalle.ts`**
- `editCantidad` y `editPrecio` son signals de string (`signal('')`) que se parsean con `parseFloat()` — si el usuario escribe "1,5" (coma decimal) en vez de "1.5", el resultado es `NaN` sin feedback al usuario.

**`produccion-detalle.ts`**
- Mismo patrón que compra-detalle: `editInsumoCant`, `editInsumoCosto`, etc. son strings parseados con `parseFloat`.

### 6.2 Componentes que hacen demasiado

**`ProduccionDetalle`** (507 líneas): Maneja insumos (CRUD completo), salidas (CRUD completo), mermas (CRUD completo), completar OP, iniciar proceso y cancelar — 8 modales diferentes en un solo componente. Debería dividirse en:
- `InsumoTabComponent`
- `SalidaTabComponent`
- `MermaTabComponent`

**`Proveedores`** (446 líneas): Maneja el CRUD de proveedor Y el CRUD del catálogo del proveedor con imágenes. Podría separar `ProveedorCatalogoComponent`.

**`Usuarios`** (287 líneas): Maneja wizard de creación, panel de edición, subida de archivos y eliminación todo en uno.

**`Cotizaciones`** (292 líneas TypeScript): El formulario y la lista en el mismo componente con 14+ signals y 3 dropdowns. El formulario debería ser un componente hijo `CotizacionFormComponent`.

### 6.3 Patrones mezclados

| Componente | Patrón usado | Inconsistencia |
|-----------|-------------|----------------|
| `EcommerceBanners` | Template-driven (`FormsModule`, `ngModel`) | Todos los demás usan Reactive Forms |
| `Cotizaciones` | Signals individuales (sin FormGroup) | Todos los demás usan FormBuilder |
| `Recetas` | FormBuilder para la receta base, signals para ingredientes | Debería usar `FormArray` |
| `Kardex` | `DatePipe` importado de `@angular/common` | El resto usa `FechaPipe` custom |

### 6.4 Signals y computed mal usados

**`ProductList` — `stockMap` computed** (líneas 49-73):
- Recalcula el mapa completo cada vez que cambia `presentaciones()` o `lotes()` — correcto.
- Pero `stockDe()` (línea 125) se llama en cada fila del template como método — en Angular Signals esto no es reactivo, es una llamada de método normal que no se beneficia de memoización. Debería ser parte del computed.

**`Pos` — IGV computation** (línea 76-79):
- `igv()` depende de `clienteSeleccionado()` y `subtotal()`. Correcto.
- Pero `clienteSeleccionado()` depende de `clienteIdSignal()` y `clientes()`. Si `clientes()` cambia (raro), el IGV se recalcula innecesariamente.

**`Dashboard`**:
- `topProducts` y `activity` son arrays normales de TypeScript (no signals) declarados como `readonly`. Si el backend devolviera datos para estas secciones, habría que cambiarlos a `signal()` y añadir lógica de carga. El diseño actual no admite datos dinámicos en esas secciones.

**`Usuarios` — `grupos` computed** (líneas 107-116):
- Usa `Map.entries()` y spread — correcto pero verboso. El agrupamiento se puede simplificar con `reduce`.

### 6.5 Subscripciones sin manejo de errores

Los siguientes lugares hacen `.subscribe()` sin handler `error`:

```typescript
// recetas.ts — líneas 82-83
this.presentacionService.listar().subscribe({ next: (d) => this.presentaciones.set(d) });
this.mpService.listar().subscribe({ next: (d) => this.materiasPrimas.set(d) });
```
Si estos endpoints fallan, los selects del formulario de receta quedan vacíos sin avisar al usuario.

```typescript
// produccion-detalle.ts — línea 167
this.svcOp.buscarPorId(id).subscribe({ next: (op) => this.op.set(op) });
// sin error handler en refrescarOP()
```

```typescript
// ecommerce-pedidos.ts — líneas 57-59
req$.subscribe({
  next: () => { ... },
  error: () => this.accionando.set(null),  // solo limpia el spinner, no muestra error al usuario
});
```

```typescript
// produccion-lista.ts — implícito en columnas
// El array this.columnas usa referencias a computed signals (this.planificadas, etc.)
// Esto no es un signal, es una referencia que se evalúa en el momento de la asignación
// y NO se actualiza reactivamente cuando cambian las señales.
```
Este último es un **bug potencial**: `columnas` es `const` con `items: this.planificadas` como propiedad. En la template se accede a `col.items()` lo que funciona porque Angular evalúa la función signal al renderizar, pero si se añaden más operaciones entre el componente y la template, esto puede fallar.

```typescript
// compra-detalle.ts — línea 127
this.compraService.buscarPorId(c.id).subscribe({ next: (u) => this.compra.set(u) });
// En refrescarTodo() también sin error handler
```

```typescript
// ecommerce-banners.ts — líneas 82-84
this.svc.actualizar(b.id, { activo: !b.activo }).subscribe({
  next: (actualizado) => this.banners.update(...)
});
// Sin error handler en toggleActivo()
```

---

## 7. Priorización de Mejoras

| # | Mejora | Módulo | Impacto | Esfuerzo | Prioridad |
|---|--------|--------|---------|----------|-----------|
| 1 | Conectar filtros Categoría/Estado/Almacén en lista de productos | Inventario | Alto | Bajo | **P1** |
| 2 | Dashboard con datos reales (ventas mensuales, actividad, top productos) | Dashboard | Alto | Alto | **P1** |
| 3 | Botón "Convertir a pedido" en cotizaciones ACEPTADAS | Ventas | Alto | Bajo | **P1** |
| 4 | Página de detalle de pedido con ítems (`/pedidos/:id`) | Ventas | Alto | Medio | **P1** |
| 5 | Campo código de barras en Presentación + búsqueda en POS | Ventas/POS | Alto | Medio | **P1** |
| 6 | Monto recibido / vuelto en POS | Ventas/POS | Alto | Bajo | **P1** |
| 7 | Tab "Compras" en ficha de proveedor (cargar OCs del proveedor) | Proveedores | Alto | Bajo | **P1** |
| 8 | Paginación en productos, lotes y kardex | Inventario | Alto | Medio | **P1** |
| 9 | CSS de impresión para cotizaciones (ocultar sidebar en print) | Ventas | Medio | Bajo | **P1** |
| 10 | Editar cotización existente | Ventas | Alto | Medio | **P2** |
| 11 | Editar receta existente | Producción | Alto | Medio | **P2** |
| 12 | Filtros por fecha en kardex de inventario | Inventario | Alto | Medio | **P2** |
| 13 | Campo `fechaEntregaEsperada` y `nroFacturaProveedor` en OC | Compras | Alto | Medio | **P2** |
| 14 | Historial de pedidos en ficha de cliente | Clientes | Alto | Medio | **P2** |
| 15 | Lotes próximos a vencer como widget en Dashboard | Dashboard | Alto | Bajo | **P2** |
| 16 | Filtros de fecha en lista de pedidos y compras | Ventas/Compras | Alto | Medio | **P2** |
| 17 | Botón "Ajustar stock" inline en lista de materias primas | Producción | Medio | Bajo | **P2** |
| 18 | `codigo_barras` en tabla `presentacion_producto` y buscar en POS | BD/Backend | Alto | Alto | **P2** |
| 19 | Desbloquear usuario desde la UI de empleados | Seguridad | Medio | Bajo | **P2** |
| 20 | Aplicar permisos RBAC en la UI (ocultar botones según permiso) | Seguridad | Alto | Alto | **P2** |
| 21 | Dividir ProduccionDetalle en subcomponentes de tab | Producción | Medio | Medio | **P3** |
| 22 | `CanDeactivate` guard en formulario de producto | Inventario | Medio | Bajo | **P3** |
| 23 | Exportar a Excel en productos, lotes, kardex, compras | Todos | Medio | Medio | **P3** |
| 24 | Remover campos fantasma del formulario de producto (`precioVenta`, `controlLotes`, `unidad`) | Inventario | Medio | Bajo | **P3** |
| 25 | Migrar `EcommerceBanners` a reactive forms | E-commerce | Bajo | Bajo | **P3** |
| 26 | Migrar formulario de cotizaciones a `FormGroup` | Ventas | Bajo | Bajo | **P3** |
| 27 | Agregar `error` handler en subscripciones secundarias (`recetas.ts` líneas 82-83, etc.) | Global | Bajo | Bajo | **P3** |
| 28 | Widget "Ventas por canal" en Dashboard (pie chart) | Dashboard | Medio | Medio | **P3** |
| 29 | Módulo de Reportes (ventas, compras, producción por período) | Reportes | Alto | Alto | **P3** |
| 30 | Facturación electrónica (SUNAT) | Ventas | Alto | Muy Alto | **P4** |
| 31 | Notificaciones en sidebar (pedidos urgentes, lotes por vencer) | Global | Medio | Alto | **P4** |
| 32 | Integración pasarela de pago (e-commerce) | E-commerce | Alto | Muy Alto | **P4** |
| 33 | Versioning de recetas | Producción | Medio | Alto | **P4** |
| 34 | Búsqueda global en el header (productos, clientes, pedidos) | Global | Medio | Alto | **P4** |

---

*Fin del análisis — 34 mejoras identificadas, 9 flujos rotos o incompletos documentados, 54 campos de base de datos faltantes propuestos con justificación específica.*
