export enum EstadoRegistro {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  ANULADO = 'ANULADO',
  PENDIENTE = 'PENDIENTE'
}

export const ESTADOS_REGISTRO = Object.values(EstadoRegistro) as EstadoRegistro[];

export function estadoRegistroLabel(estado?: EstadoRegistro | string | null | undefined): string {
  if (!estado) return '—';
  switch (String(estado)) {
    case EstadoRegistro.ACTIVO:
      return 'Activo';
    case EstadoRegistro.INACTIVO:
      return 'Inactivo';
    case EstadoRegistro.ANULADO:
      return 'Anulado';
    case EstadoRegistro.PENDIENTE:
      return 'Pendiente';
    default:
      return String(estado).toString();
  }
}



