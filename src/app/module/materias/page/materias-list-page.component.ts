import { Component, inject } from '@angular/core';
import { ResourceListComponent } from '../../../components/resource-list/resource-list.component';
import { MateriaService } from '../service/materia.service';
import { PaginacionRequest } from '../../../shared/interface/pagination.interface';
@Component({
  selector: 'app-materia-list-page',
  standalone: true,
  imports: [ResourceListComponent],
  template: `
    <app-resource-list
      [title]="titulo"
      [description]="descripcion"
      [loadFn]="loadFn"
    ></app-resource-list>
  `
})
export class MateriaListPageComponent {
  private readonly service = inject(MateriaService);
  protected readonly titulo = 'Materias';
  protected readonly descripcion = 'Consulta y búsqueda de materias registradas.';
  protected readonly loadFn = (filtros: PaginacionRequest) => this.service.listar(filtros);
}

