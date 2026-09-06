import { EstadoRegistro } from '../../../shared/enums/estado-registro.enum';
import { PaginacionRequest } from '../../../shared/interface/pagination.interface';

export interface Sede {
  id?: number;
  nombre?: string;
  ciudad?: string | null;
  direccion?: string | null;
  estado?: EstadoRegistro | string | null;
  institucionId?: number | null;
  institucionNombre?: string | null;
}

export interface SedeRequest {
  nombre: string;
  ciudad?: string | null;
  direccion?: string | null;
  institucionId?: number | null;
  estado?: EstadoRegistro | string | null;
}

export interface SedeUpdateRequest {
  nombre: string;
  ciudad?: string | null;
  direccion?: string | null;
  institucionId?: number | null;
  estado?: EstadoRegistro | string | null;
}

export interface SedeFiltros extends PaginacionRequest {
  nombre?: string | null;
  ciudad?: string | null;
  estado?: EstadoRegistro | null;
}
