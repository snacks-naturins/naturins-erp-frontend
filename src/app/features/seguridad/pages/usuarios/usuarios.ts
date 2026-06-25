import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of, switchMap } from 'rxjs';

import { UsuarioService }     from '../../services/usuario.service';
import { RolService }         from '../../services/rol.service';
import { DepartamentoService } from '../../services/departamento.service';
import { UsuarioResponse }    from '../../models/usuario.model';
import { RolResponse }        from '../../models/rol.model';
import { DepartamentoResponse } from '../../models/departamento.model';

import { TipoDocumentoService } from '../../../../core/services/tipo-documento.service';
import { TipoDocumentoResponse } from '../../../../core/models/tipo-documento.model';
import { ArchivoService } from '../../../../core/services/archivo.service';
import { FechaPipe } from '../../../../shared/pipes/fecha.pipe';
import { debouncedSignal } from '../../../../shared/utils/debounce';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, FechaPipe, BreadcrumbComponent],
  templateUrl: './usuarios.html',
})
export class Usuarios implements OnInit {
  private readonly svcUsuario = inject(UsuarioService);
  private readonly svcRol     = inject(RolService);
  private readonly svcDep     = inject(DepartamentoService);
  private readonly svcTipoDoc = inject(TipoDocumentoService);
  private readonly svcArchivo = inject(ArchivoService);
  private readonly fb         = inject(FormBuilder);

  readonly loading  = signal(true);
  readonly saving   = signal(false);
  readonly error    = signal<string | null>(null);

  readonly usuarios      = signal<UsuarioResponse[]>([]);
  readonly roles         = signal<RolResponse[]>([]);
  readonly departamentos = signal<DepartamentoResponse[]>([]);
  readonly tiposDocs     = signal<TipoDocumentoResponse[]>([]);

  readonly search           = signal('');
  readonly searchDebounced  = debouncedSignal(this.search);
  readonly filtroDep        = signal('');
  readonly filtroRol    = signal('');
  readonly filtroEstado = signal('');

  // ── Archivos wizard ───────────────────────────────────────────
  readonly fotoPreview  = signal<string | null>(null);
  readonly fotoArchivo  = signal<File | null>(null);
  readonly cvArchivo    = signal<File | null>(null);
  readonly cvNombre     = computed(() => this.cvArchivo()?.name ?? '');

  // ── Wizard crear ──────────────────────────────────────────────
  readonly wizardOpen = signal(false);
  readonly wizardStep = signal<1 | 2>(1);
  readonly personaId  = signal<string | null>(null);

  readonly formPersona = this.fb.group({
    tipoDocumentoId: ['', Validators.required],
    numeroDocumento: ['', [Validators.required, Validators.maxLength(20)]],
    nombres:         ['', [Validators.required, Validators.maxLength(100)]],
    apellidos:       ['', [Validators.required, Validators.maxLength(100)]],
    telefono:        ['', Validators.maxLength(15)],
    correo:          ['', [Validators.email, Validators.maxLength(150)]],
    direccion:       ['', Validators.maxLength(255)],
  });

  readonly formUsuario = this.fb.group({
    username:       ['', [Validators.required, Validators.minLength(4), Validators.maxLength(50)]],
    password:       ['', [Validators.required, Validators.minLength(8), Validators.maxLength(50)]],
    rolId:          ['', Validators.required],
    departamentoId: [''],
    urlAvatar:      [''],
    estado:         ['ACTIVO', Validators.required],
  });

  // ── Panel edición ─────────────────────────────────────────────
  readonly editandoUsuario = signal<UsuarioResponse | null>(null);

  readonly formEditar = this.fb.group({
    password:       ['', [Validators.required, Validators.minLength(8), Validators.maxLength(50)]],
    rolId:          ['', Validators.required],
    departamentoId: [''],
    urlAvatar:      [''],
    estado:         ['ACTIVO', Validators.required],
  });

  readonly confirmDelete = signal<UsuarioResponse | null>(null);

  // ── Filtrado + agrupación ─────────────────────────────────────
  readonly usuariosFiltrados = computed(() => {
    const q   = this.searchDebounced().toLowerCase().trim();
    const dep = this.filtroDep();
    const rol = this.filtroRol();
    const est = this.filtroEstado();
    return this.usuarios().filter((u) => {
      if (q && !u.nombreCompleto.toLowerCase().includes(q) && !u.username.toLowerCase().includes(q)) return false;
      if (dep && (u.departamentoId ?? '') !== dep) return false;
      if (rol && u.rolId !== rol) return false;
      if (est && u.estado !== est) return false;
      return true;
    });
  });

  readonly grupos = computed(() => {
    const mapa = new Map<string, { nombre: string; usuarios: UsuarioResponse[] }>();
    for (const u of this.usuariosFiltrados()) {
      const key    = u.departamentoId ?? '__sin__';
      const nombre = u.nombreDepartamento ?? 'Sin departamento';
      if (!mapa.has(key)) mapa.set(key, { nombre, usuarios: [] });
      mapa.get(key)!.usuarios.push(u);
    }
    return [...mapa.entries()].map(([, v]) => v)
      .sort((a, b) => a.nombre === 'Sin departamento' ? 1 : a.nombre.localeCompare(b.nombre));
  });

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    forkJoin([
      this.svcUsuario.listar(),
      this.svcRol.listar(),
      this.svcDep.listar(),
      this.svcTipoDoc.listar(),
    ]).subscribe({
      next: ([usuarios, roles, deps, tiposDocs]) => {
        this.usuarios.set(usuarios);
        this.roles.set(roles);
        this.departamentos.set(deps);
        this.tiposDocs.set(tiposDocs);
        this.loading.set(false);
      },
      error: () => { this.error.set('Error al cargar datos.'); this.loading.set(false); },
    });
  }

  // ── Wizard ────────────────────────────────────────────────────
  abrirWizard(): void {
    this.wizardStep.set(1);
    this.personaId.set(null);
    this.fotoPreview.set(null);
    this.fotoArchivo.set(null);
    this.cvArchivo.set(null);
    this.formPersona.reset();
    this.formUsuario.reset({ estado: 'ACTIVO' });
    this.wizardOpen.set(true);
  }

  seleccionarFoto(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.fotoArchivo.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.fotoPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  seleccionarCv(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.cvArchivo.set(file);
  }

  quitarFoto(): void { this.fotoArchivo.set(null); this.fotoPreview.set(null); }
  quitarCv(): void   { this.cvArchivo.set(null); }

  paso1Siguiente(): void {
    if (this.formPersona.invalid || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    const v = this.formPersona.value;

    const foto$ = this.fotoArchivo() ? this.svcArchivo.subirImagen(this.fotoArchivo()!) : of(null);
    const cv$   = this.cvArchivo()   ? this.svcArchivo.subirCv(this.cvArchivo()!)       : of(null);

    forkJoin([foto$, cv$]).pipe(
      switchMap(([fotoRes, cvRes]) => {
        if (fotoRes) this.formUsuario.patchValue({ urlAvatar: fotoRes.url });
        return this.svcUsuario.crearPersona({
          tipoDocumentoId: v.tipoDocumentoId!,
          numeroDocumento: v.numeroDocumento!,
          nombres:         v.nombres!,
          apellidos:       v.apellidos!,
          telefono:        v.telefono || undefined,
          correo:          v.correo || undefined,
          direccion:       v.direccion || undefined,
          urlCv:           cvRes?.url,
        });
      })
    ).subscribe({
      next: (p) => {
        this.personaId.set(p.id);
        this.saving.set(false);
        this.wizardStep.set(2);
      },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Error al crear persona.'); },
    });
  }

  paso2Guardar(): void {
    if (this.formUsuario.invalid || this.saving() || !this.personaId()) return;
    this.saving.set(true);
    const v = this.formUsuario.value;
    this.svcUsuario.crear({
      personaId:      this.personaId()!,
      username:       v.username!,
      password:       v.password!,
      rolId:          v.rolId!,
      departamentoId: v.departamentoId || undefined,
      urlAvatar:      v.urlAvatar || undefined,
      estado:         v.estado as any,
    }).subscribe({
      next: () => { this.saving.set(false); this.wizardOpen.set(false); this.cargar(); },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Error al crear usuario.'); },
    });
  }

  // ── Editar ────────────────────────────────────────────────────
  abrirEditar(u: UsuarioResponse): void {
    this.editandoUsuario.set(u);
    this.formEditar.reset({
      password:       '',
      rolId:          u.rolId,
      departamentoId: u.departamentoId ?? '',
      urlAvatar:      u.urlAvatar ?? '',
      estado:         u.estado,
    });
  }

  guardarEdicion(): void {
    const u = this.editandoUsuario();
    if (!u || this.formEditar.invalid || this.saving()) return;
    this.saving.set(true);
    const v = this.formEditar.value;
    this.svcUsuario.actualizar(u.id, {
      password:       v.password!,
      rolId:          v.rolId!,
      departamentoId: v.departamentoId || undefined,
      urlAvatar:      v.urlAvatar || undefined,
      estado:         v.estado as any,
    }).subscribe({
      next: () => { this.saving.set(false); this.editandoUsuario.set(null); this.cargar(); },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Error al actualizar.'); },
    });
  }

  // ── Eliminar ──────────────────────────────────────────────────
  pedirEliminar(u: UsuarioResponse): void { this.confirmDelete.set(u); }

  confirmarEliminar(): void {
    const u = this.confirmDelete();
    if (!u) return;
    this.confirmDelete.set(null);
    this.svcUsuario.eliminar(u.id).subscribe({
      next: () => this.cargar(),
      error: (e) => this.error.set(e?.error?.message ?? 'Error al eliminar.'),
    });
  }

  // ── Helpers ───────────────────────────────────────────────────
  estadoClasses(estado: string): string {
    switch (estado) {
      case 'ACTIVO':   return 'bg-green-50 text-green-700';
      case 'INACTIVO': return 'bg-gray-100 text-gray-500';
      case 'BLOQUEADO': return 'bg-red-50 text-red-600';
      default: return 'bg-gray-100 text-gray-500';
    }
  }

  iniciales(nombre: string): string {
    return nombre.split(' ').slice(0, 2).map((n) => n[0] ?? '').join('').toUpperCase();
  }

  colorAvatar(nombre: string): string {
    const colors = ['#7c3aed','#2563eb','#0891b2','#16a34a','#d97706','#dc2626','#db2777'];
    const idx = nombre.charCodeAt(0) % colors.length;
    return colors[idx];
  }

}
