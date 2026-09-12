import { Programa } from '../../programas/model/programa.model';

export interface Semestre {
  id?: number;
  nombre?: string;
  numero?: number;
  anio?: number;
  programaId?: number | null;
  programaNombre?: string | null;
  programa?: Programa | { id?: number; nombre?: string } | null;
  institucionId?: number | null;
  sedeId?: number | null;
}

export interface SemestreRequest {
  nombre: string;
  numero?: number | null;
  anio?: number | null;
  programaId?: number | null;
  institucionId?: number | null;
  sedeId?: number | null;
}

export type SemestreUpdateRequest = SemestreRequest;

