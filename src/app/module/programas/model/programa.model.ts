import { EstadoRegistro } from '../../../shared/enums/estado-registro.enum';

export interface Programa {
  id?: number;
  nombre?: string;
  duracionSemestres?: number | null;
  nivel?: string | null;
  costoSemestral?: number | null;
  estado?: EstadoRegistro | string | null;
  institucionId?: number | null;
  sedeId?: number | null;
}

export interface ProgramaRequest {
  nombre: string;
  duracionSemestres?: number | null;
  nivel?: string | null;
  costoSemestral?: number | null;
  estado?: EstadoRegistro | string | null;
  sedeId: number;
}

export type ProgramaUpdateRequest = ProgramaRequest;
