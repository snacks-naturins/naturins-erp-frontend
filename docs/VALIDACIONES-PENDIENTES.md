# Validaciones Pendientes — Sistema Snacks Naturins ERP

> Documento generado del análisis del frontend Angular.
> Prioridad: **Alta** = bloquea datos correctos, **Media** = mala UX, **Baja** = mejora menor.

---

## 1. Clientes

| Campo | Problema | Prioridad | Fix sugerido |
|---|---|---|---|
| `correo` | Sin `Validators.email` — acepta cualquier texto como "abc123" | Alta | Agregar `Validators.email` al FormGroup |
| `limiteCredito` | Sin `Validators.min(0)` — puede guardarse negativo | Alta | `Validators.min(0)` |
| `descuentoPreferencial` | Sin rango — puede superar 100% | Media | `Validators.min(0), Validators.max(100)` |

---

## 2. Proveedores

| Campo | Problema | Prioridad | Fix sugerido |
|---|---|---|---|
| `correo` | Sin `Validators.email` | Alta | `Validators.email` |
| `diasCredito` | Sin validación — puede ser negativo o irracionalmente alto | Media | `Validators.min(0), Validators.max(365)` |
| `cantidadMinimaCompra` | Sin `Validators.min(0)` | Baja | `Validators.min(0)` |

---

## 3. Productos

| Campo | Problema | Prioridad | Fix sugerido |
|---|---|---|---|
| `stockMinimo` | Sin `Validators.min(0)` | Alta | `Validators.min(0)` |
| `stockCritico` | Sin `Validators.min(0)` — y no valida que sea ≤ stockMínimo | Alta | `Validators.min(0)` + validación cruzada |
| `precioVenta` (UI) | El campo existe en el form pero **no se persiste** en el backend | Alta | Eliminarlo del form o mapear al DTO |
| `stockInicial` (UI) | Ídem — visible pero se descarta silenciosamente | Alta | Eliminar o implementar en el DTO |
| `controlLotes` (UI) | Visible pero no se envía | Media | Eliminar o implementar |
| `precioCompra` | Sin `Validators.min(0)` | Media | `Validators.min(0)` |
| Campos nutricionales | `caloriasXPorcion`, `proteinas`, `carbohidratos`, `grasas`, `fibras` sin `min(0)` | Baja | `Validators.min(0)` |

---

## 4. Presentaciones

| Campo | Problema | Prioridad | Fix sugerido |
|---|---|---|---|
| `peso` | Sin `Validators.min(0)` — puede ser negativo | Alta | `Validators.min(0.001)` |

---

## 5. Lotes

| Campo | Problema | Prioridad | Fix sugerido |
|---|---|---|---|
| `stockLote` | `Validators.min(0)` permite crear un lote con 0 unidades | Media | Cambiar a `Validators.min(0.001)` |

---

## 6. Materias Primas

| Campo | Problema | Prioridad | Fix sugerido |
|---|---|---|---|
| `stockMinimo` | Sin validador — puede ser negativo | Media | `Validators.min(0)` |
| `stockCritico` | Sin validador — puede ser negativo | Media | `Validators.min(0)` |

---

## 7. Seguridad — Empleados (Usuarios)

| Campo | Problema | Prioridad | Fix sugerido |
|---|---|---|---|
| `password` al editar | Siempre requerida — no permite cambiar solo rol/departamento sin nueva contraseña | Alta | Hacer el campo opcional al editar; si está vacío, no enviar al backend |

---

## 8. Cupones (E-commerce)

| Campo | Problema | Prioridad | Fix sugerido |
|---|---|---|---|
| `valor` | Sin `min(0.01)` cuando tipo ≠ ENVIO_GRATIS | Alta | Validar `valor > 0` si tipo no es ENVIO_GRATIS |
| Fechas `fechaInicio` / `fechaFin` | No valida que `fechaInicio < fechaFin` | Alta | Validación cruzada de fechas |
| `codigo` | Sin formato mínimo — acepta espacios o código vacío tras trim | Media | `Validators.pattern(/^[A-Z0-9_-]{3,20}$/)` o similar |

---

## 9. Banners (E-commerce)

| Campo | Problema | Prioridad | Fix sugerido |
|---|---|---|---|
| `urlImagen` | Solo valida que no esté vacío — no valida formato URL | Media | `Validators.pattern` de URL o tipo `url` en input |
| `urlDestino` | Sin validación de formato | Baja | Validar formato URL si se ingresa |

---

## 10. Métodos de Pago

| Campo | Problema | Prioridad | Fix sugerido |
|---|---|---|---|
| `urlQr`, `numeroCelular`, `bancoNombre`, `numeroCuenta` | Sin ningún validador | Baja | Al menos `maxLength` según el tipo de campo |

---

## 11. Kardex (MovimientoInventario)

| Campo | Problema | Prioridad | Fix sugerido |
|---|---|---|---|
| `tipoReferencia` | Se envía con `as any` — el tipo del form es `string` pero el servicio espera un enum | Media | Tipar correctamente el form control con el enum `TipoReferencia` |

---

## 12. Problemas generales de UX

| Problema | Módulos afectados | Prioridad | Fix sugerido |
|---|---|---|---|
| `alert()` / `confirm()` nativos del navegador | ~~Recetas, Banners, Cupones, Descuentos~~ **Corregido** | — | Reemplazados por modales propios |
| Sin paginación en ningún listado | Todos | Media | Implementar paginación server-side con `?page=&size=` |
| Filtrado de pedidos ecommerce en el frontend | `EcommercePedidos`, `EcommerceOverview` | Media | Pasar `?canal=ECOMMERCE` como query param al backend |
| Dashboard con datos hardcodeados | `Dashboard` | Alta | Conectar KPI del día y gráficos al backend |
| Cotizaciones sin ruta de editar | `Cotizaciones` | Media | Agregar `/cotizaciones/:id/editar` |
| Mermas solo visibles en estado COMPLETADA | `ProduccionDetalle` | Baja | Remover la condición que oculta la pestaña |

---

## Resumen por prioridad

| Prioridad | Cantidad | Módulos |
|---|---|---|
| **Alta** | 12 | Clientes, Proveedores, Productos, Cupones, Empleados, Dashboard |
| **Media** | 9 | Lotes, Materias Primas, Banners, Kardex, EcommercePedidos, Cotizaciones |
| **Baja** | 5 | Métodos de Pago, Descuentos, ProduccionDetalle |

---

_Última actualización: 2026-07-09_
