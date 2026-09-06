import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
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
import { Sede, SedeFiltros, SedeRequest, SedeUpdateRequest } from '../model/sede.model';
import { SedeService } from '../service/sede.service';

@Component({
  selector: 'app-sedes-list-page',
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
          <button *ngIf="canManageSedes" type="button" class="btn-new" (click)="openCreateModal()">+ Nueva sede</button>
          <button type="button" class="refresh" (click)="reload()">Actualizar</button>
        </div>
      </header>

      <div class="filter-grid">
        <app-search-input
          [placeholder]="'Buscar por nombre o ciudad'"
          (searchChange)="onSearchChange($event)"
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
          <button id="limpiar-sedes" type="button" class="btn-clear" (click)="clearAllFilters()">
            Limpiar filtros
          </button>
        </div>
      </div>

      <app-loading *ngIf="loading"></app-loading>

      <p class="error" *ngIf="!loading && error">{{ error }}</p>

      <app-empty-state
        *ngIf="!loading && !error && items.length === 0"
        title="No hay sedes disponibles."
        message="Ajusta los filtros o crea una nueva sede para comenzar."
      ></app-empty-state>

      <div class="table-wrapper" *ngIf="!loading && !error && items.length > 0">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Ciudad</th>
              <th>Dirección</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of items">
              <td>{{ formatValue(item.nombre) }}</td>
              <td>{{ formatValue(item.ciudad) }}</td>
              <td>{{ formatValue(item.direccion) }}</td>
              <td>
                <span class="status-pill" [attr.data-state]="item.estado">
                  {{ estadoLabel(item.estado) }}
                </span>
              </td>
              <td>
                <button *ngIf="canManageSedes" type="button" class="btn-edit" (click)="openEditModal(item)">Editar</button>
                <span *ngIf="!canManageSedes">—</span>
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
            <h2>{{ isEditing ? 'Editar sede' : 'Nueva sede' }}</h2>
            <button type="button" class="modal__close" (click)="closeModal()">✕</button>
          </header>

          <form [formGroup]="sedeForm" (ngSubmit)="submit()" class="modal__body">
            <div class="field field--full">
              <label for="sede-nombre">Nombre <span class="required">*</span></label>
              <input id="sede-nombre" type="text" formControlName="nombre" placeholder="Nombre de la sede (Ej. Sede Norte)" />
            </div>

            <div class="field">
              <label for="sede-ciudad">Ciudad</label>
              <input id="sede-ciudad" type="text" formControlName="ciudad" placeholder="Ciudad" />
            </div>

            <div class="field">
              <label for="sede-direccion">Dirección</label>
              <input id="sede-direccion" type="text" formControlName="direccion" placeholder="Dirección" />
            </div>

            <div class="field" *ngIf="isEditing">
              <label for="sede-estado">Estado</label>
              <select id="sede-estado" formControlName="estado">
                <option *ngFor="let estado of estados" [value]="estado">{{ estadoLabel(estado) }}</option>
              </select>
            </div>

            <footer class="modal__footer">
              <button type="button" class="btn-cancel" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn-submit" [disabled]="saving || sedeForm.invalid">
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
    .btn-new, .refresh, .btn-edit, .btn-cancel, .btn-submit, .btn-clear { padding: 0.75rem 1rem; border-radius: 0.85rem; border: 0; font-weight: 700; cursor: pointer; }
    .btn-new, .btn-edit, .btn-submit { background: #1d4ed8; color: #fff; }
    .refresh, .btn-cancel, .btn-clear { border: 1px solid #cbd5e1; background: #fff; color: #334155; }
    .filter-grid { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) auto; gap: 0.75rem; align-items: end; }
    .field { display: grid; gap: 0.35rem; }
    .field--full { grid-column: 1 / -1; }
    .field label { font-weight: 600; color: #0f172a; font-size: 0.9rem; }
    .field input, .field select { padding: 0.75rem 1rem; border-radius: 0.75rem; border: 1px solid #cbd5e1; background: #fff; font-size: 0.95rem; width: 100%; box-sizing: border-box; }
    .status-pill { display: inline-flex; align-items: center; padding: 0.25rem 0.65rem; border-radius: 999px; font-size: 0.8rem; font-weight: 700; background: #e2e8f0; color: #334155; }
    .status-pill[data-state="ACTIVO"] { background: #dcfce7; color: #166534; }
    .status-pill[data-state="INACTIVO"] { background: #fee2e2; color: #991b1b; }
    .table-wrapper { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 1rem; }
    table { width: 100%; border-collapse: collapse; min-width: 48rem; }
    th, td { padding: 0.85rem 1rem; text-align: left; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    th { background: #f8fafc; color: #0f172a; text-transform: capitalize; white-space: nowrap; }
    .error { padding: 1rem; border-radius: 0.9rem; background: #fee2e2; color: #991b1b; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: grid; place-items: center; z-index: 1000; padding: 1rem; }
    .modal { background: #fff; border-radius: 1.25rem; width: min(100%, 38rem); padding: 1.5rem; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15); max-height: 90vh; overflow: auto; }
    .modal__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .modal__header h2 { margin: 0; font-size: 1.3rem; }
    .modal__close { background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #64748b; }
    .modal__body { display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .required { color: #b91c1c; margin-left: 2px; }
    .modal__footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; grid-column: 1 / -1; }
    .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
    @media (max-width: 640px) {
      .resource-card__header, .header-actions, .filter-grid, .modal__footer { flex-direction: column; grid-template-columns: 1fr; align-items: stretch; }
      .modal__body { grid-template-columns: 1fr; }
      .btn-new, .refresh, .btn-edit, .btn-cancel, .btn-submit, .btn-clear { width: 100%; }
    }
  `]
})
export class SedesListPageComponent implements OnInit {
  private readonly service = inject(SedeService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);

  protected readonly titulo = 'Sedes';
  protected readonly descripcion = 'Gestiona las sedes de tu institución.';
  protected readonly estados = ESTADOS_REGISTRO;

  loading = false;
  saving = false;
  showModal = false;
  error: string | null = null;
  items: Sede[] = [];
  page = 0;
  size = 10;
  total = 0;
  query = '';
  editingId: number | null = null;

  readonly filterForm = this.fb.group({
    estado: ['']
  });

  readonly sedeForm = this.fb.group({
    nombre: ['', [Validators.required]],
    ciudad: [''],
    direccion: [''],
    estado: [EstadoRegistro.ACTIVO]
  });

  get canManageSedes(): boolean {
    return this.authService.isAdminInstitucion() || this.authService.isSuperAdmin();
  }

  get isEditing(): boolean {
    return this.editingId !== null;
  }

  ngOnInit(): void {
    this.loadSedes();
  }

  onSearchChange(query: string): void {
    this.query = query.trim();
    this.page = 0;
    this.loadSedes();
  }

  applyFilters(): void {
    this.page = 0;
    this.loadSedes();
  }

  clearAllFilters(): void {
    this.query = '';
    this.filterForm.reset({ estado: '' });
    this.page = 0;
    this.loadSedes();
  }

  changePage(page: number): void {
    this.page = page;
    this.loadSedes();
  }

  reload(): void {
    this.loadSedes();
  }

  openCreateModal(): void {
    this.editingId = null;
    this.sedeForm.reset({
      nombre: '',
      ciudad: '',
      direccion: '',
      estado: EstadoRegistro.ACTIVO
    });
    this.showModal = true;
  }

  openEditModal(item: Sede): void {
    if (!item.id) {
      this.notificationService.error('No se pudo identificar la sede seleccionada.');
      return;
    }

    this.editingId = item.id;
    this.sedeForm.reset({
      nombre: item.nombre ?? '',
      ciudad: item.ciudad ?? '',
      direccion: item.direccion ?? '',
      estado: (item.estado as EstadoRegistro) ?? EstadoRegistro.ACTIVO
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.saving = false;
  }

  submit(): void {
    if (this.sedeForm.invalid) {
      this.sedeForm.markAllAsTouched();
      return;
    }

    const val = this.sedeForm.getRawValue();
    const institucionId = this.authService.getInstitucionId();

    this.saving = true;

    if (this.isEditing && this.editingId !== null) {
      const payload: SedeUpdateRequest = {
        nombre: val.nombre?.trim() ?? '',
        ciudad: val.ciudad?.trim() || null,
        direccion: val.direccion?.trim() || null,
        institucionId: institucionId ?? undefined,
        estado: val.estado ?? EstadoRegistro.ACTIVO
      };

      this.service.actualizar(this.editingId, payload).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.notificationService.success('Sede actualizada correctamente.');
          this.showModal = false;
          this.saving = false;
          this.loadSedes();
        },
        error: () => {
          this.notificationService.error('No fue posible actualizar la sede.');
          this.saving = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      const payload: SedeRequest = {
        nombre: val.nombre?.trim() ?? '',
        ciudad: val.ciudad?.trim() || null,
        direccion: val.direccion?.trim() || null,
        institucionId: institucionId ?? undefined,
        estado: EstadoRegistro.ACTIVO
      };

      this.service.crear(payload).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.notificationService.success('Sede creada correctamente.');
          this.showModal = false;
          this.saving = false;
          this.loadSedes();
        },
        error: () => {
          this.notificationService.error('No fue posible crear la sede.');
          this.saving = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  estadoLabel(estado: unknown): string {
    if (!estado) return '—';
    return String(estado) === EstadoRegistro.ACTIVO ? 'Activo' : 'Inactivo';
  }

  formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    return String(value);
  }

  private loadSedes(): void {
    this.loading = true;
    this.error = null;

    const filtros: SedeFiltros = {
      nombre: this.query || undefined,
      estado: (this.filterForm.controls.estado.value as EstadoRegistro) || undefined,
      page: this.page,
      size: this.size
    };

    this.service.listar(filtros).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: ApiResponse<PaginacionRespuesta<Sede>>) => {
        const data = response.data;
        const records = this.extractRecords(data);
        this.items = records;
        this.total = this.extractTotal(data, records.length);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'No fue posible cargar las sedes.';
        this.notificationService.error(this.error);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private extractRecords(data: PaginacionRespuesta<Sede> | Sede[] | null | undefined): Sede[] {
    if (Array.isArray(data)) {
      return data;
    }
    return (data?.content ?? data?.items ?? data?.data ?? []) as Sede[];
  }

  private extractTotal(data: PaginacionRespuesta<Sede> | Sede[] | null | undefined, fallback: number): number {
    if (Array.isArray(data)) {
      return data.length;
    }
    return data?.totalElements ?? data?.total ?? fallback;
  }
}
