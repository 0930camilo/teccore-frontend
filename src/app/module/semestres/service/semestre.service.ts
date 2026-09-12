import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { ApiResponse } from '../../../shared/interface/api-response.interface';

import {
  PaginacionRequest,
  PaginacionRespuesta
} from '../../../shared/interface/pagination.interface';

import { ResourceApiService } from '../../../shared/services/resource-api.service';

import { Semestre, SemestreRequest, SemestreUpdateRequest } from '../model/semestre.model';

@Injectable({
  providedIn: 'root'
})
export class SemestreService {

  private readonly api = inject(ResourceApiService);
  private readonly url = environment.semestersApi;

  listar(
    filtros: PaginacionRequest
  ): Observable<ApiResponse<PaginacionRespuesta<Semestre>>> {
    return this.api.listar<Semestre>(
      this.url,
      filtros
    );
  }

  crear(
    payload: SemestreRequest | Record<string, unknown>
  ): Observable<ApiResponse<Semestre>> {
    return this.api.crear<Semestre>(
      this.url,
      payload
    );
  }

  actualizar(
    id: number,
    payload: SemestreUpdateRequest | Record<string, unknown>
  ): Observable<ApiResponse<Semestre>> {
    return this.api.actualizar<Semestre>(
      this.url,
      id,
      payload
    );
  }
}
