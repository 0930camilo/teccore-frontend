import { Component, inject } from '@angular/core';
import { ResourceListComponent } from '../../../components/resource-list/resource-list.component';
import { NotaService } from '../service/nota.service';
import { PaginacionRequest } from '../../../shared/interface/pagination.interface';
@Component({
  selector: 'app-nota-list-page',
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
export class NotaListPageComponent {
  private readonly service = inject(NotaService);
  protected readonly titulo = 'Notas';
  protected readonly descripcion = 'Consulta y búsqueda de notas registradas.';
  protected readonly loadFn = (filtros: PaginacionRequest) => this.service.listar(filtros);
}

