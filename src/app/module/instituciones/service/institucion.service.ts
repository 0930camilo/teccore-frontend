import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../../shared/interface/api-response.interface';
import { PaginacionRequest, PaginacionRespuesta } from '../../../shared/interface/pagination.interface';
import { ResourceApiService } from '../../../shared/services/resource-api.service';
import { Institucion } from '../model/institucion.model';

@Injectable({
  providedIn: 'root'
})
export class InstitucionService {
  private readonly api = inject(ResourceApiService);
  private readonly url = environment.institutionsApi;

  listar(filtros: PaginacionRequest): Observable<ApiResponse<PaginacionRespuesta<Institucion>>> {
    return this.api.listar<Institucion>(this.url, filtros);
  }

  crear(payload: Record<string, unknown>): Observable<ApiResponse<Institucion>> {
    return this.api.crear<Institucion>(this.url, payload);
  }
}
