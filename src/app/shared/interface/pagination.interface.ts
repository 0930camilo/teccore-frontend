import { EstadoRegistro } from '../enums/estado-registro.enum';

export interface PaginacionRequest {
  q?: string | null;
  nombre?: string | null;
  page: number;
  size: number;
  // filtros opcionales comunes para listados (p. ej. estado)
  estado?: EstadoRegistro | string | null;
}

export interface PaginacionRespuesta<T> {
  content?: T[];
  items?: T[];
  data?: T[];
  totalElements?: number;
  total?: number;
  page?: number;
  size?: number;
  totalPages?: number;
}

