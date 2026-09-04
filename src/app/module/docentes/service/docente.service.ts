import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../../shared/interface/api-response.interface';
import { PaginacionRequest, PaginacionRespuesta } from '../../../shared/interface/pagination.interface';
import { ResourceApiService } from '../../../shared/services/resource-api.service';
import { Docente } from '../model/docente.model';

@Injectable({
  providedIn: 'root'
})
export class DocenteService {
  private readonly api = inject(ResourceApiService);
  private readonly url = environment.teachersApi;

  listar(filtros: PaginacionRequest): Observable<ApiResponse<PaginacionRespuesta<Docente>>> {
    return this.api.listar<Docente>(this.url, filtros);
  }

  crear(payload: Record<string, unknown>): Observable<ApiResponse<Docente>> {
    return this.api.crear<Docente>(this.url, payload);
  }
}
