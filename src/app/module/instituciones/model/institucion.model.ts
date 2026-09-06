import { EstadoRegistro } from '../../../shared/enums/estado-registro.enum';
import { PaginacionRequest } from '../../../shared/interface/pagination.interface';

export interface Institucion {
  id?: number;
  codigo?: string;
  nombre?: string;
  nit?: string | null;
  correo?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  estado?: EstadoRegistro | null;
}

export interface InstitucionRequest {
  codigo: string;
  nombre: string;
  nit?: string | null;
  correo?: string | null;
  telefono?: string | null;
  direccion?: string | null;
}

export interface InstitucionUpdateRequest extends InstitucionRequest {
  estado?: EstadoRegistro | null;
}

export interface InstitucionFiltros extends PaginacionRequest {
  codigo?: string | null;
  nombre?: string | null;
  nit?: string | null;
  estado?: EstadoRegistro | null;
}
