import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../../shared/interface/api-response.interface';
import { PaginacionRequest, PaginacionRespuesta } from '../../../shared/interface/pagination.interface';
import { ResourceApiService } from '../../../shared/services/resource-api.service';
import { Materia, MateriaRequest, MateriaUpdateRequest } from '../model/materia.model';

@Injectable({
  providedIn: 'root'
})
export class MateriaService {
  private readonly api = inject(ResourceApiService);
  private readonly url = environment.subjectsApi;

  listar(filtros: PaginacionRequest): Observable<ApiResponse<PaginacionRespuesta<Materia>>> {
    return this.api.listar<Materia>(this.url, filtros);
  }

  obtenerPorId(id: number): Observable<ApiResponse<Materia>> {
    return this.api.obtenerPorId<Materia>(this.url, id);
  }

  crear(payload: MateriaRequest | Record<string, unknown>): Observable<ApiResponse<Materia>> {
    return this.api.crear<Materia>(this.url, payload);
  }

  actualizar(id: number, payload: MateriaUpdateRequest | Record<string, unknown>): Observable<ApiResponse<Materia>> {
    return this.api.actualizar<Materia>(this.url, id, payload);
  }

  eliminar(id: number): Observable<ApiResponse<void>> {
    return this.api.eliminar<void>(this.url, id);
  }
}
