import { Rol } from '../enums/rol.enum';

export interface SessionUsuario {
  token: string;
  tipo: string;
  email: string;
  rol: Rol | string;
  institucionId: number;
}

