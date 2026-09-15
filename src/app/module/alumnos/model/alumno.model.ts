export interface AlumnoRequest {
  nombres: string;
  apellidos: string;
  documento: string;
  correo?: string;
  telefono?: string;
  institucionId: number;
  sedeId: number;
  semestreId?: number | null;
  materiaIds?: number[];
}

export interface AlumnoResponse {
  id: number;
  nombres: string;
  apellidos: string;
  documento: string;
  correo?: string;
  telefono?: string;
  institucionId: number;
  sedeId: number;
  semestreId?: number | null;
  materiaIds?: number[];
}

export interface Alumno extends AlumnoResponse {}

