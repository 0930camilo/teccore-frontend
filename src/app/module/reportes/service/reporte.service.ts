import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../../shared/interface/api-response.interface';
import { ResumenInstitucionResponse } from '../model/reporte.model';
import { ResourceApiService } from '../../../shared/services/resource-api.service';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private readonly api = inject(ResourceApiService);
  private readonly url = `${environment.reportsApi}/resumen-institucion`;

  obtenerResumenInstitucion(institucionId: number): Observable<ApiResponse<ResumenInstitucionResponse>> {
    return this.api.consultar<ResumenInstitucionResponse>(this.url, { institucionId });
  }
}

