import { Semestre } from '../../semestres/model/semestre.model';
import { Docente } from '../../docentes/model/docente.model';

export type DiaSemana =
  | 'LUNES'
  | 'MARTES'
  | 'MIERCOLES'
  | 'JUEVES'
  | 'VIERNES'
  | 'SABADO'
  | 'DOMINGO';

export interface Materia {
  id?: number | null;
  nombre?: string;
  intensidadHoraria?: number | null;

  diaSemana?: DiaSemana | null;
  horaInicio?: string | null;
  horaFin?: string | null;

  semestreId?: number | null;
  semestreNombre?: string | null;
  semestre?: Semestre | { id?: number; nombre?: string } | null;

  programaId?: number | null;
  programaNombre?: string | null;

  institucionId?: number | null;
  institucionNombre?: string | null;

  docenteId?: number | null;
  docenteNombre?: string | null;
  docente?: Docente | {
    id?: number;
    nombres?: string;
    apellidos?: string;
  } | null;

  sedeId?: number | null;
  estado?: string | boolean | null;

  [key: string]: unknown;
}

export interface MateriaRequest {
  nombre: string;
  intensidadHoraria?: number | null;

  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;

  semestreId: number;
  institucionId?: number | null;
  sedeId?: number | null;
  docenteId?: number | null;
  estado?: string | boolean | null;
}

export interface MateriaUpdateRequest extends MateriaRequest {}

export type MateriaResponse = Materia;
