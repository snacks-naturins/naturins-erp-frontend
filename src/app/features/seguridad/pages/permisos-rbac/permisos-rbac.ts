import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';

import { RolService }    from '../../services/rol.service';
import { PermisoService } from '../../services/permiso.service';
import { RolResponse }   from '../../models/rol.model';
import { MatrizRow }     from '../../models/modulo.model';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';

type CampoAccion = 'puedeVer' | 'puedeCrear' | 'puedeEditar' | 'puedeEliminar';

@Component({
  selector: 'app-permisos-rbac',
  standalone: true,
  imports: [MatIconModule, BreadcrumbComponent, EmptyState],
  templateUrl: './permisos-rbac.html',
})
export class PermisosRbac implements OnInit {
  private readonly svcRol     = inject(RolService);
  private readonly svcPermiso = inject(PermisoService);

  readonly loading  = signal(true);
  readonly saving   = signal(false);
  readonly error    = signal<string | null>(null);
  readonly success  = signal(false);

  readonly roles     = signal<RolResponse[]>([]);
  readonly rolActivo = signal<string>('');
  readonly matriz    = signal<MatrizRow[]>([]);

  readonly acciones: { key: CampoAccion; label: string; icono: string }[] = [
    { key: 'puedeVer',      label: 'Ver',      icono: 'visibility'   },
    { key: 'puedeCrear',    label: 'Crear',    icono: 'add_circle'   },
    { key: 'puedeEditar',   label: 'Editar',   icono: 'edit'         },
    { key: 'puedeEliminar', label: 'Eliminar', icono: 'delete'       },
  ];

  private readonly SECCIONES: Record<string, string> = {
    'Dashboard':      'General',
    'Inventario':     'Inventario', 'Almacenes':    'Inventario', 'Presentaciones': 'Inventario',
    'Lotes':          'Inventario', 'Kardex':       'Inventario',
    'Producción':     'Producción', 'Materia Prima':'Producción', 'Recetas':        'Producción',
    'Compras':        'Compras & Proveedores', 'Proveedores': 'Compras & Proveedores',
    'Ventas':         'Ventas', 'Cotizaciones': 'Ventas', 'Pedidos':         'Ventas',
    'Clientes':       'Ventas', 'Métodos de Pago': 'Ventas',
    'E-Commerce':     'E-Commerce', 'Catálogo Web': 'E-Commerce', 'Banners':        'E-Commerce',
    'Cupones':        'E-Commerce', 'Descuentos':  'E-Commerce', 'Pedidos Web':    'E-Commerce',
    'Empleados':      'Administración', 'Roles':    'Administración', 'Departamentos': 'Administración',
    'Seguridad':      'Administración', 'Permisos RBAC': 'Administración',
    'Facturación':    'Finanzas',  'Reportes':    'Finanzas',
  };

  private readonly SECCION_ICONOS: Record<string, string> = {
    'General':                'home',
    'Inventario':             'inventory_2',
    'Producción':             'precision_manufacturing',
    'Compras & Proveedores':  'shopping_cart',
    'Ventas':                 'point_of_sale',
    'E-Commerce':             'storefront',
    'Administración':         'admin_panel_settings',
    'Finanzas':               'receipt_long',
  };

  private seccionDe(nombre: string): string {
    return this.SECCIONES[nombre] ?? 'Otros';
  }

  seccionIcono(seccion: string): string {
    return this.SECCION_ICONOS[seccion] ?? 'apps';
  }

  readonly matrizConSecciones = computed(() => {
    let lastSec = '';
    return this.matriz().map(row => {
      const sec = this.seccionDe(row.nombre);
      const isFirst = sec !== lastSec;
      lastSec = sec;
      return { row, seccion: sec, isFirst };
    });
  });

  ngOnInit(): void {
    forkJoin([this.svcRol.listar(), this.svcPermiso.listarModulos()]).subscribe({
      next: ([roles, modulos]) => {
        this.roles.set(roles);
        const baseMatriz: MatrizRow[] = modulos
          .sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99))
          .map((m) => ({
            moduloId:      m.id,
            nombre:        m.nombre,
            icono:         m.icono ?? 'apps',
            puedeVer:      false,
            puedeCrear:    false,
            puedeEditar:   false,
            puedeEliminar: false,
          }));
        this.matriz.set(baseMatriz);
        if (roles.length > 0) this.seleccionarRol(roles[0].id);
        else this.loading.set(false);
      },
      error: () => { this.error.set('Error al cargar datos.'); this.loading.set(false); },
    });
  }

  seleccionarRol(rolId: string): void {
    this.rolActivo.set(rolId);
    this.loading.set(true);
    this.success.set(false);
    this.svcPermiso.listarPorRol(rolId).subscribe({
      next: (permisos) => {
        this.matriz.update((rows) =>
          rows.map((row) => {
            const p = permisos.find((x) => x.moduloId === row.moduloId);
            return p
              ? { ...row, puedeVer: p.puedeVer, puedeCrear: p.puedeCrear, puedeEditar: p.puedeEditar, puedeEliminar: p.puedeEliminar }
              : { ...row, puedeVer: false, puedeCrear: false, puedeEditar: false, puedeEliminar: false };
          })
        );
        this.loading.set(false);
      },
      error: () => { this.error.set('Error al cargar permisos.'); this.loading.set(false); },
    });
  }

  toggle(moduloId: string, campo: CampoAccion): void {
    this.matriz.update((rows) =>
      rows.map((r) => r.moduloId === moduloId ? { ...r, [campo]: !r[campo] } : r)
    );
  }

  toggleFila(moduloId: string, activar: boolean): void {
    this.matriz.update((rows) =>
      rows.map((r) =>
        r.moduloId === moduloId
          ? { ...r, puedeVer: activar, puedeCrear: activar, puedeEditar: activar, puedeEliminar: activar }
          : r
      )
    );
  }

  todosMarcados(moduloId: string): boolean {
    const r = this.matriz().find((x) => x.moduloId === moduloId);
    return !!r && r.puedeVer && r.puedeCrear && r.puedeEditar && r.puedeEliminar;
  }

  guardar(): void {
    if (this.saving() || !this.rolActivo()) return;
    this.saving.set(true);
    this.error.set(null);
    this.success.set(false);
    this.svcPermiso.actualizarBulk(this.rolActivo(), {
      items: this.matriz().map((r) => ({
        moduloId:      r.moduloId,
        puedeVer:      r.puedeVer,
        puedeCrear:    r.puedeCrear,
        puedeEditar:   r.puedeEditar,
        puedeEliminar: r.puedeEliminar,
      })),
    }).subscribe({
      next: () => { this.saving.set(false); this.success.set(true); },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Error al guardar permisos.'); },
    });
  }

  rolNombre(id: string): string {
    return this.roles().find((r) => r.id === id)?.nombre ?? '';
  }
}
