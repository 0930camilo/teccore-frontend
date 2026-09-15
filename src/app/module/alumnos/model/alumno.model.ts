export interface Alumno {
  id?: number | null;
  nombres?: string;
  apellidos?: string;
  documento?: string;
  correo?: string | null;
  telefono?: string | null;
  institucionId?: number | null;
  sedeId?: number | null;
  semestreId?: number | null;
  materiaIds?: number[];
  [key: string]: unknown;
}

export interface AlumnoRequest {
  nombres: string;
  apellidos: string;
  documento: string;
  correo?: string | null;
  telefono?: string | null;
  institucionId?: number | null;
  sedeId?: number | null;
  semestreId?: number | null;
  materiaIds?: number[];
}

export type AlumnoResponse = Alumno;
