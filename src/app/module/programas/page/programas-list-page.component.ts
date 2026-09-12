import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmptyStateComponent } from '../../../components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../components/loading/loading.component';
import { PaginationComponent } from '../../../components/pagination/pagination.component';
import { SearchInputComponent } from '../../../components/search-input/search-input.component';
import { AuthService } from '../../../core/services/auth.service';
import { ESTADOS_REGISTRO, EstadoRegistro } from '../../../shared/enums/estado-registro.enum';
import { ApiResponse } from '../../../shared/interface/api-response.interface';
import { PaginacionRequest, PaginacionRespuesta } from '../../../shared/interface/pagination.interface';
import { NotificationService } from '../../../shared/services/notification.service';
import { Sede } from '../../sedes/model/sede.model';
import { SedeService } from '../../sedes/service/sede.service';
import { Programa, ProgramaRequest, ProgramaUpdateRequest } from '../model/programa.model';
import { ProgramaService } from '../service/programa.service';

@Component({
  selector: 'app-programas-list-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchInputComponent, LoadingComponent, EmptyStateComponent, PaginationComponent],
  template: `
    <section class="resource-card">
      <header class="resource-card__header">
        <div>
          <h1>Programas</h1>
          <p>Gestiona los programas académicos de tu institución.</p>
        </div>

        <div class="header-actions">
          <button *ngIf="canManage" type="button" class="btn-new" (click)="openCreateModal()">+ Nuevo programa</button>
          <button type="button" class="refresh" (click)="reload()">Actualizar</button>
        </div>
      </header>

      <div class="filters">
        <app-search-input
          [placeholder]="'Filtrar por nombre de programa'"
          [showClearButton]="false"
          (searchChange)="onSearchChange($event)"
        ></app-search-input>

        <select
          class="status-filter"
          [value]="estadoFiltro"
          (change)="onEstadoChange($event)"
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>

          <option
            *ngFor="let estado of estados"
            [value]="estado"
          >
            {{ estadoLabel(estado) }}
          </option>
        </select>
      </div>

      <app-loading *ngIf="loading"></app-loading>

      <p class="error" *ngIf="!loading && error">{{ error }}</p>

      <app-empty-state
        *ngIf="!loading && !error && items.length === 0"
        title="No hay programas disponibles."
        message="Crea un programa o ajusta el filtro para continuar."
      ></app-empty-state>

      <div class="table-wrapper" *ngIf="!loading && !error && items.length > 0">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Duración</th>
              <th>Nivel</th>
              <th>Costo semestral</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of items">
              <td>{{ formatValue(item.nombre) }}</td>
              <td>{{ formatValue(item.duracionSemestres) }}</td>
              <td>{{ formatValue(item.nivel) }}</td>
              <td>{{ formatCurrency(item.costoSemestral) }}</td>
              <td>
                <span class="status-pill" [attr.data-state]="item.estado">
                  {{ estadoLabel(item.estado) }}
                </span>
              </td>
              <td>
                <button *ngIf="canManage" type="button" class="btn-edit" (click)="openEditModal(item)">Editar</button>
                <span *ngIf="!canManage">—</span>
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
            <h2>{{ isEditing ? 'Editar programa' : 'Nuevo programa' }}</h2>
            <button type="button" class="modal__close" (click)="closeModal()">✕</button>
          </header>

          <form [formGroup]="programForm" (ngSubmit)="submit()" class="modal__body">
            <div class="field" [class.field--full]="!needsSedeSelection">
              <label for="programa-nombre">Nombre <span class="required">*</span></label>
              <input id="programa-nombre" type="text" formControlName="nombre" placeholder="Nombre del programa" />
            </div>

            <div class="field" *ngIf="needsSedeSelection">
              <label for="programa-sede">Sede <span class="required">*</span></label>
              <select id="programa-sede" formControlName="sedeId">
                <option [ngValue]="null">Selecciona una sede</option>
                <option *ngFor="let s of sedes" [ngValue]="s.id">{{ s.nombre }}</option>
              </select>
            </div>

            <div class="field">
              <label for="programa-duracion">Duración (semestres)</label>
              <input id="programa-duracion" type="number" min="1" formControlName="duracionSemestres" placeholder="Ej. 8" />
            </div>

            <div class="field">
              <label for="programa-nivel">Nivel</label>
              <input id="programa-nivel" type="text" formControlName="nivel" placeholder="Técnico, tecnológico, profesional..." />
            </div>

            <div class="field">
              <label for="programa-costo">Costo semestral</label>
              <input id="programa-costo" type="number" min="0" step="0.01" formControlName="costoSemestral" placeholder="0" />
            </div>

            <div class="field" *ngIf="isEditing">
              <label for="programa-estado">Estado</label>
              <select id="programa-estado" formControlName="estado">
                <option *ngFor="let estado of estados" [value]="estado">{{ estadoLabel(estado) }}</option>
              </select>
            </div>

            <footer class="modal__footer">
              <button type="button" class="btn-cancel" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn-submit" [disabled]="saving || programForm.invalid">
                {{ saving ? 'Guardando...' : 'Guardar' }}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .resource-card { display: grid; gap: 1rem; padding: 1.25rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 1.25rem; box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06); }
    .resource-card__header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    h1 { margin: 0; font-size: 1.5rem; }
    p { margin: 0.25rem 0 0; color: #64748b; }
    .header-actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .btn-new, .refresh, .btn-edit, .btn-cancel, .btn-submit { padding: 0.75rem 1rem; border-radius: 0.85rem; border: 0; font-weight: 700; cursor: pointer; }
    .btn-new, .btn-edit, .btn-submit { background: #1d4ed8; color: #fff; }
    .refresh, .btn-cancel { border: 1px solid #cbd5e1; background: #fff; color: #334155; }
    .table-wrapper { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 1rem; }
    table { width: 100%; border-collapse: collapse; min-width: 48rem; }
    th, td { padding: 0.85rem 1rem; text-align: left; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    th { background: #f8fafc; color: #0f172a; text-transform: capitalize; white-space: nowrap; }
    .error { padding: 1rem; border-radius: 0.9rem; background: #fee2e2; color: #991b1b; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: grid; place-items: center; z-index: 1000; padding: 1rem; }
    .modal { background: #fff; border-radius: 1.25rem; width: min(100%, 42rem); padding: 1.5rem; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15); max-height: 90vh; overflow: auto; }
    .modal__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .modal__header h2 { margin: 0; font-size: 1.3rem; }
    .modal__close { background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #64748b; }
    .modal__body { display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .field { display: grid; gap: 0.35rem; }
    .field--full { grid-column: 1 / -1; }
    .field label { font-weight: 600; color: #0f172a; font-size: 0.9rem; }
    .field input, .field select { padding: 0.75rem 1rem; border-radius: 0.75rem; border: 1px solid #cbd5e1; background: #fff; font-size: 0.95rem; width: 100%; box-sizing: border-box; }
    .required { color: #b91c1c; margin-left: 2px; }
    .modal__footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; grid-column: 1 / -1; }
    .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
    .status-pill { display: inline-flex; align-items: center; justify-content: center; padding: 0.25rem 0.7rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; width: fit-content; text-transform: uppercase; background: #f1f5f9; color: #475569; }
    .status-pill[data-state='ACTIVO'] { background: #dcfce7; color: #15803d; }
    .status-pill[data-state='INACTIVO'] { background: #fee2e2; color: #b91c1c; }
    .status-pill[data-state='PENDIENTE'] { background: #fef9c3; color: #854d0e; }

    .filters {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 220px;
      gap: 0.75rem;
      align-items: center;
    }

    .status-filter {
      width: 100%;
      box-sizing: border-box;
      padding: 0.8rem 1rem;
      border-radius: 0.85rem;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #0f172a;
      font-size: 0.95rem;
      cursor: pointer;
    }

    .status-filter:focus {
      outline: 2px solid #2563eb;
      outline-offset: 2px;
    }
    @media (max-width: 640px) {
      .resource-card__header, .header-actions, .modal__footer { flex-direction: column; align-items: stretch; }
      .modal__body { grid-template-columns: 1fr; }
      .btn-new, .refresh, .btn-edit, .btn-cancel, .btn-submit { width: 100%; }
    }
  `]
})export class ProgramasListPageComponent implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProgramaService);
  private readonly authService = inject(AuthService);
  private readonly sedeService = inject(SedeService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly estados = ESTADOS_REGISTRO;

  sedes: Sede[] = [];

  loading = false;
  saving = false;
  showModal = false;
  error: string | null = null;

  items: Programa[] = [];

  page = 0;
  size = 10;
  total = 0;

  query = '';
  estadoFiltro: EstadoRegistro | '' = '';

  editingId: number | null = null;


  readonly programForm = this.fb.group({
    nombre: ['', [Validators.required]],
    duracionSemestres: this.fb.control<number | null>(null, { validators: [Validators.min(1)] }),
    nivel: this.fb.control<string>(''),
    costoSemestral: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    sedeId: this.fb.control<number | null>(null),
    estado: this.fb.control<EstadoRegistro>(EstadoRegistro.ACTIVO)
  });

  ngOnInit(): void {
    this.loadProgramas();
    if (this.needsSedeSelection) {
      this.loadSedes();
    }
  }

  get canManage(): boolean {
    return this.authService.isAdminSede() || this.authService.isSuperAdmin() || this.authService.isAdminInstitucion();
  }

  get needsSedeSelection(): boolean {
    return !this.authService.getSedeId();
  }

  get isEditing(): boolean {
    return this.editingId !== null;
  }

  estadoLabel(estado: EstadoRegistro | string | null | undefined): string {
    if (!estado) return '—';
    switch (String(estado)) {
      case EstadoRegistro.ACTIVO:
        return 'Activo';
      case EstadoRegistro.INACTIVO:
        return 'Inactivo';
      case EstadoRegistro.ANULADO:
        return 'Anulado';
      case EstadoRegistro.PENDIENTE:
        return 'Pendiente';
      default:
        return String(estado);
    }
  }
  onSearchChange(query: string): void {
    this.query = query.trim();
    this.page = 0;
    this.loadProgramas();
  }

  onEstadoChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.estadoFiltro = select.value as EstadoRegistro | '';
    this.page = 0;
    this.loadProgramas();
  }

  changePage(page: number): void {
    this.page = page;
    this.loadProgramas();
  }

  reload(): void {
    this.loadProgramas();
  }

  openCreateModal(): void {
    this.editingId = null;
    const sessionSedeId = this.authService.getSedeId();
    this.programForm.reset({
      nombre: '',
      duracionSemestres: null,
      nivel: '',
      costoSemestral: null,
      sedeId: sessionSedeId ?? null,
      estado: EstadoRegistro.ACTIVO
    });
    if (this.needsSedeSelection && this.sedes.length === 0) {
      this.loadSedes();
    }
    this.showModal = true;
  }

  openEditModal(item: Programa): void {
    const id = this.parseId(item.id);
    if (id === null) {
      this.notificationService.error('No se pudo identificar el programa seleccionado.');
      return;
    }

    this.editingId = id;
    const sessionSedeId = this.authService.getSedeId();
    this.programForm.reset({
      nombre: item.nombre ?? '',
      duracionSemestres: this.toNumber(item.duracionSemestres),
      nivel: item.nivel ?? '',
      costoSemestral: this.toNumber(item.costoSemestral),
      sedeId: this.toNumber(item.sedeId) ?? sessionSedeId ?? null,
      estado: (item.estado as EstadoRegistro) ?? EstadoRegistro.ACTIVO
    });
    if (this.needsSedeSelection && this.sedes.length === 0) {
      this.loadSedes();
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.saving = false;
  }

  submit(): void {
    if (this.programForm.invalid) {
      this.programForm.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload(this.programForm.getRawValue() as Record<string, unknown>);
    if (!payload) {
      this.notificationService.error('Debe seleccionar o tener una sede asociada para el programa.');
      return;
    }

    this.saving = true;

    const request$ = this.isEditing && this.editingId !== null
      ? this.service.actualizar(this.editingId, payload)
      : this.service.crear(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notificationService.success(this.isEditing ? 'Programa actualizado correctamente.' : 'Programa creado correctamente.');
        this.showModal = false;
        this.saving = false;
        this.loadProgramas();
      },
      error: () => {
        this.notificationService.error(this.isEditing ? 'No fue posible actualizar el programa.' : 'No fue posible crear el programa.');
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    return String(value);
  }

  formatCurrency(value: unknown): string {
    const amount = this.toNumber(value);
    if (amount === null) {
      return '—';
    }

    return `$ ${amount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private loadSedes(): void {
    this.sedeService.listar({ page: 0, size: 200 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        const data = response.data;
        const sedes = Array.isArray(data) ? data : (data?.content ?? data?.items ?? []);
        this.sedes = sedes;
        this.cdr.markForCheck();
      },
      error: () => {
        this.notificationService.error('No se pudieron cargar las sedes disponibles.');
      }
    });
  }

  private loadProgramas(): void {
    this.loading = true;
    this.error = null;

    this.service.listar(this.buildFilters()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: ApiResponse<PaginacionRespuesta<Programa>>) => {
        const data = response.data;
        const records = this.extractRecords(data);
        this.items = records;
        this.total = this.extractTotal(data, records.length);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'No fue posible cargar los programas.';
        this.notificationService.error(this.error);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private buildFilters(): PaginacionRequest {
    return {
      q: this.query || undefined,
      nombre: this.query || undefined,
      page: this.page,
      size: this.size,
      estado: this.estadoFiltro || undefined
    };

  }

  private buildPayload(payload: Record<string, unknown>): ProgramaRequest | null {
    const sedeId = this.toNumber(payload['sedeId']) ?? this.authService.getSedeId();
    if (!sedeId) {
      return null;
    }

    return {
      nombre: String(payload['nombre'] ?? '').trim(),
      duracionSemestres: this.toNumber(payload['duracionSemestres']),
      nivel: this.toText(payload['nivel']),
      costoSemestral: this.toNumber(payload['costoSemestral']),
      estado: (payload['estado'] as EstadoRegistro) ?? EstadoRegistro.ACTIVO,
      sedeId
    };
  }

  private extractRecords(data: PaginacionRespuesta<Programa> | Programa[] | null | undefined): Programa[] {
    if (Array.isArray(data)) {
      return data;
    }

    return (data?.content ?? data?.items ?? data?.data ?? []) as Programa[];
  }

  private extractTotal(data: PaginacionRespuesta<Programa> | Programa[] | null | undefined, fallback: number): number {
    if (Array.isArray(data)) {
      return data.length;
    }

    return data?.totalElements ?? data?.total ?? fallback;
  }

  private parseId(value: number | string | undefined): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toText(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const text = String(value).trim();
    return text.length > 0 ? text : null;
  }
}

