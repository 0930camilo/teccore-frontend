import { Component, inject } from '@angular/core';
import { ResourceListComponent } from '../../../components/resource-list/resource-list.component';
import { ActividadService } from '../service/actividad.service';
import { PaginacionRequest } from '../../../shared/interface/pagination.interface';
@Component({
  selector: 'app-actividad-list-page',
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
export class ActividadListPageComponent {
  private readonly service = inject(ActividadService);
  protected readonly titulo = 'Actividades';
  protected readonly descripcion = 'Consulta y búsqueda de actividades académicas.';
  protected readonly loadFn = (filtros: PaginacionRequest) => this.service.listar(filtros);
}

