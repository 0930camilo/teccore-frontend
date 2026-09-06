import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../../shared/interface/api-response.interface';
import { PaginacionRespuesta } from '../../../shared/interface/pagination.interface';
import { ResourceApiService } from '../../../shared/services/resource-api.service';
import { Usuario, UsuarioFiltros, UsuarioUpdateRequest } from '../model/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly api = inject(ResourceApiService);
  private readonly url = environment.usersApi;

  listar(filtros: UsuarioFiltros): Observable<ApiResponse<PaginacionRespuesta<Usuario>>> {
    return this.api.consultar<PaginacionRespuesta<Usuario>>(this.url, filtros);
  }

  actualizar(id: number, payload: UsuarioUpdateRequest): Observable<ApiResponse<Usuario>> {
    return this.api.actualizar<Usuario>(this.url, id, payload);
  }
}

