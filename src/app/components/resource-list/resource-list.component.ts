import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { LoadingComponent } from '../loading/loading.component';
import { PaginationComponent } from '../pagination/pagination.component';
import { SearchInputComponent } from '../search-input/search-input.component';
import { NotificationService } from '../../shared/services/notification.service';
import { ApiResponse } from '../../shared/interface/api-response.interface';
import { PaginacionRequest, PaginacionRespuesta } from '../../shared/interface/pagination.interface';

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'select';
  required?: boolean;
  options?: { value: unknown; label: string }[];
}

@Component({
  selector: 'app-resource-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchInputComponent, LoadingComponent, EmptyStateComponent, PaginationComponent],
  template: `
    <section class="resource-card">
      <header class="resource-card__header">
        <div>
          <h1>{{ title }}</h1>
          <p>{{ description }}</p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn-new" *ngIf="createFn && createFields.length" (click)="openModal()">+ Nuevo</button>
          <button type="button" class="refresh" (click)="reload()">Actualizar</button>
        </div>
      </header>

      <app-search-input [placeholder]="searchPlaceholder" (searchChange)="search($event)"></app-search-input>

      <app-loading *ngIf="loading"></app-loading>

      <p class="error" *ngIf="!loading && error">{{ error }}</p>

      <app-empty-state
        *ngIf="!loading && !error && items.length === 0"
        [title]="emptyTitle"
        [message]="emptyMessage"
      ></app-empty-state>

      <div class="table-wrapper" *ngIf="!loading && !error && items.length > 0">
        <table>
          <thead>
            <tr>
              <th *ngFor="let column of columns">{{ column }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of items">
              <td *ngFor="let column of columns">{{ formatValue(item[column]) }}</td>
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
    </section>

    <!-- Modal de creación -->
    <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <header class="modal__header">
          <h2>Nuevo {{ title | slice:0:-1 }}</h2>
          <button type="button" class="modal__close" (click)="closeModal()">✕</button>
        </header>
        <form [formGroup]="createForm" (ngSubmit)="submitCreate()" class="modal__body">
          <div class="field" *ngFor="let field of createFields">
            <label>
              {{ field.label }}
              <span class="required" *ngIf="field.required">*</span>
            </label>
            <select *ngIf="field.type === 'select'" [formControlName]="field.key">
              <option value="">Seleccionar...</option>
              <option *ngFor="let opt of field.options" [value]="opt.value">{{ opt.label }}</option>
            </select>
            <input
              *ngIf="field.type !== 'select'"
              [type]="field.type"
              [formControlName]="field.key"
              [placeholder]="field.label"
            />
            <small class="field-error"
              *ngIf="createForm.get(field.key)?.invalid && createForm.get(field.key)?.touched">
              Este campo es obligatorio.
            </small>
          </div>
          <footer class="modal__footer">
            <button type="button" class="btn-cancel" (click)="closeModal()">Cancelar</button>
            <button type="submit" class="btn-submit" [disabled]="saving || createForm.invalid">
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </footer>
        </form>
      </div>
    </div>
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

    .refresh {
      padding: 0.75rem 1rem;
      border-radius: 0.85rem;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #334155;
      font-weight: 700;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .btn-new {
      padding: 0.75rem 1.25rem;
      border-radius: 0.85rem;
      border: 0;
      background: #1d4ed8;
      color: #fff;
      font-weight: 700;
      cursor: pointer;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15,23,42,0.45);
      display: grid;
      place-items: center;
      z-index: 1000;
    }

    .modal {
      background: #fff;
      border-radius: 1.25rem;
      width: min(100%, 32rem);
      padding: 1.5rem;
      box-shadow: 0 20px 40px rgba(15,23,42,0.15);
    }

    .modal__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .modal__header h2 { margin: 0; font-size: 1.3rem; }

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

    .required { color: #b91c1c; margin-left: 2px; }

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

    .modal__footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .btn-cancel {
      padding: 0.75rem 1.25rem;
      border-radius: 0.85rem;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #334155;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-submit {
      padding: 0.75rem 1.5rem;
      border-radius: 0.85rem;
      border: 0;
      background: #1d4ed8;
      color: #fff;
      font-weight: 700;
      cursor: pointer;
    }

    .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

    .table-wrapper {
      overflow-x: auto;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 46rem;
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
    }

    .error {
      padding: 1rem;
      border-radius: 0.9rem;
      background: #fee2e2;
      color: #991b1b;
    }
  `]
})
export class ResourceListComponent implements OnInit {
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Input() searchPlaceholder = 'Buscar...';
  @Input() emptyTitle = 'No hay registros disponibles.';
  @Input() emptyMessage = 'No se encontraron resultados para los filtros actuales.';
  @Input({ required: true }) loadFn!: (filtros: PaginacionRequest) => Observable<ApiResponse<unknown>>;
  @Input() createFn?: (payload: Record<string, unknown>) => Observable<ApiResponse<unknown>>;
  @Input() createFields: FormField[] = [];

  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  loading = false;
  saving = false;
  showModal = false;
  error: string | null = null;
  page = 0;
  size = 10;
  total = 0;
  query = '';
  items: Array<Record<string, unknown>> = [];
  columns: string[] = [];
  createForm = this.fb.group({});

  ngOnInit(): void {
    this.reload();
  }

  openModal(): void {
    const controls: Record<string, ReturnType<typeof this.fb.control>> = {};
    for (const field of this.createFields) {
      controls[field.key] = this.fb.control('', field.required ? Validators.required : []);
    }
    this.createForm = this.fb.group(controls);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  submitCreate(): void {
    if (this.createForm.invalid || !this.createFn) return;
    this.saving = true;
    const payload = this.createForm.getRawValue() as Record<string, unknown>;
    this.createFn(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notificationService.success('Registro creado correctamente.');
        this.showModal = false;
        this.reload();
        this.saving = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.notificationService.error('No fue posible crear el registro.');
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  search(query: string): void {
    this.query = query;
    this.page = 0;
    this.reload();
  }

  changePage(page: number): void {
    this.page = page;
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = null;

    this.loadFn({ q: this.query, page: this.page, size: this.size }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        const data = response.data as PaginacionRespuesta<Record<string, unknown>> | Record<string, unknown>[] | null | undefined;
        const records = this.extractRecords(data);
        this.items = records;
        this.columns = records[0] ? Object.keys(records[0]) : [];
        this.total = this.extractTotal(data, records.length);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'No fue posible cargar la información.';
        this.notificationService.error(this.error);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  private extractRecords(data: PaginacionRespuesta<Record<string, unknown>> | Record<string, unknown>[] | null | undefined): Array<Record<string, unknown>> {
    if (Array.isArray(data)) {
      return data;
    }

    return (data?.content ?? data?.items ?? data?.data ?? []) as Array<Record<string, unknown>>;
  }

  private extractTotal(data: PaginacionRespuesta<Record<string, unknown>> | Record<string, unknown>[] | null | undefined, fallback: number): number {
    if (Array.isArray(data)) {
      return data.length;
    }

    return data?.totalElements ?? data?.total ?? fallback;
  }
}

