// features/auth/adapters/SupabaseAuthAdapter.ts

import { createClient, SupabaseClient, AuthError as SupabaseAuthError } from '@supabase/supabase-js';
import { AuthAdapter } from './AuthAdapter.interface';
import { User, AuthTokens, LoginCredentials, SignupCredentials, AuthResult, AuthError } from '../types/auth.types';

/**
 * Supabase implementation of AuthAdapter.
 * This is the ONLY file that imports from @supabase/supabase-js.
 */
export class SupabaseAuthAdapter implements AuthAdapter {
  private client: SupabaseClient;

  constructor(supabaseUrl: string, supabaseAnonKey: string) {
    this.client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  async initialize(): Promise<AuthResult<{ user: User; tokens: AuthTokens } | null>> {
    try {
      const { data, error } = await this.client.auth.getSession();

      if (error) {
        return this.handleError(error);
      }

      if (!data.session) {
        return { success: true, data: null };
      }

      return {
        success: true,
        data: {
          user: this.mapUser(data.session.user),
          tokens: this.mapTokens(data.session),
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResult<{ user: User; tokens: AuthTokens }>> {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return this.handleError(error);
      }

      if (!data.session || !data.user) {
        return {
          success: false,
          error: { code: 'NO_SESSION', message: 'Login failed: no session returned' },
        };
      }

      return {
        success: true,
        data: {
          user: this.mapUser(data.user),
          tokens: this.mapTokens(data.session),
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async signup(credentials: SignupCredentials): Promise<AuthResult<{ user: User; tokens: AuthTokens }>> {
    try {
      const { data, error } = await this.client.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: credentials.metadata,
        },
      });

      if (error) {
        return this.handleError(error);
      }

      if (!data.session || !data.user) {
        return {
          success: false,
          error: {
            code: 'NO_SESSION',
            message: 'Signup succeeded but no session. Check email for verification.'
          },
        };
      }

      return {
        success: true,
        data: {
          user: this.mapUser(data.user),
          tokens: this.mapTokens(data.session),
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async logout(): Promise<AuthResult<void>> {
    try {
      const { error } = await this.client.auth.signOut();

      if (error) {
        return this.handleError(error);
      }

      return { success: true, data: undefined };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getCurrentUser(): Promise<AuthResult<User | null>> {
    try {
      const { data, error } = await this.client.auth.getUser();

      if (error) {
        return this.handleError(error);
      }

      return {
        success: true,
        data: data.user ? this.mapUser(data.user) : null,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      const { data } = await this.client.auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      return null;
    }
  }

  async refreshToken(): Promise<AuthResult<AuthTokens>> {
    try {
      const { data, error } = await this.client.auth.refreshSession();

      if (error) {
        return this.handleError(error);
      }

      if (!data.session) {
        return {
          success: false,
          error: { code: 'NO_SESSION', message: 'Token refresh failed' },
        };
      }

      return {
        success: true,
        data: this.mapTokens(data.session),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async requestPasswordReset(email: string): Promise<AuthResult<void>> {
    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return this.handleError(error);
      }

      return { success: true, data: undefined };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updatePassword(newPassword: string): Promise<AuthResult<void>> {
    try {
      const { error } = await this.client.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return this.handleError(error);
      }

      return { success: true, data: undefined };
    } catch (error) {
      return this.handleError(error);
    }
  }

  onAuthStateChange(callback: (user: User | null, tokens: AuthTokens | null) => void): () => void {
    const { data: subscription } = this.client.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ? this.mapUser(session.user) : null;
      const tokens = session ? this.mapTokens(session) : null;
      callback(user, tokens);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }

  // ========== Private Mapping Methods ==========

  private mapUser(supabaseUser: any): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      emailVerified: supabaseUser.email_confirmed_at !== null,
      metadata: supabaseUser.user_metadata,
    };
  }

  private mapTokens(session: any): AuthTokens {
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at,
    };
  }

  private handleError(error: unknown): { success: false; error: AuthError } {
    if (this.isSupabaseError(error)) {
      return {
        success: false,
        error: {
          code: error.status?.toString() || 'UNKNOWN',
          message: error.message,
          details: error,
        },
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN',
          message: error.message,
          details: error,
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'UNKNOWN',
        message: 'An unknown error occurred',
        details: error,
      },
    };
  }

  private isSupabaseError(error: unknown): error is SupabaseAuthError {
    return typeof error === 'object' && error !== null && 'message' in error;
  }
}
