import { Component, inject } from '@angular/core';
import { ResourceListComponent } from '../../../components/resource-list/resource-list.component';
import { DocenteService } from '../service/docente.service';
import { PaginacionRequest } from '../../../shared/interface/pagination.interface';
@Component({
  selector: 'app-docente-list-page',
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
export class DocenteListPageComponent {
  private readonly service = inject(DocenteService);
  protected readonly titulo = 'Docentes';
  protected readonly descripcion = 'Consulta y búsqueda de docentes por institución.';
  protected readonly loadFn = (filtros: PaginacionRequest) => this.service.listar(filtros);
}

