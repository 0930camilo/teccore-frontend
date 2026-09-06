import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, ViewChild, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EmptyStateComponent } from '../../../components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../components/loading/loading.component';
import { PaginationComponent } from '../../../components/pagination/pagination.component';
import { SearchInputComponent } from '../../../components/search-input/search-input.component';
import { AuthService } from '../../../core/services/auth.service';
import { ApiResponse } from '../../../shared/interface/api-response.interface';
import { PaginacionRespuesta } from '../../../shared/interface/pagination.interface';
import { NotificationService } from '../../../shared/services/notification.service';
import { ESTADOS_REGISTRO, EstadoRegistro } from '../../../shared/enums/estado-registro.enum';
import { Institucion, InstitucionFiltros, InstitucionRequest, InstitucionUpdateRequest } from '../model/institucion.model';
import { InstitucionService } from '../service/institucion.service';

@Component({
  selector: 'app-institucion-list-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchInputComponent, LoadingComponent, EmptyStateComponent, PaginationComponent],
  template: `
    <section class="resource-card">
      <header class="resource-card__header">
        <div>
          <h1>{{ titulo }}</h1>
          <p>{{ descripcion }}</p>
        </div>

        <div class="header-actions">
          <button *ngIf="canManageInstitutions" type="button" class="btn-new" (click)="openCreateModal()">+ Nueva institución</button>
          <button type="button" class="refresh" (click)="reload()">Actualizar</button>
        </div>
      </header>

      <div class="filter-grid">
        <app-search-input
          [placeholder]="'Buscar por código, nombre o NIT'"
          (searchChange)="onSearchChange($event)"
          (clearEvent)="onSearchClear()"
          [showClearButton]="false"
        ></app-search-input>

        <div class="field field--state">
          <label for="estado">Estado</label>
          <select id="estado" [formControl]="filterForm.controls.estado" (change)="applyFilters()">
            <option value="">Todos</option>
            <option *ngFor="let estado of estados" [value]="estado">{{ estadoLabel(estado) }}</option>
          </select>
        </div>

        <div class="field field--clear">
          <label class="sr-only" for="limpiar-instituciones">Limpiar filtros</label>
          <button id="limpiar-instituciones" type="button" class="btn-clear" (click)="clearAllFilters()">
            Limpiar
          </button>
        </div>
      </div>

      <app-loading *ngIf="loading"></app-loading>

      <p class="error" *ngIf="!loading && error">{{ error }}</p>

      <app-empty-state
        *ngIf="!loading && !error && items.length === 0"
        [title]="'No hay instituciones disponibles.'"
        [message]="'Ajusta los filtros o crea una nueva institución para comenzar.'"
      ></app-empty-state>

      <div class="table-wrapper" *ngIf="!loading && !error && items.length > 0">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>NIT</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of items">
              <td>{{ formatValue(item.codigo) }}</td>
              <td>{{ formatValue(item.nombre) }}</td>
              <td>{{ formatValue(item.nit) }}</td>
              <td>{{ formatValue(item.correo) }}</td>
              <td>{{ formatValue(item.telefono) }}</td>
              <td>{{ formatValue(item.direccion) }}</td>
              <td>
                <span class="status-pill" [attr.data-state]="item.estado">
                  {{ estadoLabel(item.estado) }}
                </span>
              </td>
              <td>
                <button *ngIf="canManageInstitutions" type="button" class="btn-edit" (click)="openEditModal(item)">Editar</button>
                <span *ngIf="!canManageInstitutions">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <app-pagination
        *ngIf="!loading && !error"
        [page]="page"
        [size]="size"
        [total]="total"
        (pageChange)="changePage($event)"
      ></app-pagination>

      <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <header class="modal__header">
            <h2>{{ modalTitle }}</h2>
            <button type="button" class="modal__close" (click)="closeModal()">✕</button>
          </header>

          <form [formGroup]="institutionForm" (ngSubmit)="submitInstitution()" class="modal__body">
            <div class="field">
              <label for="form-codigo">Código <span class="required">*</span></label>
              <input id="form-codigo" type="text" formControlName="codigo" placeholder="Ej. INS-001" />
            </div>

            <div class="field">
              <label for="form-nombre">Nombre <span class="required">*</span></label>
              <input id="form-nombre" type="text" formControlName="nombre" placeholder="Nombre de la institución" />
            </div>

            <div class="field">
              <label for="form-nit">NIT</label>
              <input id="form-nit" type="text" formControlName="nit" placeholder="NIT" />
            </div>

            <div class="field">
              <label for="form-correo">Correo</label>
              <input id="form-correo" type="email" formControlName="correo" placeholder="correo@dominio.com" />
            </div>

            <div class="field">
              <label for="form-telefono">Teléfono</label>
              <input id="form-telefono" type="text" formControlName="telefono" placeholder="Teléfono" />
            </div>

            <div class="field">
              <label for="form-direccion">Dirección</label>
              <input id="form-direccion" type="text" formControlName="direccion" placeholder="Dirección" />
            </div>

            <div class="field" *ngIf="isEditing">
              <label for="form-estado">Estado <span class="required">*</span></label>
              <select id="form-estado" formControlName="estado">
                <option *ngFor="let estado of estados" [value]="estado">{{ estadoLabel(estado) }}</option>
              </select>
            </div>

            <footer class="modal__footer">
              <button type="button" class="btn-cancel" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn-submit" [disabled]="saving || institutionForm.invalid">
                {{ saving ? 'Guardando...' : 'Guardar' }}
              </button>
            </footer>
          </form>
        </div>
      </div>
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
    .btn-edit,
    .btn-cancel,
    .btn-submit,
    .btn-clear {
      padding: 0.75rem 1rem;
      border-radius: 0.85rem;
      border: 0;
      font-weight: 700;
      cursor: pointer;
    }

    .btn-new,
    .btn-submit,
    .btn-edit {
      background: #1d4ed8;
      color: #fff;
    }

    .refresh,
    .btn-cancel {
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #334155;
    }

    .btn-clear {
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #334155;
      width: 100%;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 18rem) auto;
      gap: 1rem;
      align-items: end;
    }

    .field--state {
      max-width: 18rem;
    }

    .field--clear {
      align-self: stretch;
      display: flex;
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
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      border: 1px solid #cbd5e1;
      background: #fff;
      font-size: 0.95rem;
      width: 100%;
      box-sizing: border-box;
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

    .modal__body .field:last-of-type {
      grid-column: 1 / -1;
    }

    .modal__footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 0.5rem;
      grid-column: 1 / -1;
    }

    .required {
      color: #b91c1c;
      margin-left: 2px;
    }

    .table-wrapper {
      overflow-x: auto;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 62rem;
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


    @media (max-width: 640px) {
      .filter-grid,
      .modal__body {
        grid-template-columns: 1fr;
      }

      .resource-card__header,
      .header-actions,
      .modal__footer {
        flex-direction: column;
        align-items: stretch;
      }

      .btn-new,
      .refresh,
      .btn-edit,
      .btn-cancel,
      .btn-submit,
      .btn-clear {
        width: 100%;
      }
    }
  `]
})
export class InstitucionListPageComponent implements OnInit {
  private readonly service = inject(InstitucionService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  @ViewChild(SearchInputComponent) private searchInput?: SearchInputComponent;

  protected readonly titulo = 'Instituciones';
  protected readonly descripcion = this.authService.canManageInstitutions()
    ? 'Consulta, filtra y administra las instituciones registradas en el sistema.'
    : 'Consulta la información de tu institución asignada.';
  protected readonly estados = ESTADOS_REGISTRO;

  loading = false;
  saving = false;
  showModal = false;
  error: string | null = null;
  page = 0;
  size = 10;
  total = 0;
  searchQuery = '';
  items: Institucion[] = [];
  modalMode: 'create' | 'edit' = 'create';
  editingId: number | null = null;

  readonly filterForm = this.fb.group({
    estado: this.fb.control<EstadoRegistro | ''>('')
  });

  readonly institutionForm = this.fb.group({
    codigo: this.fb.control('', { validators: [Validators.required] }),
    nombre: this.fb.control('', { validators: [Validators.required] }),
    nit: this.fb.control(''),
    correo: this.fb.control('', { validators: [Validators.email] }),
    telefono: this.fb.control(''),
    direccion: this.fb.control(''),
    estado: this.fb.control<EstadoRegistro>(EstadoRegistro.ACTIVO, { validators: [Validators.required] })
  });

  ngOnInit(): void {
    this.loadInstituciones();
  }

  get isEditing(): boolean {
    return this.modalMode === 'edit';
  }

  get canManageInstitutions(): boolean {
    return this.authService.canManageInstitutions();
  }

  get modalTitle(): string {
    return this.isEditing ? 'Editar institución' : 'Nueva institución';
  }

  onSearchChange(query: string): void {
    this.searchQuery = query.trim();
    this.page = 0;
    this.loadInstituciones();
  }

  onSearchClear(): void {
    this.clearAllFilters();
  }

  clearAllFilters(): void {
    this.searchQuery = '';
    this.filterForm.reset({ estado: '' });
    this.page = 0;
    this.searchInput?.control.setValue('', { emitEvent: false });
    this.loadInstituciones();
  }

  applyFilters(): void {
    this.page = 0;
    this.loadInstituciones();
  }

  changePage(page: number): void {
    this.page = page;
    this.loadInstituciones();
  }

  reload(): void {
    this.loadInstituciones();
  }

  openCreateModal(): void {
    if (!this.canManageInstitutions) {
      this.notificationService.error('No tienes permisos para crear instituciones.');
      return;
    }

    this.modalMode = 'create';
    this.editingId = null;
    this.institutionForm.reset({
      codigo: '',
      nombre: '',
      nit: '',
      correo: '',
      telefono: '',
      direccion: '',
      estado: EstadoRegistro.ACTIVO
    });
    this.showModal = true;
  }

  openEditModal(item: Institucion): void {
    if (!this.canManageInstitutions) {
      this.notificationService.error('No tienes permisos para editar instituciones.');
      return;
    }

    const id = this.getId(item.id);
    if (id === null) {
      this.notificationService.error('No se pudo identificar la institución seleccionada.');
      return;
    }

    this.modalMode = 'edit';
    this.editingId = id;
    this.institutionForm.reset({
      codigo: item.codigo ?? '',
      nombre: item.nombre ?? '',
      nit: item.nit ?? '',
      correo: item.correo ?? '',
      telefono: item.telefono ?? '',
      direccion: item.direccion ?? '',
      estado: item.estado ?? EstadoRegistro.ACTIVO
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  submitInstitution(): void {
    if (!this.canManageInstitutions) {
      this.notificationService.error('No tienes permisos para modificar instituciones.');
      return;
    }

    if (this.institutionForm.invalid) {
      this.institutionForm.markAllAsTouched();
      return;
    }

    this.saving = true;

    if (this.isEditing && this.editingId !== null) {
      const payload = this.buildUpdatePayload();
      this.service.actualizar(this.editingId, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.handleSuccess('Institución actualizada correctamente.'),
        error: () => this.handleFailure('No fue posible actualizar la institución.')
      });
      return;
    }

    const payload = this.buildCreatePayload();
    this.service.crear(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.handleSuccess('Institución creada correctamente.'),
      error: () => this.handleFailure('No fue posible crear la institución.')
    });
  }

  estadoLabel(estado?: EstadoRegistro | null): string {
    if (!estado) {
      return 'Sin estado';
    }

    return {
      [EstadoRegistro.ACTIVO]: 'Activo',
      [EstadoRegistro.INACTIVO]: 'Inactivo',
      [EstadoRegistro.ANULADO]: 'Anulado',
      [EstadoRegistro.PENDIENTE]: 'Pendiente'
    }[estado] ?? estado;
  }

  formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    return String(value);
  }

  private loadInstituciones(): void {
    this.loading = true;
    this.error = null;

    this.service.listar(this.buildFilters()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: ApiResponse<PaginacionRespuesta<Institucion>>) => {
        const data = response.data;
        const records = this.extractRecords(data);
        this.items = records;
        this.total = this.extractTotal(data, records.length);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        const message = 'No fue posible cargar las instituciones.';
        this.error = message;
        this.notificationService.error(message);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private buildFilters(): InstitucionFiltros {
    const filters = this.filterForm.getRawValue();

    return {
      q: this.searchQuery || undefined,
      estado: this.toEstado(filters.estado),
      page: this.page,
      size: this.size
    };
  }

  private buildCreatePayload(): InstitucionRequest {
    const value = this.institutionForm.getRawValue();

    return {
      codigo: this.requiredText(value.codigo),
      nombre: this.requiredText(value.nombre),
      nit: this.normalize(value.nit),
      correo: this.normalize(value.correo),
      telefono: this.normalize(value.telefono),
      direccion: this.normalize(value.direccion)
    };
  }

  private buildUpdatePayload(): InstitucionUpdateRequest {
    const value = this.institutionForm.getRawValue();

    return {
      codigo: this.requiredText(value.codigo),
      nombre: this.requiredText(value.nombre),
      nit: this.normalize(value.nit),
      correo: this.normalize(value.correo),
      telefono: this.normalize(value.telefono),
      direccion: this.normalize(value.direccion),
      estado: this.toEstado(value.estado) ?? EstadoRegistro.ACTIVO
    };
  }

  private handleSuccess(message: string): void {
    this.notificationService.success(message);
    this.showModal = false;
    this.saving = false;
    this.loadInstituciones();
    this.cdr.markForCheck();
  }

  private handleFailure(message: string): void {
    this.notificationService.error(message);
    this.saving = false;
    this.cdr.markForCheck();
  }

  private extractRecords(data: PaginacionRespuesta<Institucion> | Institucion[] | null | undefined): Institucion[] {
    if (Array.isArray(data)) {
      return data;
    }

    return (data?.content ?? data?.items ?? data?.data ?? []) as Institucion[];
  }

  private extractTotal(data: PaginacionRespuesta<Institucion> | Institucion[] | null | undefined, fallback: number): number {
    if (Array.isArray(data)) {
      return data.length;
    }

    return data?.totalElements ?? data?.total ?? fallback;
  }

  private normalize(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const text = String(value).trim();
    return text.length > 0 ? text : null;
  }

  private requiredText(value: unknown): string {
    return String(value ?? '').trim();
  }

  private toEstado(value: EstadoRegistro | '' | null | undefined): EstadoRegistro | null {
    if (!value) {
      return null;
    }

    return Object.values(EstadoRegistro).includes(value as EstadoRegistro) ? (value as EstadoRegistro) : null;
  }

  private getId(value: number | string | undefined): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }
}

