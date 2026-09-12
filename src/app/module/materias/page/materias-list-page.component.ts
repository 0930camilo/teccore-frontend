import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Rol } from '../../../shared/enums/rol.enum';
import { PaginacionRequest, PaginacionRespuesta } from '../../../shared/interface/pagination.interface';
import { NotificationService } from '../../../shared/services/notification.service';
import { Docente } from '../../docentes/model/docente.model';
import { DocenteService } from '../../docentes/service/docente.service';
import { Semestre } from '../../semestres/model/semestre.model';
import { SemestreService } from '../../semestres/service/semestre.service';
import { Materia, MateriaRequest, MateriaUpdateRequest } from '../model/materia.model';
import { MateriaService } from '../service/materia.service';

@Component({
  selector: 'app-materia-list-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="materias-page">
      <header class="materias-page__header">
        <div>
          <h1>{{ titulo }}</h1>
          <p>{{ descripcion }}</p>
        </div>
        <div class="actions">
          <button type="button" class="btn-refresh" (click)="loadMaterias()" [disabled]="loading">
            {{ loading ? 'Actualizando...' : 'Actualizar' }}
          </button>
          <button *ngIf="canManage" type="button" class="btn-primary" (click)="openCreateModal()">
            + Nueva materia
          </button>
        </div>
      </header>

      <div class="filters">
        <label for="search-input" class="search-box">
          <span>Buscar</span>
          <input
            id="search-input"
            type="search"
            placeholder="Buscar por nombre de materia..."
            [value]="query"
            (input)="onSearch($event)"
          />
        </label>
      </div>

      <div *ngIf="errorMessage" class="state-message state-message--error">
        {{ errorMessage }}
      </div>

      <div class="table-card">
        <div *ngIf="loading" class="state-message state-message--loading">
          Cargando materias...
        </div>

        <div *ngIf="!loading && items.length === 0" class="state-message state-message--empty">
          No hay materias registradas.
        </div>

        <table *ngIf="!loading && items.length > 0" class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Semestre</th>
              <th>Docente</th>
              <th>Intensidad Horaria</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of items">
              <td>{{ formatValue(item.id) }}</td>
              <td><strong>{{ formatValue(item.nombre) }}</strong></td>
              <td>{{ getSemestreNombre(item) }}</td>
              <td>
                <span class="docente-badge" *ngIf="getDocenteNombre(item) !== '—'">
                  {{ getDocenteNombre(item) }}
                </span>
                <span class="text-muted" *ngIf="getDocenteNombre(item) === '—'">Sin asignar</span>
              </td>
              <td>{{ item.intensidadHoraria != null ? item.intensidadHoraria + ' hrs' : '—' }}</td>
              <td>
                <div class="row-actions" *ngIf="canManage">
                  <button type="button" class="btn-action btn-action--edit" (click)="openEditModal(item)">
                    Editar
                  </button>
                  <button type="button" class="btn-action btn-action--delete" (click)="openDeleteConfirm(item)">
                    Eliminar
                  </button>
                </div>
                <span *ngIf="!canManage">—</span>
              </td>
            </tr>
          </tbody>
        </table>

        <footer class="pagination" *ngIf="totalElements > 0">
          <span>Total: {{ totalElements }} materias</span>
          <div class="pagination__controls">
            <button type="button" (click)="onPageChange(page - 1)" [disabled]="page <= 0 || loading">
              Anterior
            </button>
            <span>Página {{ page + 1 }} de {{ totalPages }}</span>
            <button type="button" (click)="onPageChange(page + 1)" [disabled]="page + 1 >= totalPages || loading">
              Siguiente
            </button>
          </div>
        </footer>
      </div>

      <!-- Modal de Creación / Edición -->
      <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <header class="modal-header">
            <h2>{{ isEditing ? 'Editar Materia' : 'Nueva Materia' }}</h2>
            <button type="button" class="btn-close" (click)="closeModal()" aria-label="Cerrar modal">×</button>
          </header>

          <form [formGroup]="materiaForm" (ngSubmit)="submitForm()">
            <div class="form-group">
              <label for="nombre">Nombre de la materia *</label>
              <input
                id="nombre"
                type="text"
                formControlName="nombre"
                placeholder="Ej. Algoritmos y Estructuras de Datos"
                [class.invalid]="isInvalid('nombre')"
              />
              <small class="field-error" *ngIf="isInvalid('nombre')">El nombre de la materia es obligatorio.</small>
            </div>

            <div class="form-group">
              <label for="semestreId">Semestre *</label>
              <select
                id="semestreId"
                formControlName="semestreId"
                [class.invalid]="isInvalid('semestreId')"
              >
                <option [ngValue]="null" disabled>
                  {{ loadingSemestres ? 'Cargando semestres...' : 'Selecciona un semestre' }}
                </option>
                <option *ngFor="let semestre of semestres" [ngValue]="semestre.id">
                  {{ formatSemestreOption(semestre) }}
                </option>
              </select>
              <small class="field-error" *ngIf="isInvalid('semestreId')">Debe seleccionar un semestre.</small>
            </div>

            <div class="form-group">
              <label for="docenteId">Docente asignado (opcional)</label>
              <select
                id="docenteId"
                formControlName="docenteId"
                [class.invalid]="isInvalid('docenteId')"
              >
                <option [ngValue]="null">
                  {{ loadingDocentes ? 'Cargando docentes...' : '— Sin docente asignado —' }}
                </option>
                <option *ngFor="let docente of docentes" [ngValue]="docente.id">
                  {{ formatDocenteOption(docente) }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="intensidadHoraria">Intensidad horaria (horas)</label>
              <input
                id="intensidadHoraria"
                type="number"
                min="1"
                step="1"
                formControlName="intensidadHoraria"
                placeholder="Ej. 64"
                [class.invalid]="isInvalid('intensidadHoraria')"
              />
              <small class="field-error" *ngIf="isInvalid('intensidadHoraria')">Debe ser un número mayor o igual a 1.</small>
            </div>

            <footer class="modal-actions">
              <button type="button" class="btn-cancel" (click)="closeModal()" [disabled]="submitting">
                Cancelar
              </button>
              <button type="submit" class="btn-primary" [disabled]="submitting">
                {{ submitting ? 'Guardando...' : (isEditing ? 'Actualizar materia' : 'Crear materia') }}
              </button>
            </footer>
          </form>
        </div>
      </div>

      <!-- Modal de Confirmación de Eliminación -->
      <div class="modal-backdrop" *ngIf="showDeleteModal" (click)="closeDeleteModal()">
        <div class="modal-content modal-content--sm" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <header class="modal-header">
            <h2>Eliminar Materia</h2>
            <button type="button" class="btn-close" (click)="closeDeleteModal()" aria-label="Cerrar modal">×</button>
          </header>

          <div class="modal-body-text">
            <p>¿Estás seguro de que deseas eliminar la materia <strong>{{ deletingItem?.nombre }}</strong>?</p>
            <p class="text-muted">Esta acción no se puede deshacer.</p>
          </div>

          <footer class="modal-actions">
            <button type="button" class="btn-cancel" (click)="closeDeleteModal()" [disabled]="deleting">
              Cancelar
            </button>
            <button type="button" class="btn-danger" (click)="confirmDelete()" [disabled]="deleting">
              {{ deleting ? 'Eliminando...' : 'Eliminar' }}
            </button>
          </footer>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .materias-page {
      display: grid;
      gap: 1.5rem;
      padding: 1rem;
    }

    .materias-page__header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .materias-page__header h1 {
      margin: 0;
      font-size: 1.75rem;
      color: #0f172a;
    }

    .materias-page__header p {
      margin: 0.25rem 0 0;
      color: #64748b;
    }

    .actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .btn-primary,
    .btn-refresh,
    .btn-cancel,
    .btn-danger {
      border: 0;
      border-radius: 0.5rem;
      padding: 0.65rem 1rem;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #2563eb;
      color: #fff;
    }

    .btn-primary:hover:not(:disabled) {
      background: #1d4ed8;
    }

    .btn-refresh {
      background: #e2e8f0;
      color: #1e293b;
    }

    .btn-refresh:hover:not(:disabled) {
      background: #cbd5e1;
    }

    .btn-cancel {
      background: #f1f5f9;
      color: #475569;
    }

    .btn-cancel:hover:not(:disabled) {
      background: #e2e8f0;
    }

    .btn-danger {
      background: #dc2626;
      color: #fff;
    }

    .btn-danger:hover:not(:disabled) {
      background: #b91c1c;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .filters {
      display: flex;
      gap: 1rem;
    }

    .search-box {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      width: 100%;
      max-width: 24rem;
      font-size: 0.85rem;
      color: #475569;
      font-weight: 500;
    }

    .search-box input {
      padding: 0.6rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      background: #fff;
    }

    .table-card {
      background: #fff;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }

    .table th,
    .table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
    }

    .table tbody tr:hover {
      background: #f8fafc;
    }

    .row-actions {
      display: inline-flex;
      gap: 0.5rem;
      align-items: center;
    }

    .btn-action {
      border-radius: 0.375rem;
      padding: 0.35rem 0.65rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-action--edit {
      border: 1px solid #bfdbfe;
      background: #eff6ff;
      color: #1d4ed8;
    }

    .btn-action--edit:hover {
      background: #dbeafe;
    }

    .btn-action--delete {
      border: 1px solid #fecaca;
      background: #fef2f2;
      color: #b91c1c;
    }

    .btn-action--delete:hover {
      background: #fee2e2;
    }

    .state-message {
      padding: 2rem;
      text-align: center;
      color: #64748b;
    }

    .state-message--error {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
      padding: 1rem;
      text-align: left;
    }

    .docente-badge {
      display: inline-flex;
      align-items: center;
      background: #f1f5f9;
      color: #334155;
      font-weight: 500;
      padding: 0.2rem 0.5rem;
      border-radius: 0.375rem;
      border: 1px solid #e2e8f0;
      font-size: 0.85rem;
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      font-size: 0.85rem;
      color: #64748b;
    }

    .pagination__controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .pagination__controls button {
      padding: 0.35rem 0.75rem;
      border: 1px solid #cbd5e1;
      background: #fff;
      border-radius: 0.375rem;
      cursor: pointer;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 50;
    }

    .modal-content {
      background: #fff;
      border-radius: 0.75rem;
      width: 100%;
      max-width: 30rem;
      padding: 1.5rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .modal-content--sm {
      max-width: 24rem;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
      color: #0f172a;
    }

    .modal-body-text {
      color: #334155;
      font-size: 0.95rem;
      margin-bottom: 1.25rem;
    }

    .modal-body-text p {
      margin: 0 0 0.5rem;
    }

    .text-muted {
      color: #64748b;
      font-size: 0.85rem;
    }

    .btn-close {
      background: transparent;
      border: 0;
      font-size: 1.5rem;
      line-height: 1;
      color: #94a3b8;
      cursor: pointer;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-bottom: 1rem;
    }

    .form-group label {
      font-size: 0.85rem;
      font-weight: 500;
      color: #334155;
    }

    .form-group input,
    .form-group select {
      padding: 0.6rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      background: #fff;
    }

    .form-group input.invalid,
    .form-group select.invalid {
      border-color: #ef4444;
    }

    .field-error {
      color: #dc2626;
      font-size: 0.75rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
  `]
})
export class MateriaListPageComponent implements OnInit {
  private readonly materiaService = inject(MateriaService);
  private readonly semestreService = inject(SemestreService);
  private readonly docenteService = inject(DocenteService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly titulo = 'Materias';
  readonly descripcion = 'Consulta y gestión de asignaturas y materias.';

  items: Materia[] = [];
  semestres: Semestre[] = [];
  docentes: Docente[] = [];
  loading = false;
  loadingSemestres = false;
  loadingDocentes = false;
  submitting = false;
  deleting = false;
  errorMessage = '';

  query = '';
  page = 0;
  size = 10;
  totalElements = 0;

  showModal = false;
  isEditing = false;
  editingId: number | null = null;

  showDeleteModal = false;
  deletingItem: Materia | null = null;

  readonly materiaForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S+/)]],
    semestreId: [null, [Validators.required]],
    docenteId: [null as number | null],
    intensidadHoraria: [null as number | null, [Validators.min(1)]]
  });

  get canManage(): boolean {
    const rol = this.authService.getRol();
    return rol === Rol.ADMIN_INSTITUCION || rol === Rol.ADMIN_SEDE || rol === Rol.SUPER_ADMIN;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalElements / this.size));
  }

  ngOnInit(): void {
    this.loadMaterias();
    this.loadSemestres();
    this.loadDocentes();
  }

  loadMaterias(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const request: PaginacionRequest = {
      q: this.query.trim() || undefined,
      page: this.page,
      size: this.size
    };

    this.materiaService
      .listar(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.loading = false;
          const resData = response?.data;
          this.items = this.extractRecords(resData);
          this.totalElements = this.extractTotal(resData, this.items.length);
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error?.message || 'Error al cargar las materias.';
          this.notificationService.error(this.errorMessage);
          this.cdr.markForCheck();
        }
      });
  }

  loadSemestres(): void {
    this.loadingSemestres = true;
    this.cdr.markForCheck();

    this.semestreService
      .listar({ page: 0, size: 200 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.loadingSemestres = false;
          const resData = response?.data;
          if (Array.isArray(resData)) {
            this.semestres = resData;
          } else if (resData) {
            this.semestres = (resData.content || resData.items || (resData as { data?: Semestre[] }).data || []) as Semestre[];
          } else {
            this.semestres = [];
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingSemestres = false;
          this.cdr.markForCheck();
        }
      });
  }

  loadDocentes(): void {
    this.loadingDocentes = true;
    this.cdr.markForCheck();

    this.docenteService
      .listar({ page: 0, size: 200 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.loadingDocentes = false;
          const resData = response?.data;
          if (Array.isArray(resData)) {
            this.docentes = resData;
          } else if (resData) {
            this.docentes = (resData.content || resData.items || (resData as { data?: Docente[] }).data || []) as Docente[];
          } else {
            this.docentes = [];
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingDocentes = false;
          this.cdr.markForCheck();
        }
      });
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.query = target.value ?? '';
    this.page = 0;
    this.loadMaterias();
  }

  onPageChange(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages) {
      this.page = newPage;
      this.loadMaterias();
    }
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.materiaForm.reset({
      nombre: '',
      semestreId: null,
      docenteId: null,
      intensidadHoraria: null
    });
    if (this.semestres.length === 0) {
      this.loadSemestres();
    }
    if (this.docentes.length === 0) {
      this.loadDocentes();
    }
    this.showModal = true;
    this.cdr.markForCheck();
  }

  openEditModal(item: Materia): void {
    this.isEditing = true;
    this.editingId = item.id != null ? Number(item.id) : null;
    const semestreIdVal = item.semestreId ?? (typeof item.semestre === 'object' && item.semestre ? item.semestre.id : null) ?? null;
    const docenteIdVal = item.docenteId ?? (typeof item.docente === 'object' && item.docente ? item.docente.id : null) ?? null;

    this.materiaForm.reset({
      nombre: item.nombre || '',
      semestreId: semestreIdVal != null ? Number(semestreIdVal) : null,
      docenteId: docenteIdVal != null ? Number(docenteIdVal) : null,
      intensidadHoraria: item.intensidadHoraria != null ? item.intensidadHoraria : null
    });

    if (this.semestres.length === 0) {
      this.loadSemestres();
    }
    if (this.docentes.length === 0) {
      this.loadDocentes();
    }
    this.showModal = true;
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.editingId = null;
    this.materiaForm.reset();
    this.cdr.markForCheck();
  }

  openDeleteConfirm(item: Materia): void {
    this.deletingItem = item;
    this.showDeleteModal = true;
    this.cdr.markForCheck();
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletingItem = null;
    this.cdr.markForCheck();
  }

  confirmDelete(): void {
    if (!this.deletingItem || this.deletingItem.id == null) {
      return;
    }

    this.deleting = true;
    this.cdr.markForCheck();

    this.materiaService
      .eliminar(Number(this.deletingItem.id))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deleting = false;
          this.notificationService.success('Materia eliminada exitosamente.');
          this.closeDeleteModal();
          this.loadMaterias();
        },
        error: (error) => {
          this.deleting = false;
          this.notificationService.error(error?.message || 'Error al eliminar la materia.');
          this.cdr.markForCheck();
        }
      });
  }

  isInvalid(controlName: string): boolean {
    const control = this.materiaForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  submitForm(): void {
    if (this.materiaForm.invalid) {
      this.materiaForm.markAllAsTouched();
      this.notificationService.error('Por favor complete los campos requeridos correctamente.');
      return;
    }

    this.submitting = true;
    this.cdr.markForCheck();
    const formValue = this.materiaForm.getRawValue();

    const payload: MateriaRequest = {
      nombre: String(formValue.nombre ?? '').trim(),
      semestreId: Number(formValue.semestreId),
      docenteId: formValue.docenteId !== null && formValue.docenteId !== '' && formValue.docenteId !== undefined
        ? Number(formValue.docenteId)
        : null,
      intensidadHoraria: formValue.intensidadHoraria !== null && formValue.intensidadHoraria !== ''
        ? Number(formValue.intensidadHoraria)
        : null,
      institucionId: this.authService.getInstitucionId(),
      sedeId: this.authService.getSedeId()
    };

    const action$ = this.isEditing && this.editingId != null
      ? this.materiaService.actualizar(this.editingId, payload)
      : this.materiaService.crear(payload);

    action$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting = false;
          this.notificationService.success(
            this.isEditing ? 'Materia actualizada exitosamente.' : 'Materia creada exitosamente.'
          );
          this.closeModal();
          this.loadMaterias();
        },
        error: (error) => {
          this.submitting = false;
          this.notificationService.error(
            error?.message || (this.isEditing ? 'Error al actualizar la materia.' : 'Error al crear la materia.')
          );
          this.cdr.markForCheck();
        }
      });
  }

  getDocenteNombre(item: Materia): string {
    if (item.docenteNombre && item.docenteNombre.trim().length > 0) {
      return item.docenteNombre;
    }
    if (item.docente && typeof item.docente === 'object') {
      const nombres = item.docente.nombres || '';
      const apellidos = item.docente.apellidos || '';
      const nombreCompleto = `${nombres} ${apellidos}`.trim();
      if (nombreCompleto.length > 0) {
        return nombreCompleto;
      }
    }
    if (item.docenteId != null) {
      const doc = this.docentes.find((d) => d.id === item.docenteId);
      if (doc) {
        const nombreCompleto = `${doc.nombres || ''} ${doc.apellidos || ''}`.trim();
        if (nombreCompleto.length > 0) {
          return nombreCompleto;
        }
      }
      return `Docente #${item.docenteId}`;
    }
    return '—';
  }

  formatDocenteOption(docente: Docente): string {
    const nombreCompleto = `${docente.nombres || ''} ${docente.apellidos || ''}`.trim();
    const docIdentidad = docente.documento ? ` - Doc: ${docente.documento}` : '';
    return nombreCompleto ? `${nombreCompleto}${docIdentidad}` : `Docente #${docente.id}`;
  }

  getSemestreNombre(item: Materia): string {
    if (item.semestreNombre && item.semestreNombre.trim().length > 0) {
      return item.semestreNombre;
    }
    if (item.semestre && typeof item.semestre === 'object' && 'nombre' in item.semestre && item.semestre.nombre) {
      return item.semestre.nombre;
    }
    if (item.semestreId != null) {
      const sem = this.semestres.find((s) => s.id === item.semestreId);
      if (sem?.nombre) {
        return sem.nombre;
      }
      return `Semestre #${item.semestreId}`;
    }
    return '—';
  }

  formatSemestreOption(semestre: Semestre): string {
    const nombre = semestre.nombre || `Semestre #${semestre.id}`;
    const programa = semestre.programaNombre || (semestre.programa as { nombre?: string } | undefined)?.nombre;
    return programa ? `${nombre} (${programa})` : nombre;
  }

  formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    return String(value);
  }

  private extractRecords(data: PaginacionRespuesta<Materia> | Materia[] | null | undefined): Materia[] {
    if (Array.isArray(data)) {
      return data;
    }
    const payload = data as {
      content?: Materia[];
      items?: Materia[];
      data?: Materia[];
    } | null | undefined;
    return (payload?.content ?? payload?.items ?? payload?.data ?? []) as Materia[];
  }

  private extractTotal(data: PaginacionRespuesta<Materia> | Materia[] | null | undefined, fallback: number): number {
    if (Array.isArray(data)) {
      return data.length;
    }
    const payload = data as {
      totalElements?: number;
      total?: number;
      totalCount?: number;
    } | null | undefined;
    return payload?.totalElements ?? payload?.total ?? payload?.totalCount ?? fallback;
  }
}

