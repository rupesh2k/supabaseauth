// features/auth/adapters/__tests__/MockAuthAdapter.ts

import { AuthAdapter } from '../AuthAdapter.interface';
import { User, AuthTokens, LoginCredentials, SignupCredentials, AuthResult } from '../../types/auth.types';

export class MockAuthAdapter implements AuthAdapter {
  private mockUser: User | null = null;
  private mockTokens: AuthTokens | null = null;
  private authStateCallbacks: Array<(user: User | null, tokens: AuthTokens | null) => void> = [];

  // Configurable responses for testing
  public shouldFailLogin = false;
  public shouldFailSignup = false;

  async initialize(): Promise<AuthResult<{ user: User; tokens: AuthTokens } | null>> {
    if (this.mockUser && this.mockTokens) {
      return { success: true, data: { user: this.mockUser, tokens: this.mockTokens } };
    }
    return { success: true, data: null };
  }

  async login(credentials: LoginCredentials): Promise<AuthResult<{ user: User; tokens: AuthTokens }>> {
    if (this.shouldFailLogin) {
      return { success: false, error: { code: 'MOCK_ERROR', message: 'Mock login failed' } };
    }

    this.mockUser = {
      id: 'mock-user-id',
      email: credentials.email,
      emailVerified: true,
    };

    this.mockTokens = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    this.notifyAuthStateChange();

    return { success: true, data: { user: this.mockUser, tokens: this.mockTokens } };
  }

  async signup(credentials: SignupCredentials): Promise<AuthResult<{ user: User; tokens: AuthTokens }>> {
    if (this.shouldFailSignup) {
      return { success: false, error: { code: 'MOCK_ERROR', message: 'Mock signup failed' } };
    }

    return this.login(credentials);
  }

  async logout(): Promise<AuthResult<void>> {
    this.mockUser = null;
    this.mockTokens = null;
    this.notifyAuthStateChange();
    return { success: true, data: undefined };
  }

  async getCurrentUser(): Promise<AuthResult<User | null>> {
    return { success: true, data: this.mockUser };
  }

  async getAccessToken(): Promise<string | null> {
    return this.mockTokens?.accessToken ?? null;
  }

  async refreshToken(): Promise<AuthResult<AuthTokens>> {
    if (!this.mockTokens) {
      return { success: false, error: { code: 'NO_TOKEN', message: 'No token to refresh' } };
    }
    return { success: true, data: this.mockTokens };
  }

  async requestPasswordReset(_email: string): Promise<AuthResult<void>> {
    return { success: true, data: undefined };
  }

  async updatePassword(_newPassword: string): Promise<AuthResult<void>> {
    return { success: true, data: undefined };
  }

  onAuthStateChange(callback: (user: User | null, tokens: AuthTokens | null) => void): () => void {
    this.authStateCallbacks.push(callback);
    return () => {
      this.authStateCallbacks = this.authStateCallbacks.filter((cb) => cb !== callback);
    };
  }

  private notifyAuthStateChange(): void {
    this.authStateCallbacks.forEach((callback) => {
      callback(this.mockUser, this.mockTokens);
    });
  }
}
