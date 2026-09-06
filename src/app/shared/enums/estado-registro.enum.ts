export enum EstadoRegistro {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  ANULADO = 'ANULADO',
  PENDIENTE = 'PENDIENTE'
}

export const ESTADOS_REGISTRO = Object.values(EstadoRegistro) as EstadoRegistro[];



