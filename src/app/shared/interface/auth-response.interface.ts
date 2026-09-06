export interface AuthResponse {
  token: string;
  tipo: 'Bearer' | string;
  email: string;
  rol: string;
  institucionId: number | null;
  sedeId?: number | null;
}

