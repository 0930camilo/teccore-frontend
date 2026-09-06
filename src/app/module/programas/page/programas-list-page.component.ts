import { Component, inject } from '@angular/core';
import { FormField, ResourceListComponent } from '../../../components/resource-list/resource-list.component';
import { PaginacionRequest } from '../../../shared/interface/pagination.interface';
import { ProgramaService } from '../service/programa.service';

@Component({
  selector: 'app-programas-list-page',
  standalone: true,
  imports: [ResourceListComponent],
  template: `
    <app-resource-list
      [title]="titulo"
      [description]="descripcion"
      [loadFn]="loadFn"
      [createFn]="createFn"
      [createFields]="campos"
      [searchPlaceholder]="'Buscar programas'"
      [emptyTitle]="'No hay programas disponibles.'"
      [emptyMessage]="'Crea un programa para comenzar.'"
    ></app-resource-list>
  `
})
export class ProgramasListPageComponent {
  private readonly service = inject(ProgramaService);

  protected readonly titulo = 'Programas';
  protected readonly descripcion = 'Gestiona los programas académicos de tu institución.';
  protected readonly loadFn = (filtros: PaginacionRequest) => this.service.listar(filtros);
  protected readonly createFn = (payload: Record<string, unknown>) => this.service.crear(payload);
  protected readonly campos: FormField[] = [
    { key: 'nombre', label: 'Nombre', type: 'text', required: true },
    { key: 'codigo', label: 'Código', type: 'text' },
    { key: 'descripcion', label: 'Descripción', type: 'text' }
  ];
}

