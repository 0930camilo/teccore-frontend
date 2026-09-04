import { Component, inject } from '@angular/core';
import { ResourceListComponent } from '../../../components/resource-list/resource-list.component';
import { AlumnoService } from '../service/alumno.service';
import { PaginacionRequest } from '../../../shared/interface/pagination.interface';
@Component({
  selector: 'app-alumno-list-page',
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
export class AlumnoListPageComponent {
  private readonly service = inject(AlumnoService);
  protected readonly titulo = 'Alumnos';
  protected readonly descripcion = 'Consulta y búsqueda de alumnos registrados.';
  protected readonly loadFn = (filtros: PaginacionRequest) => this.service.listar(filtros);
}

