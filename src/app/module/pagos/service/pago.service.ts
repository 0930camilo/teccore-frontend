import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../../shared/interface/api-response.interface';
import { PaginacionRequest, PaginacionRespuesta } from '../../../shared/interface/pagination.interface';
import { ResourceApiService } from '../../../shared/services/resource-api.service';
import { Pago } from '../model/pago.model';

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private readonly api = inject(ResourceApiService);
  private readonly url = environment.paymentsApi;

  listar(filtros: PaginacionRequest): Observable<ApiResponse<PaginacionRespuesta<Pago>>> {
    return this.api.listar<Pago>(this.url, filtros);
  }

  crear(payload: Record<string, unknown>): Observable<ApiResponse<Pago>> {
    return this.api.crear<Pago>(this.url, payload);
  }
}

