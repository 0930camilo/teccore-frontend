import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../../shared/interface/api-response.interface';
import { PaginacionRequest, PaginacionRespuesta } from '../../../shared/interface/pagination.interface';
import { ResourceApiService } from '../../../shared/services/resource-api.service';
import { Materia } from '../model/materia.model';

@Injectable({
  providedIn: 'root'
})
export class MateriaService {
  private readonly api = inject(ResourceApiService);
  private readonly url = environment.subjectsApi;

  listar(filtros: PaginacionRequest): Observable<ApiResponse<PaginacionRespuesta<Materia>>> {
    return this.api.listar<Materia>(this.url, filtros);
  }

  crear(payload: Record<string, unknown>): Observable<ApiResponse<Materia>> {
    return this.api.crear<Materia>(this.url, payload);
  }
}
