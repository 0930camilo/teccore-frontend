import { Rol } from '../enums/rol.enum';

export interface SessionUsuario {
  token: string;
  tipo: 'Bearer' | string;
  email: string;
  rol: Rol | string;
  institucionId: number | null;
}

