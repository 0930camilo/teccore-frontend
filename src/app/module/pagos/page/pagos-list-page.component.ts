import { Component, inject } from '@angular/core';
import { ResourceListComponent } from '../../../components/resource-list/resource-list.component';
import { PagoService } from '../service/pago.service';
import { PaginacionRequest } from '../../../shared/interface/pagination.interface';
@Component({
  selector: 'app-pago-list-page',
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
export class PagoListPageComponent {
  private readonly service = inject(PagoService);
  protected readonly titulo = 'Pagos';
  protected readonly descripcion = 'Consulta y búsqueda de pagos registrados.';
  protected readonly loadFn = (filtros: PaginacionRequest) => this.service.listar(filtros);
}

