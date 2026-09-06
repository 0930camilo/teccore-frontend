import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../interface/api-response.interface';
import { PaginacionRequest, PaginacionRespuesta } from '../interface/pagination.interface';

@Injectable({
  providedIn: 'root'
})
export class ResourceApiService {
  private readonly http = inject(HttpClient);

  listar<T>(baseUrl: string, filtros: PaginacionRequest): Observable<ApiResponse<PaginacionRespuesta<T>>> {
    return this.http.get<ApiResponse<PaginacionRespuesta<T>>>(baseUrl, {
      params: this.buildParams(filtros)
    });
  }

  crear<TRespuesta>(baseUrl: string, body: object): Observable<ApiResponse<TRespuesta>> {
    return this.http.post<ApiResponse<TRespuesta>>(baseUrl, body);
  }

  actualizar<TRespuesta>(baseUrl: string, id: number | string, body: object): Observable<ApiResponse<TRespuesta>> {
    return this.http.put<ApiResponse<TRespuesta>>(`${baseUrl}/${id}`, body);
  }

  consultar<TRespuesta>(baseUrl: string, params: object): Observable<ApiResponse<TRespuesta>> {
    return this.http.get<ApiResponse<TRespuesta>>(baseUrl, {
      params: this.buildParams(params)
    });
  }

  private buildParams(values: object): HttpParams {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(values as Record<string, string | number | boolean | null | undefined>)) {
      if (value === null || value === undefined || value === '') {
        continue;
      }

      params = params.set(key, String(value));
    }

    return params;
  }
}



