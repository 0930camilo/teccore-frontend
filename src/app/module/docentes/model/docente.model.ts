export interface Docente {
  id?: number | null;
  nombres?: string;
  apellidos?: string;
  documento?: string;
  correo?: string | null;
  cargaHorariaSemanal?: number | null;
  institucionId?: number | null;
  [key: string]: unknown;
}

export interface DocenteRequest {
  nombres: string;
  apellidos: string;
  documento: string;
  correo?: string | null;
  cargaHorariaSemanal?: number | null;
  institucionId?: number | null;
}

export type DocenteResponse = Docente;
