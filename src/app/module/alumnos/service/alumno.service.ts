import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../../shared/interface/api-response.interface';
import { PaginacionRequest, PaginacionRespuesta } from '../../../shared/interface/pagination.interface';
import { ResourceApiService } from '../../../shared/services/resource-api.service';
import { Alumno } from '../model/alumno.model';

@Injectable({
  providedIn: 'root'
})
export class AlumnoService {
  private readonly api = inject(ResourceApiService);
  private readonly url = environment.studentsApi;

  listar(filtros: PaginacionRequest): Observable<ApiResponse<PaginacionRespuesta<Alumno>>> {
    return this.api.listar<Alumno>(this.url, filtros);
  }

  crear(payload: Record<string, unknown>): Observable<ApiResponse<Alumno>> {
    return this.api.crear<Alumno>(this.url, payload);
  }
}

