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
import { PaginacionRequest, PaginacionRespuesta } from '../../../shared/interface/pagination.interface';
import { NotificationService } from '../../../shared/services/notification.service';
import { Programa } from '../../programas/model/programa.model';
import { ProgramaService } from '../../programas/service/programa.service';
import { Semestre, SemestreRequest } from '../model/semestre.model';
import { SemestreService } from '../service/semestre.service';

@Component({
  selector: 'app-semestres-list-page',
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
          <button *ngIf="canManage" type="button" class="btn-new" (click)="openCreateModal()">+ Nuevo semestre</button>
          <button type="button" class="refresh" (click)="reload()">Actualizar</button>
        </div>
      </header>

      <app-search-input
        [placeholder]="'Buscar semestres'"
        [showClearButton]="false"
        (searchChange)="onSearchChange($event)"
      ></app-search-input>

      <app-loading *ngIf="loading"></app-loading>

      <p class="error" *ngIf="!loading && error">{{ error }}</p>

      <app-empty-state
        *ngIf="!loading && !error && items.length === 0"
        title="No hay semestres disponibles."
        message="Crea un semestre para comenzar."
      ></app-empty-state>

      <div class="table-wrapper" *ngIf="!loading && !error && items.length > 0">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Número</th>
              <th>Año</th>
              <th>Programa</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of items">
              <td>{{ formatValue(item.nombre) }}</td>
              <td>{{ formatValue(item.numero) }}</td>
              <td>{{ formatValue(item.anio) }}</td>
              <td>{{ getProgramaNombre(item) }}</td>
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

      <!-- Modal de creación / edición -->
      <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <header class="modal__header">
            <h2>{{ isEditing ? 'Editar semestre' : 'Nuevo semestre' }}</h2>
            <button type="button" class="modal__close" (click)="closeModal()">✕</button>
          </header>

          <form [formGroup]="semestreForm" (ngSubmit)="submit()" class="modal__body">
            <div class="field field--full">
              <label for="semestre-nombre">Nombre <span class="required">*</span></label>
              <input id="semestre-nombre" type="text" formControlName="nombre" placeholder="Nombre del semestre (ej. 2026-1)" />
              <small class="field-error" *ngIf="semestreForm.get('nombre')?.invalid && semestreForm.get('nombre')?.touched">
                El nombre es obligatorio.
              </small>
            </div>

            <div class="field">
              <label for="semestre-numero">Número <span class="required">*</span></label>
              <input id="semestre-numero" type="number" min="1" formControlName="numero" placeholder="Ej. 1" />
              <small class="field-error" *ngIf="semestreForm.get('numero')?.invalid && semestreForm.get('numero')?.touched">
                El número es obligatorio.
              </small>
            </div>

            <div class="field">
              <label for="semestre-anio">Año <span class="required">*</span></label>
              <input id="semestre-anio" type="number" min="1900" formControlName="anio" placeholder="Ej. 2026" />
              <small class="field-error" *ngIf="semestreForm.get('anio')?.invalid && semestreForm.get('anio')?.touched">
                El año es obligatorio.
              </small>
            </div>

            <div class="field field--full">
              <label for="semestre-programa">Programa <span class="required">*</span></label>
              <select id="semestre-programa" formControlName="programaId">
                <option [ngValue]="null">Seleccionar programa...</option>
                <option *ngFor="let prog of programaOptions" [ngValue]="prog.value">{{ prog.label }}</option>
              </select>
              <small class="field-error" *ngIf="semestreForm.get('programaId')?.invalid && semestreForm.get('programaId')?.touched">
                El programa es obligatorio.
              </small>
            </div>

            <footer class="modal__footer">
              <button type="button" class="btn-cancel" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn-submit" [disabled]="saving || semestreForm.invalid">
                {{ saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar') }}
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
    h1 { margin: 0; font-size: 1.5rem; }
    p { margin: 0.25rem 0 0; color: #64748b; }
    .header-actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .btn-new, .refresh, .btn-edit, .btn-cancel, .btn-submit {
      padding: 0.75rem 1rem;
      border-radius: 0.85rem;
      border: 0;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-new, .btn-edit, .btn-submit { background: #1d4ed8; color: #fff; }
    .refresh, .btn-cancel { border: 1px solid #cbd5e1; background: #fff; color: #334155; }
    .table-wrapper { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 1rem; }
    table { width: 100%; border-collapse: collapse; min-width: 40rem; }
    th, td { padding: 0.85rem 1rem; text-align: left; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    th { background: #f8fafc; color: #0f172a; text-transform: capitalize; white-space: nowrap; }
    .error { padding: 1rem; border-radius: 0.9rem; background: #fee2e2; color: #991b1b; }
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
      width: min(100%, 36rem);
      padding: 1.5rem;
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
      max-height: 90vh;
      overflow: auto;
    }
    .modal__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .modal__header h2 { margin: 0; font-size: 1.3rem; }
    .modal__close { background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #64748b; }
    .modal__body { display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .field { display: grid; gap: 0.35rem; }
    .field--full { grid-column: 1 / -1; }
    .field label { font-weight: 600; color: #0f172a; font-size: 0.9rem; }
    .field input, .field select {
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      border: 1px solid #cbd5e1;
      background: #fff;
      font-size: 0.95rem;
      width: 100%;
      box-sizing: border-box;
    }
    .field-error { color: #b91c1c; font-size: 0.8rem; }
    .required { color: #b91c1c; margin-left: 2px; }
    .modal__footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; grid-column: 1 / -1; }
    .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
    @media (max-width: 640px) {
      .resource-card__header, .header-actions, .modal__footer { flex-direction: column; align-items: stretch; }
      .modal__body { grid-template-columns: 1fr; }
      .btn-new, .refresh, .btn-edit, .btn-cancel, .btn-submit { width: 100%; }
    }
  `]
})
export class SemestresListPageComponent implements OnInit {
  private readonly service = inject(SemestreService);
  private readonly programaService = inject(ProgramaService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);

  protected readonly titulo = 'Semestres';
  protected readonly descripcion = 'Gestiona los semestres de tu institución.';

  programaOptions: { value: number; label: string }[] = [];
  loading = false;
  saving = false;
  showModal = false;
  error: string | null = null;
  items: Semestre[] = [];
  page = 0;
  size = 10;
  total = 0;
  query = '';
  editingId: number | null = null;

  readonly semestreForm = this.fb.group({
    nombre: ['', [Validators.required]],
    numero: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    anio: this.fb.control<number | null>(new Date().getFullYear(), [Validators.required, Validators.min(1900)]),
    programaId: this.fb.control<number | null>(null, [Validators.required])
  });

  ngOnInit(): void {
    this.loadProgramasOptions();
    this.loadSemestres();
  }

  get canManage(): boolean {
    return this.authService.isAdminSede() || this.authService.isSuperAdmin() || this.authService.isAdminInstitucion();
  }

  get isEditing(): boolean {
    return this.editingId !== null;
  }

  onSearchChange(query: string): void {
    this.query = query.trim();
    this.page = 0;
    this.loadSemestres();
  }

  changePage(page: number): void {
    this.page = page;
    this.loadSemestres();
  }

  reload(): void {
    this.loadProgramasOptions();
    this.loadSemestres();
  }

  openCreateModal(): void {
    this.editingId = null;
    this.semestreForm.reset({
      nombre: '',
      numero: null,
      anio: new Date().getFullYear(),
      programaId: null
    });
    this.showModal = true;
  }

  openEditModal(item: Semestre): void {
    const id = this.parseId(item.id);
    if (id === null) {
      this.notificationService.error('No se pudo identificar el semestre seleccionado.');
      return;
    }

    const programaId = this.toNumber(item.programaId ?? item.programa?.id);

    this.editingId = id;
    this.semestreForm.reset({
      nombre: item.nombre ?? '',
      numero: this.toNumber(item.numero),
      anio: this.toNumber(item.anio),
      programaId: programaId
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.saving = false;
  }

  submit(): void {
    if (this.semestreForm.invalid) {
      this.semestreForm.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload(this.semestreForm.getRawValue() as Record<string, unknown>);
    this.saving = true;

    const request$ = this.isEditing && this.editingId !== null
      ? this.service.actualizar(this.editingId, payload)
      : this.service.crear(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notificationService.success(
          this.isEditing ? 'Semestre actualizado correctamente.' : 'Semestre creado correctamente.'
        );
        this.showModal = false;
        this.saving = false;
        this.loadSemestres();
      },
      error: () => {
        this.notificationService.error(
          this.isEditing ? 'No fue posible actualizar el semestre.' : 'No fue posible crear el semestre.'
        );
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

  getProgramaNombre(target: Semestre | number | null | undefined): string {
    if (!target && target !== 0) {
      return '—';
    }

    if (typeof target === 'object') {
      const directName = target.programaNombre || target.programa?.nombre;
      if (directName && String(directName).trim().length > 0) {
        return String(directName).trim();
      }

      const id = this.toNumber(target.programaId ?? target.programa?.id);
      if (id !== null) {
        const match = this.programaOptions.find((p) => p.value === id);
        return match ? match.label : String(id);
      }

      return '—';
    }

    const id = this.toNumber(target);
    if (id === null) {
      return '—';
    }
    const match = this.programaOptions.find((p) => p.value === id);
    return match ? match.label : String(id);
  }

  private loadSemestres(): void {
    this.loading = true;
    this.error = null;

    this.service
      .listar(this.buildFilters())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: ApiResponse<PaginacionRespuesta<Semestre>>) => {
          const data = response.data;
          const records = this.extractRecords(data);
          this.items = records;
          this.total = this.extractTotal(data, records.length);
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.error = 'No fue posible cargar los semestres.';
          this.notificationService.error(this.error);
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private loadProgramasOptions(): void {
    this.programaService
      .listar({
        page: 0,
        size: 200,
        q: undefined
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const programas = this.extractProgramas(response.data);
          this.programaOptions = programas
            .filter((item) => Number.isFinite(item.id) && String(item.nombre ?? '').trim().length > 0)
            .map((item) => ({
              value: item.id as number,
              label: String(item.nombre).trim()
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
          this.cdr.markForCheck();
        },
        error: () => {
          this.notificationService.error('No fue posible cargar los programas para seleccionar en semestres.');
        }
      });
  }

  private buildFilters(): PaginacionRequest {
    return {
      q: this.query || undefined,
      page: this.page,
      size: this.size
    };
  }

  private buildPayload(payload: Record<string, unknown>): SemestreRequest {
    return {
      nombre: String(payload['nombre'] ?? '').trim(),
      numero: this.toNumber(payload['numero']),
      anio: this.toNumber(payload['anio']),
      programaId: this.toNumber(payload['programaId']),
      institucionId: this.authService.getInstitucionId(),
      sedeId: this.authService.getSedeId()
    };
  }

  private extractRecords(data: PaginacionRespuesta<Semestre> | Semestre[] | null | undefined): Semestre[] {
    if (Array.isArray(data)) {
      return data;
    }
    return (data?.content ?? data?.items ?? data?.data ?? []) as Semestre[];
  }

  private extractTotal(data: PaginacionRespuesta<Semestre> | Semestre[] | null | undefined, fallback: number): number {
    if (Array.isArray(data)) {
      return data.length;
    }
    return data?.totalElements ?? data?.total ?? fallback;
  }

  private extractProgramas(data: unknown): Programa[] {
    if (Array.isArray(data)) {
      return data as Programa[];
    }
    const payload = data as {
      content?: Programa[];
      items?: Programa[];
      data?: Programa[];
    } | null | undefined;

    return payload?.content ?? payload?.items ?? payload?.data ?? [];
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
}
