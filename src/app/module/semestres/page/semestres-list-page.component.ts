import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField, ResourceListComponent } from '../../../components/resource-list/resource-list.component';
import { Programa } from '../../programas/model/programa.model';
import { ProgramaService } from '../../programas/service/programa.service';
import { PaginacionRequest } from '../../../shared/interface/pagination.interface';
import { NotificationService } from '../../../shared/services/notification.service';
import { SemestreService } from '../service/semestre.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-semestres-list-page',
  standalone: true,
  imports: [ResourceListComponent],
  template: `
    <app-resource-list
      [title]="titulo"
      [description]="descripcion"
      [loadFn]="loadFn"
      [createFn]="createFn"
      [createFields]="campos"
      [searchPlaceholder]="'Buscar semestres'"
      [emptyTitle]="'No hay semestres disponibles.'"
      [emptyMessage]="'Crea un semestre para comenzar.'"
    ></app-resource-list>
  `
})
export class SemestresListPageComponent implements OnInit {
  private readonly service = inject(SemestreService);
  private readonly programaService = inject(ProgramaService);
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly titulo = 'Semestres';
  protected readonly descripcion = 'Gestiona los semestres de tu institución.';
  protected readonly loadFn = (filtros: PaginacionRequest) => this.service.listar(filtros);
  protected readonly createFn = (payload: Record<string, unknown>) => this.service.crear(this.buildCreatePayload(payload));
  protected campos: FormField[] = [
    { key: 'nombre', label: 'Nombre', type: 'text', required: true },
    { key: 'numero', label: 'Número', type: 'number', required: true },
    { key: 'programaId', label: 'Programa', type: 'select', required: true, options: [] }
  ];

  ngOnInit(): void {
    this.loadProgramasOptions();
  }

  private loadProgramasOptions(): void {
    this.programaService.listar({ page: 0, size: 200, q: undefined }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        const programas = this.extractProgramas(response.data);
        const options = programas
          .filter((item) => Number.isFinite(item.id) && String(item.nombre ?? '').trim().length > 0)
          .map((item) => ({ value: item.id as number, label: String(item.nombre).trim() }))
          .sort((a, b) => a.label.localeCompare(b.label));

        this.campos = this.campos.map((field) =>
          field.key === 'programaId' ? { ...field, options } : field
        );
      },
      error: () => {
        this.notificationService.error('No fue posible cargar los programas para seleccionar en semestres.');
      }
    });
  }

  private buildCreatePayload(payload: Record<string, unknown>): Record<string, unknown> {
    return {
      nombre: String(payload['nombre'] ?? '').trim(),
      numero: this.toNumber(payload['numero']),
      programaId: this.toNumber(payload['programaId']),
      institucionId: this.authService.getInstitucionId()
    };
  }

  private extractProgramas(data: unknown): Programa[] {
    if (Array.isArray(data)) {
      return data as Programa[];
    }

    const payload = data as { content?: Programa[]; items?: Programa[]; data?: Programa[] } | null | undefined;
    return payload?.content ?? payload?.items ?? payload?.data ?? [];
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}

