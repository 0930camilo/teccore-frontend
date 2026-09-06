export interface Programa {
  id?: number;
  nombre?: string;
  duracionSemestres?: number | null;
  nivel?: string | null;
  costoSemestral?: number | null;
  institucionId?: number | null;
}

export interface ProgramaRequest {
  nombre: string;
  duracionSemestres?: number | null;
  nivel?: string | null;
  costoSemestral?: number | null;
  institucionId: number;
}

export type ProgramaUpdateRequest = ProgramaRequest;

