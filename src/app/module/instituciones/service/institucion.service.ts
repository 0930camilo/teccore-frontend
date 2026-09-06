import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../../shared/interface/api-response.interface';
import { ResourceApiService } from '../../../shared/services/resource-api.service';
import { PaginacionRespuesta } from '../../../shared/interface/pagination.interface';
import {
  Institucion,
  InstitucionFiltros,
  InstitucionRequest,
  InstitucionUpdateRequest
} from '../model/institucion.model';

@Injectable({
  providedIn: 'root'
})
export class InstitucionService {
  private readonly api = inject(ResourceApiService);
  private readonly url = environment.institutionsApi;

  listar(filtros: InstitucionFiltros): Observable<ApiResponse<PaginacionRespuesta<Institucion>>> {
    return this.api.consultar<PaginacionRespuesta<Institucion>>(this.url, filtros);
  }

  crear(payload: InstitucionRequest): Observable<ApiResponse<Institucion>> {
    return this.api.crear<Institucion>(this.url, payload);
  }

  actualizar(id: number, payload: InstitucionUpdateRequest): Observable<ApiResponse<Institucion>> {
    return this.api.actualizar<Institucion>(this.url, id, payload);
  }
}
