// features/auth/adapters/index.ts

import { AuthAdapter } from './AuthAdapter.interface';
import { SupabaseAuthAdapter } from './SupabaseAuthAdapter';

type AuthProvider = 'supabase' | 'auth0' | 'cognito';

interface AuthConfig {
  provider: AuthProvider;
  supabase?: {
    url: string;
    anonKey: string;
  };
  auth0?: {
    domain: string;
    clientId: string;
  };
  cognito?: {
    region: string;
    userPoolId: string;
    clientId: string;
  };
}

/**
 * Factory function to create the appropriate auth adapter based on configuration.
 * This is the single place where you switch providers.
 */
export function createAuthAdapter(config: AuthConfig): AuthAdapter {
  switch (config.provider) {
    case 'supabase':
      if (!config.supabase) {
        throw new Error('Supabase configuration is required');
      }
      return new SupabaseAuthAdapter(config.supabase.url, config.supabase.anonKey);

    case 'auth0':
      // Future: return new Auth0Adapter(config.auth0);
      throw new Error('Auth0 adapter not yet implemented');

    case 'cognito':
      // Future: return new CognitoAdapter(config.cognito);
      throw new Error('Cognito adapter not yet implemented');

    default:
      throw new Error(`Unknown auth provider: ${config.provider}`);
  }
}

export type { AuthAdapter };
