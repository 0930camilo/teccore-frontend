import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../../shared/interface/api-response.interface';
import { PaginacionRequest, PaginacionRespuesta } from '../../../shared/interface/pagination.interface';
import { ResourceApiService } from '../../../shared/services/resource-api.service';
import { Programa } from '../model/programa.model';

@Injectable({
  providedIn: 'root'
})
export class ProgramaService {
  private readonly api = inject(ResourceApiService);
  private readonly url = environment.programsApi;

  listar(filtros: PaginacionRequest): Observable<ApiResponse<PaginacionRespuesta<Programa>>> {
    return this.api.listar<Programa>(this.url, filtros);
  }

  crear(payload: Record<string, unknown>): Observable<ApiResponse<Programa>> {
    return this.api.crear<Programa>(this.url, payload);
  }
}

