import { Component, inject } from '@angular/core';
import { FormField, ResourceListComponent } from '../../../components/resource-list/resource-list.component';
import { CursoService } from '../service/curso.service';
import { PaginacionRequest } from '../../../shared/interface/pagination.interface';

@Component({
  selector: 'app-curso-list-page',
  standalone: true,
  imports: [ResourceListComponent],
  template: `
    <app-resource-list
      [title]="titulo"
      [description]="descripcion"
      [loadFn]="loadFn"
      [createFn]="createFn"
      [createFields]="campos"
    ></app-resource-list>
  `
})
export class CursoListPageComponent {
  private readonly service = inject(CursoService);
  protected readonly titulo = 'Cursos';
  protected readonly descripcion = 'Consulta y búsqueda de cursos disponibles.';
  protected readonly loadFn = (filtros: PaginacionRequest) => this.service.listar(filtros);
  protected readonly createFn = (payload: Record<string, unknown>) => this.service.crear(payload);
  protected readonly campos: FormField[] = [
    { key: 'nombre',           label: 'Nombre',            type: 'text',   required: true },
    { key: 'jornada',          label: 'Jornada',           type: 'text' },
    { key: 'periodoAcademico', label: 'Período académico', type: 'text' },
    { key: 'programaId',       label: 'ID Programa',       type: 'number' },
    { key: 'institucionId',    label: 'ID Institución',    type: 'number', required: true },
  ];
}

