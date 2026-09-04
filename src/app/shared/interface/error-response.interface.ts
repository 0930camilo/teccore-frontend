export interface ErrorResponse {
  message?: string;
  error?: string;
  status?: number;
  errors?: string[];
  data?: unknown;
}

