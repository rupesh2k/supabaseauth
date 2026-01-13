// config/auth.config.ts

const authConfig = {
  provider: (import.meta.env.VITE_AUTH_PROVIDER || 'supabase') as 'supabase' | 'auth0' | 'cognito',
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  // Future providers:
  // auth0: { ... },
  // cognito: { ... },
} as const;

export default authConfig;
