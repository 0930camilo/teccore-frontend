import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../../shared/interface/api-response.interface';
import { PaginacionRequest, PaginacionRespuesta } from '../../../shared/interface/pagination.interface';
import { ResourceApiService } from '../../../shared/services/resource-api.service';
import { Actividad } from '../model/actividad.model';

@Injectable({
  providedIn: 'root'
})
export class ActividadService {
  private readonly api = inject(ResourceApiService);
  private readonly url = environment.activitiesApi;

  listar(filtros: PaginacionRequest): Observable<ApiResponse<PaginacionRespuesta<Actividad>>> {
    return this.api.listar<Actividad>(this.url, filtros);
  }

  crear(payload: Record<string, unknown>): Observable<ApiResponse<Actividad>> {
    return this.api.crear<Actividad>(this.url, payload);
  }
}
