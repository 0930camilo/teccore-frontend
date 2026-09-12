import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Rol } from '../../../shared/enums/rol.enum';
import { PaginacionRequest, PaginacionRespuesta } from '../../../shared/interface/pagination.interface';
import { NotificationService } from '../../../shared/services/notification.service';
import { Docente, DocenteRequest } from '../model/docente.model';
import { DocenteService } from '../service/docente.service';

@Component({
  selector: 'app-docente-list-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="docentes-page">
      <header class="docentes-page__header">
        <div>
          <h1>{{ titulo }}</h1>
          <p>{{ descripcion }}</p>
        </div>
        <div class="actions">
          <button type="button" class="btn-refresh" (click)="loadDocentes()" [disabled]="loading">
            {{ loading ? 'Actualizando...' : 'Actualizar' }}
          </button>
          <button *ngIf="canManage" type="button" class="btn-primary" (click)="openCreateModal()">
            + Nuevo docente
          </button>
        </div>
      </header>

      <div class="filters">
        <label for="search-input" class="search-box">
          <span>Buscar</span>
          <input
            id="search-input"
            type="search"
            placeholder="Buscar por nombre o apellido..."
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
          Cargando docentes...
        </div>

        <div *ngIf="!loading && items.length === 0" class="state-message state-message--empty">
          No hay docentes registrados.
        </div>

        <table *ngIf="!loading && items.length > 0" class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Documento</th>
              <th>Correo</th>
              <th>Carga Horaria (Semanal)</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of items">
              <td>{{ formatValue(item.id) }}</td>
              <td>{{ formatValue(item.nombres) }}</td>
              <td>{{ formatValue(item.apellidos) }}</td>
              <td>{{ formatValue(item.documento) }}</td>
              <td>{{ formatValue(item.correo) }}</td>
              <td>{{ item.cargaHorariaSemanal != null ? item.cargaHorariaSemanal + ' hrs' : '—' }}</td>
            </tr>
          </tbody>
        </table>

        <footer class="pagination" *ngIf="totalElements > 0">
          <span>Total: {{ totalElements }} docentes</span>
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

      <!-- Modal de Creación -->
      <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <header class="modal-header">
            <h2>Nuevo Docente</h2>
            <button type="button" class="btn-close" (click)="closeModal()" aria-label="Cerrar modal">×</button>
          </header>

          <form [formGroup]="docenteForm" (ngSubmit)="submitForm()">
            <div class="form-group">
              <label for="nombres">Nombres *</label>
              <input
                id="nombres"
                type="text"
                formControlName="nombres"
                placeholder="Ej. Juan Carlos"
                [class.invalid]="isInvalid('nombres')"
              />
              <small class="field-error" *ngIf="isInvalid('nombres')">Los nombres son obligatorios.</small>
            </div>

            <div class="form-group">
              <label for="apellidos">Apellidos *</label>
              <input
                id="apellidos"
                type="text"
                formControlName="apellidos"
                placeholder="Ej. Pérez Gómez"
                [class.invalid]="isInvalid('apellidos')"
              />
              <small class="field-error" *ngIf="isInvalid('apellidos')">Los apellidos son obligatorios.</small>
            </div>

            <div class="form-group">
              <label for="documento">Documento de identidad *</label>
              <input
                id="documento"
                type="text"
                formControlName="documento"
                placeholder="Ej. 1020304050"
                [class.invalid]="isInvalid('documento')"
              />
              <small class="field-error" *ngIf="isInvalid('documento')">El documento es obligatorio.</small>
            </div>

            <div class="form-group">
              <label for="correo">Correo electrónico</label>
              <input
                id="correo"
                type="email"
                formControlName="correo"
                placeholder="Ej. docente@institucion.edu.co"
                [class.invalid]="isInvalid('correo')"
              />
              <small class="field-error" *ngIf="isInvalid('correo')">Ingrese un correo electrónico válido.</small>
            </div>

            <div class="form-group">
              <label for="cargaHorariaSemanal">Carga horaria semanal (horas)</label>
              <input
                id="cargaHorariaSemanal"
                type="number"
                min="1"
                step="1"
                formControlName="cargaHorariaSemanal"
                placeholder="Ej. 20"
                [class.invalid]="isInvalid('cargaHorariaSemanal')"
              />
              <small class="field-error" *ngIf="isInvalid('cargaHorariaSemanal')">Debe ser un número mayor o igual a 1.</small>
            </div>

            <footer class="modal-actions">
              <button type="button" class="btn-cancel" (click)="closeModal()" [disabled]="submitting">
                Cancelar
              </button>
              <button type="submit" class="btn-primary" [disabled]="submitting">
                {{ submitting ? 'Guardando...' : 'Crear docente' }}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .docentes-page {
      display: grid;
      gap: 1.5rem;
      padding: 1rem;
    }

    .docentes-page__header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .docentes-page__header h1 {
      margin: 0;
      font-size: 1.75rem;
      color: #0f172a;
    }

    .docentes-page__header p {
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
    .btn-cancel {
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

    .btn-close {
      border: 0;
      background: transparent;
      font-size: 1.5rem;
      cursor: pointer;
      color: #94a3b8;
    }

    .btn-close:hover {
      color: #475569;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-bottom: 1rem;
    }

    .form-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
    }

    .form-group input {
      padding: 0.6rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 0.9rem;
    }

    .form-group input.invalid {
      border-color: #ef4444;
    }

    .field-error {
      color: #ef4444;
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
export class DocenteListPageComponent implements OnInit {
  private readonly docenteService = inject(DocenteService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly titulo = 'Docentes';
  readonly descripcion = 'Consulta y registro de docentes por institución.';

  items: Docente[] = [];
  loading = false;
  submitting = false;
  errorMessage = '';

  query = '';
  page = 0;
  size = 10;
  totalElements = 0;

  showModal = false;

  readonly docenteForm = this.fb.group({
    nombres: ['', [Validators.required, Validators.pattern(/\S+/)]],
    apellidos: ['', [Validators.required, Validators.pattern(/\S+/)]],
    documento: ['', [Validators.required, Validators.pattern(/\S+/)]],
    correo: ['', [Validators.email]],
    cargaHorariaSemanal: [null as number | null, [Validators.min(1)]]
  });

  get canManage(): boolean {
    const rol = this.authService.getRol();
    return rol === Rol.ADMIN_INSTITUCION || rol === Rol.ADMIN_SEDE || rol === Rol.SUPER_ADMIN;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalElements / this.size));
  }

  ngOnInit(): void {
    this.loadDocentes();
  }

  loadDocentes(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const filtros: PaginacionRequest = {
      q: this.query.trim() || undefined,
      page: this.page,
      size: this.size
    };

    this.docenteService
      .listar(filtros)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.loading = false;
          const data = response?.data;
          this.items = this.extractRecords(data);
          this.totalElements = this.extractTotal(data, this.items.length);
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error?.message || 'Error al cargar la lista de docentes.';
          this.notificationService.error(this.errorMessage);
          this.cdr.markForCheck();
        }
      });
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.query = target.value ?? '';
    this.page = 0;
    this.loadDocentes();
  }

  onPageChange(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages) {
      this.page = newPage;
      this.loadDocentes();
    }
  }

  openCreateModal(): void {
    this.docenteForm.reset({
      nombres: '',
      apellidos: '',
      documento: '',
      correo: '',
      cargaHorariaSemanal: null
    });
    this.showModal = true;
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.showModal = false;
    this.cdr.markForCheck();
  }

  isInvalid(field: string): boolean {
    const control = this.docenteForm.get(field);
    return Boolean(control && control.invalid && (control.dirty || control.touched));
  }

  submitForm(): void {
    if (this.docenteForm.invalid) {
      this.docenteForm.markAllAsTouched();
      return;
    }

    const val = this.docenteForm.getRawValue();
    const institucionId = this.authService.getInstitucionId();

    const payload: DocenteRequest = {
      nombres: String(val.nombres ?? '').trim(),
      apellidos: String(val.apellidos ?? '').trim(),
      documento: String(val.documento ?? '').trim(),
      correo: val.correo ? String(val.correo).trim() : null,
      cargaHorariaSemanal: val.cargaHorariaSemanal != null
        ? Number(val.cargaHorariaSemanal)
        : null,
      institucionId: institucionId ? Number(institucionId) : null
    };

    this.submitting = true;
    this.cdr.markForCheck();

    this.docenteService
      .crear(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting = false;
          this.notificationService.success('Docente registrado exitosamente.');
          this.closeModal();
          this.loadDocentes();
        },
        error: (error) => {
          this.submitting = false;
          this.notificationService.error(error?.message || 'Error al crear el docente.');
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

  private extractRecords(data: PaginacionRespuesta<Docente> | Docente[] | null | undefined): Docente[] {
    if (Array.isArray(data)) {
      return data;
    }
    return (data?.content ?? data?.items ?? data?.data ?? []) as Docente[];
  }

  private extractTotal(data: PaginacionRespuesta<Docente> | Docente[] | null | undefined, fallback: number): number {
    if (Array.isArray(data)) {
      return data.length;
    }
    return data?.totalElements ?? data?.total ?? fallback;
  }
}

