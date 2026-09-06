import { Component, inject } from '@angular/core';
import { FormField, ResourceListComponent } from '../../../components/resource-list/resource-list.component';
import { PaginacionRequest } from '../../../shared/interface/pagination.interface';
import { SemestreService } from '../service/semestre.service';

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
export class SemestresListPageComponent {
  private readonly service = inject(SemestreService);

  protected readonly titulo = 'Semestres';
  protected readonly descripcion = 'Gestiona los semestres de tu institución.';
  protected readonly loadFn = (filtros: PaginacionRequest) => this.service.listar(filtros);
  protected readonly createFn = (payload: Record<string, unknown>) => this.service.crear(payload);
  protected readonly campos: FormField[] = [
    { key: 'nombre', label: 'Nombre', type: 'text', required: true },
    { key: 'numero', label: 'Número', type: 'number', required: true },
    { key: 'anio', label: 'Año', type: 'number', required: true },
    { key: 'programaId', label: 'ID Programa', type: 'number', required: true }
  ];
}

