// features/auth/types/auth.types.ts

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  metadata?: Record<string, unknown>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  metadata?: Record<string, unknown>;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export type AuthError = {
  code: string;
  message: string;
  details?: unknown;
};

export type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: AuthError };
