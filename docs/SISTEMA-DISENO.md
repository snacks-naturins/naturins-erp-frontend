# Sistema de Diseño — SNACK-PRO ERP

> Identidad visual única y consistente para **todos** los módulos del ERP
> (Inventario, Producción, Compras, Ventas, Clientes, Facturación, etc.).
> Inspiración: **Odoo · ERPNext · SAP Fiori · Notion · Linear**.

La interfaz debe transmitir: **profesionalismo · orden · seguridad · rapidez
operativa · industria alimentaria premium · productos naturales**.

---

## Reglas globales (no negociables)

1. Todos los módulos reutilizan **exactamente** los mismos componentes.
2. No cambiar colores entre pantallas.
3. Mantener la misma jerarquía visual.
4. Misma altura de inputs (44px) y de botones (44px).
5. Mismos border-radius.
6. Mismos iconos (Angular Material Icons, estilo *Outlined*).
7. Diseño empresarial moderno tipo **ERP SaaS**.
8. Grids de **12 columnas**.
9. Todas las pantallas deben parecer parte de un mismo producto.

---

## 1. Tipografía

**Font Family:** `Poppins, sans-serif`

| Peso | Nombre |
|------|--------|
| 300 | Light |
| 400 | Regular |
| 500 | Medium |
| 600 | SemiBold |
| 700 | Bold |

### Escala tipográfica

| Token | Tamaño |
|-------|--------|
| Display | 36px |
| H1 | 32px |
| H2 | 28px |
| H3 | 24px |
| H4 | 20px |
| H5 | 18px |
| Body Large | 16px |
| Body | 14px |
| Small | 12px |
| Caption | 11px |

- **Line height:** 140%
- **Letter spacing:** 0.2px

---

## 2. Paleta corporativa

| Rol | Hex | Uso |
|-----|-----|-----|
| **Principal** (Marrón Naturin's) | `#9B4D00` | Sidebar, botones primarios, headers, menú activo |
| **Secundario** | `#F59E0B` | KPIs, gráficos, badges, estados destacados |
| **Accent** | `#A3C614` | Confirmaciones, producción, stock saludable |
| Fondo principal | `#F7F2E8` | Lienzo de la app |
| Fondo cards | `#FFFFFF` | Tarjetas y superficies |
| Texto principal | `#1F2937` | Títulos y cuerpo |
| Texto secundario | `#6B7280` | Subtítulos, descripciones |
| Bordes | `#E5E7EB` | Separadores, contornos sutiles |

---

## 3. Espaciado global (sistema de 8 puntos)

`4px · 8px · 16px · 24px · 32px · 48px · 64px`

### Padding por componente

| Componente | Padding |
|------------|---------|
| Cards | 24px |
| Formularios | 20px |
| Modales | 32px |
| Sidebar | 24px |

### Márgenes

| Entre… | Valor |
|--------|-------|
| Componentes | 16px |
| Secciones | 32px |
| Dashboards | 24px |

---

## 4. Border radius

| Elemento | Radius |
|----------|--------|
| Inputs | 10px |
| Cards | 16px |
| Botones | 10px |
| Modales | 18px |
| Tablas | 12px |

---

## 5. Sombras

| Uso | Valor |
|-----|-------|
| Cards | `0 2px 10px rgba(0,0,0,0.05)` |
| Hover | `0 6px 18px rgba(0,0,0,0.08)` |
| Modal | `0 20px 40px rgba(0,0,0,0.15)` |

---

## 6. Botones

Altura **44px** · Radius **10px** · Padding **12px 24px**.

| Tipo | Background | Texto | Borde | Hover |
|------|-----------|-------|-------|-------|
| **Primary** | `#9B4D00` | `#FFFFFF` | — | `#7C3E00` |
| **Secondary** | `#F59E0B` | `#FFFFFF` | — | opacity 90% |
| **Outline** | transparente | `#9B4D00` | `1px solid #9B4D00` | fondo claro |
| **Danger** | `#EF4444` | `#FFFFFF` | — | opacity 90% |

---

## 7. Inputs

| Propiedad | Valor |
|-----------|-------|
| Altura | 44px |
| Border | `1px solid #D1D5DB` |
| Focus | `2px solid #F59E0B` |
| Placeholder | `#9CA3AF` |
| Radius | 10px |

---

## 8. Tablas ERP

| Propiedad | Valor |
|-----------|-------|
| Encabezado — background | `#FAFAFA` |
| Encabezado — font-weight | 600 |
| Altura de fila | 52px |
| Hover de fila | `#FFF8EE` |
| Radius del contenedor | 12px |
| Paginación | abajo a la derecha |

---

## 9. Modales

| Tamaño | Ancho |
|--------|-------|
| Small | 480px |
| Medium | 720px |
| Large | 960px |

**Estructura:** Header · Body · Footer · Radius 18px · padding 32px.

- **Header:** fondo blanco, borde inferior.
- **Footer:** botones alineados a la derecha → **Cancelar** + **Guardar**.
- Sombra: `0 20px 40px rgba(0,0,0,0.15)`.
- Animación: **Fade + Scale**.

---

## 10. Alertas

| Tipo | Fondo | Color/Borde |
|------|-------|-------------|
| Success | `#DCFCE7` | `#22C55E` |
| Warning | `#FEF3C7` | `#F59E0B` |
| Error | `#FEE2E2` | `#EF4444` |
| Info | `#DBEAFE` | `#3B82F6` |

---

## 11. Toast notifications

- **Posición:** top-right
- **Duración:** 4 segundos
- **Animación:** Slide In

---

## 12. Sidebar

| Propiedad | Valor |
|-----------|-------|
| Ancho | 280px |
| Color de fondo | `#3D220A` |
| Elemento activo | background `#9B4D00` |
| Hover | `#5B2E05` |
| Texto | `#FFFFFF` |
| Padding | 24px |

---

## 13. Topbar

| Propiedad | Valor |
|-----------|-------|
| Altura | 72px |

**Elementos:** buscador global · notificaciones · alertas · perfil.

---

## 14. Iconografía

**Librería exclusiva:** Angular Material Icons (Mat Icons) · estilo **Outlined** · tamaño **20px**.

### Mapeo de iconos por módulo

| Módulo | Icono |
|--------|-------|
| Dashboard | `dashboard` |
| Inventario | `inventory_2` |
| Almacén | `warehouse` |
| Producción | `precision_manufacturing` |
| Compras | `shopping_cart` |
| Proveedores | `local_shipping` |
| Ventas | `point_of_sale` |
| Clientes | `groups` |
| E-commerce | `storefront` |
| Facturación | `receipt_long` |
| Seguridad | `admin_panel_settings` |
| Reportes | `analytics` |
| Usuarios | `person` |
| Roles | `badge` |
| Configuración | `settings` |

---

## 15. KPI Cards

| Propiedad | Valor |
|-----------|-------|
| Altura | 120px |
| Radius | 16px |

**Contenido:** icono · valor principal · descripción · variación %.

---

## 16. Gráficos

| Serie | Color |
|-------|-------|
| Ventas | `#F59E0B` |
| Producción | `#A3C614` |
| Compras | `#9B4D00` |
| Inventario | `#3B82F6` |

---

## 17. Animaciones

| Elemento | Comportamiento |
|----------|----------------|
| Duración base | 200ms |
| Hover en cards | scale 1.02 |
| Botones | opacity 90% |
| Modales | Fade + Scale |

---

## 18. Tokens listos para implementar

> Sugerencia: centralizar estos valores como variables CSS en `src/styles.css`
> para que **todos** los módulos los consuman desde un solo lugar.

```css
:root {
  /* ===== Colores ===== */
  --color-primary: #9B4D00;
  --color-primary-hover: #7C3E00;
  --color-secondary: #F59E0B;
  --color-accent: #A3C614;
  --bg-app: #F7F2E8;
  --bg-card: #FFFFFF;
  --text-primary: #1F2937;
  --text-secondary: #6B7280;
  --border: #E5E7EB;

  /* Sidebar */
  --sidebar-bg: #3D220A;
  --sidebar-active: #9B4D00;
  --sidebar-hover: #5B2E05;

  /* Estados */
  --success-bg: #DCFCE7; --success: #22C55E;
  --warning-bg: #FEF3C7; --warning: #F59E0B;
  --error-bg:   #FEE2E2; --error:   #EF4444;
  --info-bg:    #DBEAFE; --info:    #3B82F6;

  /* Gráficos */
  --chart-ventas: #F59E0B;
  --chart-produccion: #A3C614;
  --chart-compras: #9B4D00;
  --chart-inventario: #3B82F6;

  /* ===== Tipografía ===== */
  --font-family: 'Poppins', sans-serif;
  --line-height: 1.4;
  --letter-spacing: 0.2px;
  --fs-display: 36px;
  --fs-h1: 32px;
  --fs-h2: 28px;
  --fs-h3: 24px;
  --fs-h4: 20px;
  --fs-h5: 18px;
  --fs-body-lg: 16px;
  --fs-body: 14px;
  --fs-small: 12px;
  --fs-caption: 11px;

  /* ===== Espaciado (8pt) ===== */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 32px;
  --space-6: 48px;
  --space-7: 64px;

  /* ===== Border radius ===== */
  --radius-input: 10px;
  --radius-card: 16px;
  --radius-btn: 10px;
  --radius-modal: 18px;
  --radius-table: 12px;

  /* ===== Sombras ===== */
  --shadow-card: 0 2px 10px rgba(0,0,0,0.05);
  --shadow-hover: 0 6px 18px rgba(0,0,0,0.08);
  --shadow-modal: 0 20px 40px rgba(0,0,0,0.15);

  /* ===== Alturas ===== */
  --h-input: 44px;
  --h-btn: 44px;
  --h-row: 52px;
  --h-topbar: 72px;
  --w-sidebar: 280px;

  /* ===== Animación ===== */
  --transition: 200ms ease;
}
```

### Importar Poppins (en `index.html` o `styles.css`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

### Material Icons (Outlined)

```html
<link
  href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
  rel="stylesheet"
/>
```

```html
<!-- Uso -->
<span class="material-icons-outlined" style="font-size:20px">inventory_2</span>
```

---

## 19. Checklist de consistencia (antes de mergear una pantalla)

- [ ] Usa Poppins y la escala tipográfica definida.
- [ ] Solo usa colores de la paleta corporativa.
- [ ] Inputs y botones miden 44px de alto.
- [ ] Radios correctos (cards 16 / inputs 10 / modales 18 / tablas 12).
- [ ] Sombras según el catálogo.
- [ ] Iconos Material Outlined 20px y según el mapeo de módulo.
- [ ] Grid de 12 columnas.
- [ ] Espaciado múltiplo de 8.
- [ ] Reutiliza componentes compartidos (no recrea estilos locales).

---

_Última actualización: 2026-06-11_
