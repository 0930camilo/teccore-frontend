import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../../components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../components/loading/loading.component';
import { PaginationComponent } from '../../../components/pagination/pagination.component';
import { SearchInputComponent } from '../../../components/search-input/search-input.component';
import { AuthService } from '../../../core/services/auth.service';
import { ESTADOS_REGISTRO, EstadoRegistro } from '../../../shared/enums/estado-registro.enum';
import { Institucion } from '../../instituciones/model/institucion.model';
import { InstitucionService } from '../../instituciones/service/institucion.service';
import { Rol } from '../../../shared/enums/rol.enum';
import { ApiResponse } from '../../../shared/interface/api-response.interface';
import { PaginacionRespuesta } from '../../../shared/interface/pagination.interface';
import { NotificationService } from '../../../shared/services/notification.service';
import { Usuario, UsuarioFiltros, UsuarioUpdateRequest } from '../model/usuario.model';
import { UsuarioService } from '../service/usuario.service';

@Component({
  selector: 'app-usuarios-list-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SearchInputComponent, LoadingComponent, EmptyStateComponent, PaginationComponent],
  template: `
    <section class="resource-card">
      <header class="resource-card__header">
        <div>
          <h1>Usuarios</h1>
          <p>Listado general de usuarios del sistema con filtros por rol, nombre e institución.</p>
        </div>

        <div class="header-actions">
          <a routerLink="/administradores/nuevo" class="btn-new">+ Crear usuario</a>
          <button type="button" class="refresh" (click)="reload()">Actualizar</button>
        </div>
      </header>

      <div class="filter-grid">
        <app-search-input
          [placeholder]="'Buscar por nombre, email o institución'"
          [showClearButton]="false"
          (searchChange)="onQueryChange($event)"
        ></app-search-input>

        <div class="field">
          <label for="nombre">Nombre</label>
          <input id="nombre" type="text" [value]="nombreFilter()" (input)="onNombreInput($event)" placeholder="Filtrar por nombre" />
        </div>

        <div class="field">
          <label for="rol">Rol</label>
          <select id="rol" [value]="rolFilter()" (change)="onRolChange($event)">
            <option value="">Todos</option>
            <option *ngFor="let rol of roles" [value]="rol">{{ rol }}</option>
          </select>
        </div>

        <div class="field">
          <label for="institucion">Institución</label>
          <input
            id="institucion"
            type="text"
            [value]="institucionNombre()"
            (input)="onInstitucionInput($event)"
            [attr.list]="loadingInstituciones() ? null : 'instituciones-list'"
            placeholder="Escribe y selecciona una institución"
          />
          <datalist id="instituciones-list">
            <option *ngFor="let institucion of filteredInstituciones()" [value]="institucion.nombre"></option>
          </datalist>
        </div>

        <div class="field field--clear">
          <button type="button" class="btn-clear" (click)="clearAllFilters()">Limpiar filtros</button>
        </div>
      </div>

      <app-loading *ngIf="loading"></app-loading>

      <p class="error" *ngIf="!loading && error">{{ error }}</p>

      <app-empty-state
        *ngIf="!loading && !error && items.length === 0"
        title="No hay usuarios disponibles"
        message="Ajusta los filtros o revisa si el backend devolvió resultados para esta consulta."
      ></app-empty-state>

      <div class="table-wrapper" *ngIf="!loading && !error && items.length > 0">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Institución</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of items">
              <td>{{ formatValue(item.nombre) }}</td>
              <td>{{ formatValue(item.email) }}</td>
              <td><span class="status-pill">{{ formatValue(item.rol) }}</span></td>
              <td>
                <div class="institution-cell">
                  <strong>{{ formatValue(item.institucionNombre) }}</strong>
                  <small>{{ item.institucionId ?? '—' }}</small>
                </div>
              </td>
              <td>
                <span class="status-pill" [attr.data-state]="item.estado">
                  {{ formatValue(item.estado) }}
                </span>
              </td>
              <td>
                <button type="button" class="btn-edit" (click)="openEditModal(item)">Editar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-backdrop" *ngIf="showEditModal" (click)="closeEditModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <header class="modal__header">
            <h2>Editar usuario</h2>
            <button type="button" class="modal__close" (click)="closeEditModal()">✕</button>
          </header>

          <form [formGroup]="editForm" (ngSubmit)="submitEdit()" class="modal__body">
            <div class="field">
              <label for="edit-nombre">Nombre <span class="required">*</span></label>
              <input id="edit-nombre" type="text" formControlName="nombre" placeholder="Nombre del usuario" />
            </div>

            <div class="field">
              <label for="edit-email">Email <span class="required">*</span></label>
              <input id="edit-email" type="email" formControlName="email" placeholder="correo@dominio.com" />
            </div>

            <div class="field">
              <label for="edit-rol">Rol <span class="required">*</span></label>
              <select id="edit-rol" formControlName="rol" (change)="onEditRolChange($event)">
                <option *ngFor="let rol of roles" [value]="rol">{{ rol }}</option>
              </select>
            </div>

            <div class="field" *ngIf="showEditInstitutionField">
              <label for="edit-institucion">Institución <span class="required">*</span></label>
              <input
                id="edit-institucion"
                type="text"
                [value]="editInstitucionNombre()"
                (input)="onEditInstitucionInput($event)"
                [attr.list]="loadingInstituciones() ? null : 'edit-instituciones-list'"
                placeholder="Escribe y selecciona una institución"
              />
              <datalist id="edit-instituciones-list">
                <option *ngFor="let institucion of editFilteredInstituciones()" [value]="institucion.nombre"></option>
              </datalist>
            </div>

            <div class="field">
              <label for="edit-estado">Estado <span class="required">*</span></label>
              <select id="edit-estado" formControlName="estado">
                <option *ngFor="let estado of estados" [value]="estado">{{ estado }}</option>
              </select>
            </div>

            <footer class="modal__footer">
              <button type="button" class="btn-cancel" (click)="closeEditModal()">Cancelar</button>
              <button type="submit" class="btn-submit" [disabled]="saving || editForm.invalid">
                {{ saving ? 'Guardando...' : 'Guardar cambios' }}
              </button>
            </footer>
          </form>
        </div>
      </div>

      <app-pagination
        *ngIf="!loading && !error"
        [page]="page"
        [size]="size"
        [total]="total"
        (pageChange)="changePage($event)"
      ></app-pagination>
    </section>
  `,
  styles: [`
    .resource-card {
      display: grid;
      gap: 1rem;
      padding: 1.25rem;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 1.25rem;
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
    }

    .resource-card__header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
    }

    h1 {
      margin: 0;
      font-size: 1.5rem;
    }

    p {
      margin: 0.25rem 0 0;
      color: #64748b;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .btn-new,
    .refresh,
    .btn-clear,
    .btn-edit,
    .btn-cancel,
    .btn-submit {
      padding: 0.75rem 1rem;
      border-radius: 0.85rem;
      border: 0;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .btn-new {
      background: #1d4ed8;
      color: #fff;
    }

    .refresh,
    .btn-clear {
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #334155;
    }

    .btn-edit {
      background: #1d4ed8;
      color: #fff;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      display: grid;
      place-items: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal {
      background: #fff;
      border-radius: 1.25rem;
      width: min(100%, 42rem);
      padding: 1.5rem;
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
      max-height: 90vh;
      overflow: auto;
    }

    .modal__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .modal__header h2 {
      margin: 0;
      font-size: 1.3rem;
    }

    .modal__close {
      background: none;
      border: none;
      font-size: 1.1rem;
      cursor: pointer;
      color: #64748b;
    }

    .modal__body {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .modal__footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      grid-column: 1 / -1;
      margin-top: 0.5rem;
    }

    .btn-cancel {
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #334155;
    }

    .btn-submit {
      background: #1d4ed8;
      color: #fff;
    }

    .btn-submit:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .field {
      display: grid;
      gap: 0.35rem;
    }

    .field label {
      font-weight: 600;
      color: #0f172a;
      font-size: 0.9rem;
    }

    .field input,
    .field select {
      padding: 0.8rem 1rem;
      border-radius: 0.85rem;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #0f172a;
      width: 100%;
      box-sizing: border-box;
    }

    .required {
      color: #b91c1c;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      align-items: end;
    }

    .field {
      display: grid;
      gap: 0.35rem;
    }

    .field label {
      font-weight: 600;
      color: #0f172a;
      font-size: 0.9rem;
    }

    .field input,
    .field select {
      padding: 0.8rem 1rem;
      border-radius: 0.85rem;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #0f172a;
      width: 100%;
      box-sizing: border-box;
    }

    .field--clear {
      align-self: stretch;
      display: flex;
      align-items: end;
    }

    .btn-clear {
      width: 100%;
      align-self: stretch;
    }

    .table-wrapper {
      overflow-x: auto;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 52rem;
    }

    th,
    td {
      padding: 0.85rem 1rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }

    th {
      background: #f8fafc;
      color: #0f172a;
      text-transform: capitalize;
      white-space: nowrap;
    }

    .institution-cell {
      display: grid;
      gap: 0.15rem;
    }

    .institution-cell small {
      color: #64748b;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 0.35rem 0.7rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 700;
      background: #e2e8f0;
      color: #334155;
      white-space: nowrap;
    }

    .status-pill[data-state='ACTIVO'] { background: #dcfce7; color: #166534; }
    .status-pill[data-state='INACTIVO'] { background: #e2e8f0; color: #334155; }
    .status-pill[data-state='ANULADO'] { background: #fee2e2; color: #991b1b; }
    .status-pill[data-state='PENDIENTE'] { background: #fef3c7; color: #92400e; }

    .error {
      padding: 1rem;
      border-radius: 0.9rem;
      background: #fee2e2;
      color: #991b1b;
    }

    @media (max-width: 900px) {
      .filter-grid {
        grid-template-columns: 1fr 1fr;
      }

      .modal__body {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .filter-grid,
      .resource-card__header {
        grid-template-columns: 1fr;
      }

      .header-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .btn-new,
      .refresh,
      .btn-clear,
      .btn-edit,
      .btn-cancel,
      .btn-submit {
        width: 100%;
      }
    }
  `]
})
export class UsuariosListPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly institucionService = inject(InstitucionService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly roles = Object.values(Rol);
  readonly nombreFilter = signal('');
  readonly rolFilter = signal('');
  readonly institucionNombre = signal('');
  readonly instituciones = signal<Array<{ id: number; nombre: string }>>([]);
  readonly editInstitucionNombre = signal('');
  readonly filteredInstituciones = computed(() => {
    const query = this.institucionNombre().trim().toLowerCase();
    if (!query) {
      return this.instituciones();
    }

    return this.instituciones().filter((item) => item.nombre.toLowerCase().includes(query));
  });
  readonly editFilteredInstituciones = computed(() => {
    const query = this.editInstitucionNombre().trim().toLowerCase();
    if (!query) {
      return this.instituciones();
    }

    return this.instituciones().filter((item) => item.nombre.toLowerCase().includes(query));
  });
  readonly loadingInstituciones = signal(false);
  readonly estados = ESTADOS_REGISTRO;

  loading = false;
  saving = false;
  error: string | null = null;
  items: Usuario[] = [];
  page = 0;
  size = 10;
  total = 0;
  query = '';
  showEditModal = false;
  editingId: number | null = null;

  readonly editForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    rol: this.fb.control<Rol | string>(Rol.ADMIN_INSTITUCION, { validators: [Validators.required], nonNullable: true }),
    institucionId: this.fb.control<number | null>(null),
    estado: this.fb.control<EstadoRegistro | string>(EstadoRegistro.ACTIVO, { validators: [Validators.required], nonNullable: true })
  });

  ngOnInit(): void {
    if (!this.authService.isSuperAdmin()) {
      this.error = 'No tienes permisos para acceder al listado de usuarios.';
      return;
    }

    this.loadInstitutions();
    this.loadUsuarios();
  }

  onQueryChange(value: string): void {
    this.query = value.trim();
    this.page = 0;
    this.loadUsuarios();
  }

  onNombreInput(event: Event): void {
    this.nombreFilter.set((event.target as HTMLInputElement | null)?.value ?? '');
    this.page = 0;
    this.loadUsuarios();
  }

  onRolChange(event: Event): void {
    this.rolFilter.set((event.target as HTMLSelectElement | null)?.value ?? '');
    this.page = 0;
    this.loadUsuarios();
  }

  onInstitucionInput(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.institucionNombre.set(value);
    this.page = 0;
    this.loadUsuarios();
  }

  openEditModal(item: Usuario): void {
    const id = this.getUserId(item.id);
    if (id === null) {
      this.notificationService.error('No se pudo identificar el usuario seleccionado.');
      return;
    }

    this.editingId = id;
    this.showEditModal = true;
    this.editInstitucionNombre.set(item.institucionNombre ?? '');
    this.editForm.reset({
      nombre: item.nombre ?? '',
      email: item.email ?? '',
      rol: (item.rol ?? Rol.ADMIN_INSTITUCION) as Rol | string,
      institucionId: item.institucionId ?? null,
      estado: (item.estado ?? EstadoRegistro.ACTIVO) as EstadoRegistro | string
    });
    this.syncEditRoleState();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingId = null;
    this.saving = false;
  }

  onEditRolChange(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value ?? '';
    this.editForm.controls.rol.setValue(value as Rol | string);
    this.syncEditRoleState();
  }

  onEditInstitucionInput(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.editInstitucionNombre.set(value);
    this.editForm.controls.institucionId.setValue(this.resolveInstitutionId(value));
  }

  submitEdit(): void {
    if (this.editingId === null) {
      this.notificationService.error('No se pudo identificar el usuario a editar.');
      return;
    }

    this.syncEditRoleState();

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const payload = this.buildUpdatePayload();
    if (!payload) {
      this.notificationService.error('Debes seleccionar una institución válida para este rol.');
      return;
    }

    this.saving = true;

    this.usuarioService.actualizar(this.editingId, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notificationService.success('Usuario actualizado correctamente.');
        this.closeEditModal();
        this.loadUsuarios();
      },
      error: () => {
        this.notificationService.error('No fue posible actualizar el usuario.');
        this.saving = false;
      }
    });
  }

  clearAllFilters(): void {
    this.query = '';
    this.nombreFilter.set('');
    this.rolFilter.set('');
    this.institucionNombre.set('');
    this.page = 0;
    this.loadUsuarios();
  }

  changePage(page: number): void {
    this.page = page;
    this.loadUsuarios();
  }

  reload(): void {
    this.loadUsuarios();
  }

  get showEditInstitutionField(): boolean {
    return this.normalizeRole(this.editForm.controls.rol.value) !== Rol.SUPER_ADMIN;
  }

  formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    return String(value);
  }

  private loadUsuarios(): void {
    if (!this.authService.isSuperAdmin()) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.usuarioService.listar(this.buildFilters()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: ApiResponse<PaginacionRespuesta<Usuario>>) => {
        const data = response.data;
        const records = this.extractRecords(data);
        this.items = records;
        this.total = this.extractTotal(data, records.length);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'No fue posible cargar los usuarios.';
        this.notificationService.error(this.error);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadInstitutions(): void {
    this.loadingInstituciones.set(true);

    this.institucionService.listar({ page: 0, size: 200 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        const records = this.extractInstitutions(response.data);
        this.instituciones.set(
          records
            .map((item) => ({ id: item.id ?? 0, nombre: item.nombre?.trim() ?? '' }))
            .filter((item) => Number.isFinite(item.id) && item.id > 0 && item.nombre.length > 0)
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
        );
        this.loadingInstituciones.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.instituciones.set([]);
        this.loadingInstituciones.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private buildFilters(): UsuarioFiltros {
    return {
      q: this.query || undefined,
      nombre: this.nombreFilter().trim() || undefined,
      rol: this.rolFilter().trim() || undefined,
      institucionId: this.resolveInstitutionId(this.institucionNombre()),
      page: this.page,
      size: this.size
    };
  }

  private buildUpdatePayload(): UsuarioUpdateRequest | null {
    const value = this.editForm.getRawValue();
    const role = this.normalizeRole(value.rol);

    const base: UsuarioUpdateRequest = {
      nombre: String(value.nombre ?? '').trim(),
      email: String(value.email ?? '').trim(),
      rol: role,
      estado: this.toEstado(value.estado) ?? EstadoRegistro.ACTIVO
    };

    if (role === Rol.SUPER_ADMIN) {
      return {
        ...base,
        institucionId: null
      };
    }

    const institucionId = this.resolveInstitutionId(this.editInstitucionNombre());
    if (institucionId === null) {
      return null;
    }

    return {
      ...base,
      institucionId
    };
  }

  private syncEditRoleState(): void {
    const role = this.normalizeRole(this.editForm.controls.rol.value);
    this.editForm.controls.rol.setValue(role, { emitEvent: false });

    if (role === Rol.SUPER_ADMIN) {
      this.editForm.controls.institucionId.clearValidators();
      this.editForm.controls.institucionId.setValue(null, { emitEvent: false });
      this.editInstitucionNombre.set('');
    } else {
      this.editForm.controls.institucionId.setValidators([Validators.required, Validators.min(1)]);
      this.editForm.controls.institucionId.setValue(this.resolveInstitutionId(this.editInstitucionNombre()), { emitEvent: false });
    }

    this.editForm.controls.institucionId.updateValueAndValidity({ emitEvent: false });
    this.editForm.controls.rol.updateValueAndValidity({ emitEvent: false });
  }

  private normalizeRole(value: Rol | string | null | undefined): Rol | string {
    return (value ?? Rol.ADMIN_INSTITUCION) as Rol | string;
  }

  private toEstado(value: EstadoRegistro | string | null | undefined): EstadoRegistro | null {
    if (!value) {
      return null;
    }

    return Object.values(EstadoRegistro).includes(value as EstadoRegistro) ? (value as EstadoRegistro) : null;
  }

  private getUserId(value: number | string | undefined): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private resolveInstitutionId(value: string): number | null {
    const query = value.trim().toLowerCase();
    if (!query) {
      return null;
    }

    const selected = this.instituciones().find((item) => item.nombre.toLowerCase() === query);
    return selected?.id ?? null;
  }

  private extractRecords(data: PaginacionRespuesta<Usuario> | Usuario[] | null | undefined): Usuario[] {
    if (Array.isArray(data)) {
      return data;
    }

    return (data?.content ?? data?.items ?? data?.data ?? []) as Usuario[];
  }

  private extractTotal(data: PaginacionRespuesta<Usuario> | Usuario[] | null | undefined, fallback: number): number {
    if (Array.isArray(data)) {
      return data.length;
    }

    return data?.totalElements ?? data?.total ?? fallback;
  }

  private extractInstitutions(data: PaginacionRespuesta<Institucion> | Institucion[] | null | undefined): Institucion[] {
    if (Array.isArray(data)) {
      return data;
    }

    return (data?.content ?? data?.items ?? data?.data ?? []) as Institucion[];
  }
}


