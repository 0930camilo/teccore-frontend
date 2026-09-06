export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
  institucionId?: number | null;
  sedeId?: number | null;
  rol: string;
}

