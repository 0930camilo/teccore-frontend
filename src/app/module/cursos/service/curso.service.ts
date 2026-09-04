import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../../shared/interface/api-response.interface';
import { PaginacionRequest, PaginacionRespuesta } from '../../../shared/interface/pagination.interface';
import { ResourceApiService } from '../../../shared/services/resource-api.service';
import { Curso } from '../model/curso.model';

@Injectable({
  providedIn: 'root'
})
export class CursoService {
  private readonly api = inject(ResourceApiService);
  private readonly url = environment.coursesApi;

  listar(filtros: PaginacionRequest): Observable<ApiResponse<PaginacionRespuesta<Curso>>> {
    return this.api.listar<Curso>(this.url, filtros);
  }

  crear(payload: Record<string, unknown>): Observable<ApiResponse<Curso>> {
    return this.api.crear<Curso>(this.url, payload);
  }
}
