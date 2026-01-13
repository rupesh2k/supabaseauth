// features/auth/context/AuthContext.tsx

import React, { createContext, useEffect, useState, useCallback, useMemo } from 'react';
import { AuthAdapter, createAuthAdapter } from '../adapters';
import { User, AuthTokens, LoginCredentials, SignupCredentials, AuthState } from '../types/auth.types';
import authConfig from '../../../config/auth.config';

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  signup: (credentials: SignupCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  adapter?: AuthAdapter; // Allow injection for testing
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, adapter: injectedAdapter }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Use injected adapter (for testing) or create from config
  const adapter = useMemo(
    () => injectedAdapter || createAuthAdapter(authConfig),
    [injectedAdapter]
  );

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const result = await adapter.initialize();

      if (!mounted) return;

      if (result.success && result.data) {
        setState({
          user: result.data.user,
          tokens: result.data.tokens,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState({
          user: null,
          tokens: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [adapter]);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = adapter.onAuthStateChange((user, tokens) => {
      setState({
        user,
        tokens,
        isLoading: false,
        isAuthenticated: user !== null,
      });
    });

    return unsubscribe;
  }, [adapter]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      const result = await adapter.login(credentials);

      if (result.success) {
        setState({
          user: result.data.user,
          tokens: result.data.tokens,
          isLoading: false,
          isAuthenticated: true,
        });
        return { success: true };
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { success: false, error: result.error.message };
      }
    },
    [adapter]
  );

  const signup = useCallback(
    async (credentials: SignupCredentials) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      const result = await adapter.signup(credentials);

      if (result.success) {
        setState({
          user: result.data.user,
          tokens: result.data.tokens,
          isLoading: false,
          isAuthenticated: true,
        });
        return { success: true };
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { success: false, error: result.error.message };
      }
    },
    [adapter]
  );

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    await adapter.logout();

    setState({
      user: null,
      tokens: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, [adapter]);

  const refreshAuth = useCallback(async () => {
    const result = await adapter.getCurrentUser();

    if (result.success && result.data) {
      setState((prev) => ({
        ...prev,
        user: result.data,
        isAuthenticated: true,
      }));
    }
  }, [adapter]);

  const getAccessToken = useCallback(async () => {
    return adapter.getAccessToken();
  }, [adapter]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      signup,
      logout,
      refreshAuth,
      getAccessToken,
    }),
    [state, login, signup, logout, refreshAuth, getAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
