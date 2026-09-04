import { Component, inject } from '@angular/core';
import { FormField, ResourceListComponent } from '../../../components/resource-list/resource-list.component';
import { InstitucionService } from '../service/institucion.service';
import { PaginacionRequest } from '../../../shared/interface/pagination.interface';

@Component({
  selector: 'app-institucion-list-page',
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
export class InstitucionListPageComponent {
  private readonly service = inject(InstitucionService);

  protected readonly titulo = 'Instituciones';
  protected readonly descripcion = 'Consulta y administración de instituciones registradas.';
  protected readonly loadFn = (filtros: PaginacionRequest) => this.service.listar(filtros);
  protected readonly createFn = (payload: Record<string, unknown>) => this.service.crear(payload);
  protected readonly campos: FormField[] = [
    { key: 'codigo', label: 'Código', type: 'text', required: true },
    { key: 'nombre', label: 'Nombre', type: 'text', required: true },
    { key: 'nit', label: 'NIT', type: 'text' },
    { key: 'correo', label: 'Correo', type: 'email' },
    { key: 'telefono', label: 'Teléfono', type: 'text' },
    { key: 'direccion', label: 'Dirección', type: 'text' }
  ];
}

