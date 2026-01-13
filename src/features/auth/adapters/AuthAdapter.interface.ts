// features/auth/adapters/AuthAdapter.interface.ts

import { User, AuthTokens, LoginCredentials, SignupCredentials, AuthResult } from '../types/auth.types';

/**
 * Provider-agnostic authentication adapter interface.
 * All auth providers (Supabase, Auth0, Cognito, etc.) must implement this contract.
 */
export interface AuthAdapter {
  /**
   * Initialize the adapter (e.g., restore session from storage)
   */
  initialize(): Promise<AuthResult<{ user: User; tokens: AuthTokens } | null>>;

  /**
   * Sign in with email/password
   */
  login(credentials: LoginCredentials): Promise<AuthResult<{ user: User; tokens: AuthTokens }>>;

  /**
   * Sign up with email/password
   */
  signup(credentials: SignupCredentials): Promise<AuthResult<{ user: User; tokens: AuthTokens }>>;

  /**
   * Sign out the current user
   */
  logout(): Promise<AuthResult<void>>;

  /**
   * Get current user from provider
   */
  getCurrentUser(): Promise<AuthResult<User | null>>;

  /**
   * Get valid access token (refreshes if needed)
   */
  getAccessToken(): Promise<string | null>;

  /**
   * Refresh the access token
   */
  refreshToken(): Promise<AuthResult<AuthTokens>>;

  /**
   * Password reset request
   */
  requestPasswordReset(email: string): Promise<AuthResult<void>>;

  /**
   * Update password
   */
  updatePassword(newPassword: string): Promise<AuthResult<void>>;

  /**
   * Listen to auth state changes (returns unsubscribe function)
   */
  onAuthStateChange(callback: (user: User | null, tokens: AuthTokens | null) => void): () => void;
}
