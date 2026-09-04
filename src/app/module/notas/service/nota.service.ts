import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../../shared/interface/api-response.interface';
import { PaginacionRequest, PaginacionRespuesta } from '../../../shared/interface/pagination.interface';
import { ResourceApiService } from '../../../shared/services/resource-api.service';
import { Nota } from '../model/nota.model';

@Injectable({
  providedIn: 'root'
})
export class NotaService {
  private readonly api = inject(ResourceApiService);
  private readonly url = environment.gradesApi;

  listar(filtros: PaginacionRequest): Observable<ApiResponse<PaginacionRespuesta<Nota>>> {
    return this.api.listar<Nota>(this.url, filtros);
  }

  crear(payload: Record<string, unknown>): Observable<ApiResponse<Nota>> {
    return this.api.crear<Nota>(this.url, payload);
  }
}

