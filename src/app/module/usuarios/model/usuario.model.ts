import { Rol } from '../../../shared/enums/rol.enum';
import { EstadoRegistro } from '../../../shared/enums/estado-registro.enum';
import { PaginacionRequest } from '../../../shared/interface/pagination.interface';

export interface Usuario {
  id?: number;
  nombre?: string;
  email?: string;
  rol?: Rol | string;
  institucionId?: number | null;
  institucionNombre?: string | null;
  estado?: EstadoRegistro | string | null;
}

export interface UsuarioFiltros extends PaginacionRequest {
  q?: string;
  rol?: Rol | string;
  nombre?: string;
  institucionId?: number | null;
}

export interface UsuarioUpdateRequest {
  nombre: string;
  email: string;
  rol: Rol | string;
  institucionId?: number | null;
  estado: EstadoRegistro | string;
}


