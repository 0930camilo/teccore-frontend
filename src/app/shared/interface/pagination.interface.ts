export interface PaginacionRequest {
  q?: string;
  page: number;
  size: number;
}

export interface PaginacionRespuesta<T> {
  content?: T[];
  items?: T[];
  data?: T[];
  totalElements?: number;
  total?: number;
  page?: number;
  size?: number;
  totalPages?: number;
}

