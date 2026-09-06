import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../../shared/interface/api-response.interface';
import { PaginacionRespuesta } from '../../../shared/interface/pagination.interface';
import { ResourceApiService } from '../../../shared/services/resource-api.service';
import { Sede, SedeFiltros, SedeRequest, SedeUpdateRequest } from '../model/sede.model';

@Injectable({
  providedIn: 'root'
})
export class SedeService {
  private readonly api = inject(ResourceApiService);
  private readonly url = environment.sedesApi;

  listar(filtros: SedeFiltros): Observable<ApiResponse<PaginacionRespuesta<Sede>>> {
    return this.api.consultar<PaginacionRespuesta<Sede>>(this.url, filtros);
  }

  crear(payload: SedeRequest): Observable<ApiResponse<Sede>> {
    return this.api.crear<Sede>(this.url, payload);
  }

  actualizar(id: number, payload: SedeUpdateRequest): Observable<ApiResponse<Sede>> {
    return this.api.actualizar<Sede>(this.url, id, payload);
  }
}
