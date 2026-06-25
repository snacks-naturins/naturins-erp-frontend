# Roadmap de Mejoras — Naturin's ERP Frontend

**Versión:** 1.0  
**Fecha:** 2026-06-24  
**Base:** Análisis completo del estado actual del proyecto  
**Framework:** Angular 17+ · Signals · Tailwind CSS · Spring Boot 3.x

---

## Resumen ejecutivo

El frontend tiene **8 módulos funcionales** y una base de código sólida con Signals y Reactive Forms.  
Las mejoras se dividen en **6 fases** ordenadas por impacto/esfuerzo:

| Fase | Nombre | Esfuerzo estimado | Impacto |
|------|--------|-------------------|---------|
| 1 | Deuda técnica y quick wins | ~6h | 🔴 Crítico |
| 2 | Bugs funcionales activos | ~4h | 🔴 Crítico |
| 3 | Componentes compartidos | ~8h | 🟠 Alto |
| 4 | Dashboard real | ~6h | 🟠 Alto |
| 5 | Módulos incompletos | ~20h | 🟡 Medio |
| 6 | Módulos nuevos | ~40h | 🟢 Estratégico |

---

## Fase 1 — Deuda técnica y quick wins

> **Objetivo:** Eliminar duplicación de código y mejorar la experiencia básica.  
> **Esfuerzo total:** ~6 horas  
> **No requiere cambios en el backend**

---

### 1.1 — Pipe compartido de fechas
**Problema:** `formatFecha()` está copiada y pegada en 5+ componentes:
- `produccion-lista.ts`, `compras.ts`, `pedidos.ts`, `empleados.ts` (usuarios.ts), `proveedores.ts`

**Solución:** Crear `src/app/shared/pipes/fecha.pipe.ts`

```typescript
// src/app/shared/pipes/fecha.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fecha', standalone: true })
export class FechaPipe implements PipeTransform {
  transform(value: string | null | undefined, formato: 'corto' | 'largo' | 'relativo' = 'corto'): string {
    if (!value) return 'Nunca';
    const fecha = new Date(value);
    if (formato === 'relativo') return this.relativo(fecha);
    return fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: formato === 'largo' ? 'long' : 'short',
      year: 'numeric',
    });
  }

  private relativo(fecha: Date): string {
    const diff = Math.floor((Date.now() - fecha.getTime()) / 60000);
    if (diff < 1)   return 'Ahora mismo';
    if (diff < 60)  return `Hace ${diff} min`;
    if (diff < 1440) return `Hace ${Math.floor(diff / 60)}h`;
    return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }
}
```

**Uso en templates:**
```html
{{ u.ultimoAcceso | fecha }}
{{ pedido.fechaCreacion | fecha:'largo' }}
{{ pedido.fechaCreacion | fecha:'relativo' }}
```

**Archivos a actualizar:**
- Eliminar `formatFecha()` de: `usuarios.ts`, `compras.ts`, `pedidos.ts`, `produccion-lista.ts`
- Agregar `FechaPipe` en el `imports[]` de cada componente afectado

---

### 1.2 — Debounce en búsquedas
**Problema:** Las búsquedas en Clientes, Productos, Compras y POS ejecutan `computed()` en cada keystroke.

**Solución:** Función utilitaria con `toSignal` + `debounceTime`

```typescript
// src/app/shared/utils/signal-debounce.ts
import { signal, Signal } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';

export function debouncedSignal(source: Signal<string>, ms = 300): Signal<string> {
  return toSignal(toObservable(source).pipe(debounceTime(ms)), { initialValue: '' });
}
```

**Uso:**
```typescript
// En cada componente con búsqueda
readonly searchRaw = signal('');
readonly search    = debouncedSignal(this.searchRaw, 300);
// En el template: (input)="searchRaw.set($event.target.value)"
```

**Archivos a actualizar:**
- `clientes.ts`, `products-list.ts`, `compras.ts`, `pos.ts`

---

### 1.3 — Mensajes de validación por campo
**Problema:** Los formularios solo muestran borde rojo, sin texto explicativo.

**Solución:** Componente micro `FieldErrorComponent`

```typescript
// src/app/shared/components/field-error/field-error.ts
@Component({
  selector: 'app-field-error',
  standalone: true,
  template: `
    @if (control?.invalid && control?.touched) {
      <span class="mt-0.5 block text-[11px] text-red-500">
        @if (control?.errors?.['required'] || control?.errors?.['minlength']) { Campo obligatorio. }
        @if (control?.errors?.['email'])    { Email inválido. }
        @if (control?.errors?.['min'])      { Valor demasiado bajo. }
        @if (control?.errors?.['max'])      { Valor demasiado alto. }
        @if (control?.errors?.['pattern'])  { Formato inválido. }
      </span>
    }
  `,
})
export class FieldError {
  @Input() control?: AbstractControl | null;
}
```

**Uso en templates:**
```html
<input formControlName="nombre" ... />
<app-field-error [control]="form.get('nombre')" />
```

---

### 1.4 — Protección de doble-click en botones "Guardar"
**Problema:** Los botones de submit no bloquean envíos múltiples mientras `saving()` está en `true`.

**Solución:** Directiva `DisabledWhileSaving`

```typescript
// src/app/shared/directives/saving-btn.directive.ts
@Directive({ selector: 'button[appSavingBtn]', standalone: true })
export class SavingBtnDirective {
  @Input() appSavingBtn = false; // recibe la señal saving()
  @HostBinding('disabled') get disabled() { return this.appSavingBtn; }
  @HostBinding('class.opacity-60') get dimmed() { return this.appSavingBtn; }
}
```

---

## Fase 2 — Bugs funcionales activos

> **Objetivo:** Corregir datos que se pierden o comportamientos incorrectos.  
> **Esfuerzo total:** ~4 horas

---

### 2.1 — Campos de Producto que no se guardan
**Problema:** En `product-form.ts`, los campos `precioCompra`, `stockMinimo`, `stockCritico` y `descripcion` están en el form HTML pero **no se incluyen en el body del POST/PUT**.

**Archivos a cambiar:**
- `src/app/features/inventario/pages/product-form/product-form.ts`

**Fix:**
```typescript
// Agregar al body de crear() y actualizar():
precioCompra:  this.form.value.precioCompra   || 0,
stockMinimo:   this.form.value.stockMinimo    || 0,
stockCritico:  this.form.value.stockCritico   || 0,
descripcion:   this.form.value.descripcion    || '',
```

**Backend:** Verificar que `CreateProductoRequest` / `UpdateProductoRequest` incluyan estos campos.

---

### 2.2 — Dashboard con datos reales
Ver **Fase 4** — tiene sus propias tareas.

---

### 2.3 — Alertas de stock bajo en POS
**Problema:** El POS no alerta cuando `stockReal(pres) === 0` y el usuario intenta agregar al carrito.

**Fix en `pos.ts`:**
```typescript
agregarAlCarrito(pres: PresentacionResponse): void {
  if (this.stockReal(pres) === 0) {
    this.error.set(`Sin stock disponible para "${pres.nombre}"`);
    return;
  }
  // ... lógica actual
}
```

---

### 2.4 — Kardex: la tabla carga pero no muestra datos
**Problema:** El componente `kardex.ts` tiene señales `loading/error/movimientos` pero no está llamando al servicio en `ngOnInit()`.

**Fix:** Verificar `ngOnInit()` en `kardex.ts` y asegurar que llama a `this.svc.listar()` con el `productoId` del `ActivatedRoute`.

---

## Fase 3 — Componentes compartidos reutilizables

> **Objetivo:** Construir la librería `shared/` que evite reimplementar UI en cada módulo.  
> **Esfuerzo total:** ~8 horas  
> **Resultado:** Código 40% más corto en los módulos futuros

---

### 3.1 — Componente `<app-pagination>`

```typescript
// src/app/shared/components/pagination/pagination.ts
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [MatIconModule],
  template: `...` // prev/next + páginas
})
export class PaginationComponent {
  @Input()  total    = 0;
  @Input()  pagina   = 1;
  @Input()  porPagina = 20;
  @Output() cambio   = new EventEmitter<number>();

  get totalPaginas() { return Math.ceil(this.total / this.porPagina); }
  get paginas(): number[] {
    // muestra máximo 5 páginas alrededor de la actual
    const rango = 2;
    const inicio = Math.max(1, this.pagina - rango);
    const fin    = Math.min(this.totalPaginas, this.pagina + rango);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  }
}
```

**Dónde usar:** Clientes, Productos, Compras, Proveedores, Empleados.

**Patrón de implementación:**
```typescript
readonly pagina    = signal(1);
readonly porPagina = 20;
readonly paginados = computed(() => {
  const inicio = (this.pagina() - 1) * this.porPagina;
  return this.filtrados().slice(inicio, inicio + this.porPagina);
});
```

---

### 3.2 — Componente `<app-breadcrumb>`

```typescript
// src/app/shared/components/breadcrumb/breadcrumb.ts
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  template: `
    <nav class="flex items-center gap-1.5 text-xs text-text-muted">
      @for (item of items(); track item.label; let last = $last) {
        @if (!last) {
          <a [routerLink]="item.ruta" class="hover:text-text-main">{{ item.label }}</a>
          <mat-icon class="text-[14px]">chevron_right</mat-icon>
        } @else {
          <span class="font-medium text-text-main">{{ item.label }}</span>
        }
      }
    </nav>
  `
})
export class BreadcrumbComponent {
  @Input({ required: true }) items!: Signal<{ label: string; ruta?: string }[]>;
  // O bien recibe el array directamente
}
```

**Reemplaza** el bloque `<nav class="flex items-center gap-1.5...">` que está copiado en ~10 páginas.

---

### 3.3 — Componente `<app-confirm-dialog>`

```typescript
// src/app/shared/components/confirm-dialog/confirm-dialog.ts
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="w-full max-w-sm rounded-modal bg-white p-6 shadow-2xl">
          <div class="flex items-center gap-3 mb-4">
            <div class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-100">
              <mat-icon class="text-red-600">{{ icono() }}</mat-icon>
            </div>
            <div>
              <p class="font-semibold text-text-main">{{ titulo() }}</p>
              <p class="text-sm text-text-muted">{{ subtitulo() }}</p>
            </div>
          </div>
          <p class="text-sm text-text-muted mb-5">{{ mensaje() }}</p>
          <div class="flex gap-3">
            <button (click)="cancelar.emit()" class="flex-1 ...">Cancelar</button>
            <button (click)="confirmar.emit()" class="flex-1 ... bg-red-600 text-white">{{ labelConfirmar() }}</button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmDialog {
  @Input() open       = signal(false);
  @Input() titulo     = signal('¿Confirmar acción?');
  @Input() subtitulo  = signal('');
  @Input() mensaje    = signal('Esta acción no se puede deshacer.');
  @Input() icono      = signal('warning');
  @Input() labelConfirmar = signal('Confirmar');
  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar  = new EventEmitter<void>();
}
```

**Reemplaza** los bloques `<!-- Confirm delete -->` en 8+ componentes.

---

### 3.4 — Componente `<app-empty-state>`

```html
<!-- Reemplaza los bloques de estado vacío en todas las páginas -->
<app-empty-state
  icono="inventory_2"
  titulo="Sin productos"
  descripcion="Crea el primer producto"
  labelCta="Crear producto"
  (cta)="abrirCrear()" />
```

---

### 3.5 — Toast/Snackbar global

**Problema:** Los errores y éxitos se muestran en banners locales que desaparecen solo si el usuario hace click en X.

**Solución:** Servicio global de notificaciones tipo toast

```typescript
// src/app/core/services/toast.service.ts
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info', duracion = 3500) {
    const id = Date.now();
    this.toasts.update(t => [...t, { id, mensaje, tipo }]);
    setTimeout(() => this.dismiss(id), duracion);
  }

  success(msg: string) { this.show(msg, 'success'); }
  error(msg: string)   { this.show(msg, 'error');   }
  dismiss(id: number)  { this.toasts.update(t => t.filter(x => x.id !== id)); }
}
```

El `ToastContainerComponent` va en el `MainLayout` y se suscribe al servicio.

---

## Fase 4 — Dashboard con datos reales

> **Objetivo:** Reemplazar todos los datos hardcodeados por llamadas reales.  
> **Esfuerzo total:** ~6 horas

### KPIs a implementar

| KPI | Endpoint backend |
|-----|-----------------|
| Ventas del día | `GET /api/pedidos?estado=ENTREGADO&fecha=hoy` → suma total |
| Pedidos pendientes | `GET /api/pedidos?estado=NUEVO,EN_PROCESO` → count |
| Órdenes de compra pendientes | `GET /api/compras?estado=PENDIENTE` → count |
| Productos con stock bajo | `GET /api/presentaciones?stockBajo=true` → count |
| Top 5 productos más vendidos | Requiere endpoint nuevo en backend |
| Ventas últimos 7 días | Requiere endpoint nuevo en backend |

### Endpoints nuevos necesarios en backend

```
GET /api/dashboard/resumen
→ {
    ventasHoy: number,
    pedidosPendientes: number,
    comprasPendientes: number,
    productosBajoStock: number,
    ingresosEsteMes: number
  }

GET /api/dashboard/ventas-semana
→ [{ fecha: "2026-06-18", total: 1250.50 }, ...]

GET /api/dashboard/top-productos
→ [{ nombre: "Granola Mix", cantidad: 42 }, ...]
```

### Gráficas (Chart.js ya instalado)
- **Línea:** Ventas de los últimos 7 días
- **Barras:** Ventas por canal (PRESENCIAL, DELIVERY, etc.)
- **Dona:** Distribución de pedidos por estado
- **Tarjetas:** KPIs principales con trend (↑ vs semana anterior)

---

## Fase 5 — Completar módulos existentes

> **Esfuerzo total estimado:** ~20 horas

---

### 5.1 — Producción: gestión completa de órdenes

**Estado actual:** Solo crea órdenes, sin edición ni gestión de items.

**Tareas:**
1. **Detalle de orden** — nueva página `/produccion/:id`
   - Ver ingredientes (materia prima) con cantidades
   - Ver estado de la producción
   - Registrar producción completada (→ aumenta stock de presentaciones)
2. **Editar orden** — modal de edición de cabecera
3. **Gestión de items** — agregar/quitar presentaciones a producir
4. **Flujo de estados:** `PENDIENTE → EN_PROCESO → COMPLETADO → CANCELADO`

**Archivos nuevos:**
```
features/produccion/pages/
├── produccion-lista/    (existente, ampliar)
└── produccion-detalle/  (nuevo)
    ├── produccion-detalle.ts
    └── produccion-detalle.html
```

---

### 5.2 — Kardex: vista funcional

**Estado actual:** Componente existe pero aparentemente no carga datos.

**Tareas:**
1. Verificar y reparar la llamada al servicio en `ngOnInit()`
2. Filtro por producto + rango de fechas
3. Tabla con: fecha, tipo movimiento (ENTRADA/SALIDA/AJUSTE), cantidad, stock resultante, referencia
4. Indicador visual del tipo de movimiento (verde/rojo/gris)
5. Exportar a CSV (botón simple con `Blob`)

---

### 5.3 — Compras: recepción de mercadería

**Estado actual:** El flujo termina en "Confirmar recibir" pero no actualiza el Kardex.

**Tareas:**
1. Al confirmar recepción → llamar endpoint que genera movimiento de ENTRADA en Kardex
2. Mostrar confirmación con detalle de lo recibido
3. Enlace directo desde la OC al movimiento de Kardex generado

---

### 5.4 — Lotes: gestión visual

**Estado actual:** Probablemente stub o muy básico.

**Tareas:**
1. Lista de lotes con filtro por producto y estado (vigente/vencido/próximo a vencer)
2. Indicador visual de proximidad a vencimiento (verde/amarillo/rojo según días restantes)
3. Acción de ajuste manual de stock por lote

---

### 5.5 — Pedidos: flujo de pago

**Estado actual:** El pedido llega a estado ENTREGADO pero sin registrar el cobro.

**Tareas:**
1. Modal "Registrar pago" en pedidos con estado ENTREGADO
2. Campos: método de pago, monto recibido, vuelto
3. Generar comprobante básico (referencia de pago)
4. Vincular con el módulo de Facturación (Fase 6)

---

## Fase 6 — Módulos nuevos

> **Esfuerzo total estimado:** ~40 horas

---

### 6.1 — Módulo Reportes

**Ruta:** `/reportes`  
**Estimado:** ~12h

**Sub-páginas:**

| Reporte | Descripción |
|---------|-------------|
| Ventas por período | Filtro fecha, agrupado por día/semana/mes, exportar CSV |
| Stock actual | Todas las presentaciones con stock actual y mínimo |
| Movimientos de Kardex | Historial completo con filtros |
| Compras por proveedor | Resumen de OC por proveedor y período |
| Productos más vendidos | Ranking con cantidades y montos |
| Empleados activos | Lista con último acceso y rol |

**Estructura:**
```
features/reportes/
├── pages/
│   ├── reporte-ventas/
│   ├── reporte-stock/
│   ├── reporte-compras/
│   └── reporte-empleados/
├── services/reporte.service.ts
└── reportes.routes.ts
```

**Endpoints backend necesarios:**
```
GET /api/reportes/ventas?desde=&hasta=&agrupar=DIA|SEMANA|MES
GET /api/reportes/stock-actual
GET /api/reportes/compras?proveedorId=&desde=&hasta=
GET /api/reportes/productos-vendidos?top=10&desde=&hasta=
```

---

### 6.2 — Módulo Facturación / Comprobantes

**Ruta:** `/facturacion`  
**Estimado:** ~15h

**Funcionalidades:**

1. **Lista de comprobantes** — boletas y facturas generadas
2. **Generar comprobante** desde un Pedido con estado ENTREGADO
3. **Vista de comprobante** — número, cliente, items, IGV, total
4. **Impresión / PDF** — usando `window.print()` o `jsPDF`
5. **Series y correlativo** — configuración de B001, F001, etc.

**Modelo:**
```typescript
interface Comprobante {
  id: string;
  tipo: 'BOLETA' | 'FACTURA' | 'NOTA_CREDITO';
  serie: string;
  numero: number;
  pedidoId: string;
  clienteId: string;
  subtotal: number;
  igv: number;
  total: number;
  estado: 'EMITIDO' | 'ANULADO';
  fechaEmision: string;
}
```

---

### 6.3 — Enforcement de permisos RBAC en el frontend

**Estado actual:** La matriz RBAC existe pero ningún componente la consulta para ocultar/deshabilitar funciones.

**Implementación:**

```typescript
// src/app/core/services/permiso-usuario.service.ts
@Injectable({ providedIn: 'root' })
export class PermisoUsuarioService {
  private readonly auth = inject(AuthService);
  private readonly svc  = inject(PermisoService);

  private permisos = signal<RolModuloResponse[]>([]);

  cargarPermisos(): void {
    const rolId = this.auth.currentUser()?.rolId;
    if (rolId) this.svc.listarPorRol(rolId).subscribe(p => this.permisos.set(p));
  }

  puede(modulo: string, accion: 'ver' | 'crear' | 'editar' | 'eliminar'): boolean {
    const p = this.permisos().find(x => x.nombreModulo.toUpperCase() === modulo.toUpperCase());
    if (!p) return false;
    switch (accion) {
      case 'ver':      return p.puedeVer;
      case 'crear':    return p.puedeCrear;
      case 'editar':   return p.puedeEditar;
      case 'eliminar': return p.puedeEliminar;
    }
  }
}
```

**Directiva `*appPuede`:**
```typescript
// src/app/shared/directives/puede.directive.ts
@Directive({ selector: '[appPuede]', standalone: true })
export class PuedeDirective implements OnInit {
  @Input('appPuede') modulo = '';
  @Input('appPuedeAccion') accion: 'ver' | 'crear' | 'editar' | 'eliminar' = 'ver';

  constructor(private vc: ViewContainerRef, private tpl: TemplateRef<any>,
              private permisos: PermisoUsuarioService) {}

  ngOnInit() {
    if (this.permisos.puede(this.modulo, this.accion)) {
      this.vc.createEmbeddedView(this.tpl);
    }
  }
}
```

**Uso en templates:**
```html
<button *appPuede="'VENTAS'; accion: 'crear'">Nueva venta</button>
<button *appPuede="'INVENTARIO'; accion: 'eliminar'">Eliminar producto</button>
```

---

### 6.4 — Exportar a PDF / CSV

**Paquetes sugeridos:**
- PDF: `jsPDF` + `jspdf-autotable` (sin dependencias pesadas)
- CSV: generación nativa con `Blob` (sin librerías)

**Servicio compartido:**
```typescript
// src/app/shared/services/exportar.service.ts
@Injectable({ providedIn: 'root' })
export class ExportarService {
  exportarCsv(datos: Record<string, any>[], nombreArchivo: string): void {
    const encabezados = Object.keys(datos[0]).join(',');
    const filas = datos.map(d => Object.values(d).join(','));
    const csv = [encabezados, ...filas].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${nombreArchivo}.csv`;
    link.click();
  }

  exportarPdf(titulo: string, columnas: string[], filas: any[][], nombreArchivo: string): void {
    // Implementar con jsPDF + autoTable
  }
}
```

---

## Checklist de implementación

Orden recomendado para no bloquear trabajo en paralelo:

```
FASE 1 — Deuda técnica
  [x] 1.1 Crear FechaPipe y reemplazar formatFecha() en todos los componentes
  [x] 1.2 Crear debouncedSignal() y aplicar en búsquedas
  [x] 1.3 Crear FieldErrorComponent y aplicar en formularios clave
  [x] 1.4 Aplicar protección de doble-click en botones (SavingBtnDirective)

FASE 2 — Bugs funcionales
  [x] 2.1 Reparar campos de Producto (precioCompra, stockMinimo, stockCritico) — backend + frontend
  [x] 2.2 Reparar Kardex (ya tenía ngOnInit funcional — verificado)
  [x] 2.3 Agregar alerta de stock 0 en POS (cartAlert con auto-dismiss 3s)

FASE 3 — Componentes compartidos
  [x] 3.1 Crear PaginationComponent
  [x] 3.2 Crear BreadcrumbComponent y reemplazar navs manuales (13 páginas)
  [x] 3.3 Crear ConfirmDialogComponent
  [x] 3.4 Crear EmptyStateComponent y reemplazar empty-states manuales (7 páginas)
  [x] 3.5 Crear ToastService + ToastContainerComponent (montado en MainLayout)

FASE 4 — Dashboard real
  [ ] 4.1 Diseñar y crear endpoint GET /api/dashboard/resumen en backend
  [ ] 4.2 Diseñar y crear endpoint GET /api/dashboard/ventas-semana
  [ ] 4.3 Implementar DashboardService en frontend
  [ ] 4.4 Reemplazar datos hardcodeados por llamadas al servicio
  [ ] 4.5 Conectar gráficas de Chart.js con datos reales

FASE 5 — Módulos incompletos
  [ ] 5.1 Producción: página de detalle de orden
  [ ] 5.2 Producción: gestión de items y cambio de estado
  [ ] 5.3 Kardex: verificar carga, agregar filtros y export CSV
  [ ] 5.4 Compras: vincular recepción con Kardex
  [ ] 5.5 Lotes: indicadores visuales de vencimiento
  [ ] 5.6 Pedidos: modal de registro de pago

FASE 6 — Módulos nuevos
  [ ] 6.1 Reportes: ventas por período
  [ ] 6.2 Reportes: stock actual
  [ ] 6.3 Reportes: compras por proveedor
  [ ] 6.4 Facturación: lista y generación de comprobantes
  [ ] 6.5 Facturación: vista imprimible / PDF
  [ ] 6.6 RBAC: PermisoUsuarioService + directiva *appPuede
  [ ] 6.7 Exportar CSV en Pedidos y Compras
```

---

## Estimados de tiempo por fase

| Fase | Tareas | Horas backend | Horas frontend | Total |
|------|--------|---------------|----------------|-------|
| 1 — Deuda técnica | 4 | 0h | ~6h | **6h** |
| 2 — Bugs funcionales | 3 | ~2h | ~2h | **4h** |
| 3 — Componentes compartidos | 5 | 0h | ~8h | **8h** |
| 4 — Dashboard real | 5 | ~4h | ~4h | **8h** |
| 5 — Módulos incompletos | 6 | ~8h | ~12h | **20h** |
| 6 — Módulos nuevos | 7 | ~20h | ~20h | **40h** |
| **TOTAL** | **30** | **~34h** | **~52h** | **~86h** |

---

*Documento generado el 2026-06-24 — actualizar con cada fase completada.*
