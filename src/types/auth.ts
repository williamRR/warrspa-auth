export interface User {
  id: string;
  tenant_id: string;
  email: string;
  password_hash: string;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    email_verified: boolean;
  };
}

export interface JwtPayload {
  sub: string;
  tenant: string;
  email: string;
  email_verified: boolean;
  iat: number;
  exp: number;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface CreateApiKeyRequest {
  name: string;
  expires_in_days?: number;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  key: string;
  prefix: string;
  expires_at: Date | null;
  created_at: Date;
}

export interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
